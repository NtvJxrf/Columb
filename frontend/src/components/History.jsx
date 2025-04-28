import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { Button, List, Descriptions, Divider, message, Space, Modal, Form, InputNumber, Input, Typography, Popconfirm } from "antd";
const { TextArea } = Input;
const { Text } = Typography;
import DynamicForm from "./DynamicForm";
import { formConfigs } from "../layouts/formConfigs";
const History = ({ type }) => {
    const [data, setData] = useState([]);
    const [messageApi, contextHolder] = message.useMessage()
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [comments, setComments] = useState('');
    const [markup, setMarkup] = useState(2.4);
    const [isDisabled, setIsDisabled] = useState(false)

    const formatData = useCallback((unformattedData) => {
        const result = [];
        unformattedData.forEach((el) => {
            result.push({
                data: el,
                items: [
                    {
                        key: 1,
                        label: 'Создатель',
                        children: el.creator
                    },
                    {
                        key: 2,
                        label: 'Создано',
                        children: new Date(el.createdAt).toLocaleString()
                    },
                    {
                        key: 3,
                        label: 'Обновлено',
                        children: el.createdAt === el.updatedAt ? '' : new Date(el.updatedAt).toLocaleString()
                    },
                    {
                        key: 4,
                        label: 'Комментарии',
                        children: el.comments
                            ? `${el.comments.slice(0, 50)}${el.comments.length > 50 ? '...' : ''}`
                            : '-'
                    }
                ]
            });
        });
        setData(result);
    }, []);
    

    const refreshHistory = useCallback(async () => {
        setIsDisabled(true)
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/calc/getHistory`, {
                params: { type },
                withCredentials: true,
            });
            const parsed = JSON.parse(response.data);
            formatData(parsed);
            sessionStorage.setItem(`${type}History`, response.data);
            setIsDisabled(false)
        } catch (error) {
            console.error("Ошибка при обновлении истории:", error);
            messageApi.error("Не удалось обновить историю");
            setIsDisabled(false)
        }
    }, [type, formatData, messageApi]);

    const deleteHistory = async (id) => {
        try {
            const response = await axios.delete(`${import.meta.env.VITE_API_URL}/api/calc/deleteHistory`, {
                data: { id },
                withCredentials: true
            });
            if(response.status != 200){
                throw new Error()
            }
            setData(prev => prev.filter(entry => entry.data.id !== id));
            sessionStorage.removeItem(`${type}History`);
            messageApi.success('Удалено успешно');
        } catch (error) {
            console.error('Ошибка при удалении:', error);
            messageApi.error('Ошибка при удалении');
        }
    }
    const [form] = Form.useForm()
    const handleOk = async () => {
        const initData = form.getFieldsValue()
        try{
            const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/calc/updateHistory`,{
                    toChange: { id: selectedItem.id, comments, markup, initData }
                },{
                    withCredentials: true
                }
            );
            if(response.status != 200)
                throw new Error(response)
            messageApi.success('Обновлено успешно');
            refreshHistory()
            setIsModalOpen(false)
        }catch(error){
            console.error('Ошибка при обновлении:', error);
            messageApi.error('Ошибка при обновлении');
        }
    }

    const handleCancel = () => {
        setSelectedItem(null)
        setIsModalOpen(false)
    }
    useEffect(() => {
        refreshHistory()
    }, [refreshHistory])

    useEffect(() => {
        if (selectedItem) {
            setComments(selectedItem.comments || '')
            setMarkup(selectedItem.markup || 2.4)
        }
    }, [selectedItem])

    return (
        <>
            {contextHolder}
            <Divider>История</Divider>
            <Space style={{ marginBottom: 16 }}>
                <Button onClick={refreshHistory} disabled={isDisabled}>
                    Обновить
                </Button>
            </Space>
            <List 
                itemLayout="horizontal"
                dataSource={data}
                renderItem={(item) => (
                    <List.Item>
                        <Descriptions title="Info" items={item.items} />
                        <Button size="small" onClick={() => {
                            setSelectedItem(item.data)
                            setIsModalOpen(true)
                        }}>
                            Редактировать
                        </Button>
                        <Popconfirm title="Удалить запись?" onConfirm={() => deleteHistory(item.data.id)}>
                            <Button danger size="small">Удалить</Button>
                        </Popconfirm>
                    </List.Item>
                )}
            />
            <Modal title="Редактировать заметку" open={isModalOpen} onOk={handleOk} onCancel={handleCancel} okText="Сохранить" cancelText="Отмена">
            {selectedItem && (
                <>
                    <DynamicForm fields={formConfigs[type].fields} data={JSON.parse(selectedItem.initData)} externalForm={form}/>
                    <TextArea style={{ width: '100%', minHeight: 80}} autoSize={true} value={comments  || ''}
                        onChange={value => setComments(value.target.value)}/>
                    <Space >
                        <Text strong>Наценка:</Text>
                        <InputNumber
                            min={0}
                            step={0.1}
                            value={markup}
                            onChange={value => setMarkup(value)}
                        />
                    </Space>
                </>
            )}
            </Modal>
        </>
    )
}

export default History