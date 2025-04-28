import React, { useEffect, useState } from 'react';
import { Form, InputNumber, Select, Button, message } from 'antd';
import axios from 'axios';

const DynamicForm = ({ fields, defaultValues, storageKey, type, data, onResults, externalForm }) => {
    const [messageApi, contextHolder] = message.useMessage()
    const [internalForm] = Form.useForm();
    const [isDisabled, setIsDisabled] = useState(false)
    const form = externalForm ?? internalForm;
    const onFinish = async values => {
        setIsDisabled(true)
        localStorage.setItem(storageKey, JSON.stringify(values));
        try{
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/calc/calculate`, { values, type }, { withCredentials: true })
            onResults?.(response.data);
            setIsDisabled(false)
            messageApi.success('Расчет получен')
        }  
        catch(error){
            console.error('Ошибка при расчете', error)
            messageApi.error('Ошибка при расчете')
            setIsDisabled(false)
        }
    };

    useEffect(() => {
        const stored = data || JSON.parse(localStorage.getItem(storageKey));
        form.setFieldsValue(stored || defaultValues);
    }, [form, data, storageKey, defaultValues])

    return (
        <>
            {contextHolder}
            <Form
            form={form}
            layout="horizontal"
            labelAlign="left"
            labelCol={{ span: 16 }}
            wrapperCol={{ span: 8 }}
            size="small"
            onFinish={onFinish}
            >
            {fields.map(field => (
                <Form.Item key={field.name} label={field.label} name={field.name}>
                {field.type === 'select' ? (
                    <Select>
                    {field.options.map(opt => (
                        <Select.Option key={opt.value} value={opt.value}>
                            {opt.label}
                        </Select.Option>
                    ))}
                    </Select>
                ) : (
                    <InputNumber style={{ width: '100%' }} {...field.props} />
                )}
                </Form.Item>
            ))}
            {!data && <Form.Item style={{ display: 'flex', justifyContent: 'center' }}>
                <Button type="primary" htmlType="submit" size="large" disabled={isDisabled}>
                Рассчитать
                </Button>
            </Form.Item>}
            </Form>
        </>
    );
};

export default DynamicForm;
