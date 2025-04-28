import axios from 'axios'
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Card, Form, Input, Button, Space, Tooltip, Table, message, Flex } from "antd";
import { InfoCircleOutlined, SearchOutlined } from "@ant-design/icons";
const OzonPage = () => {
    const [messageApi, contextHolder] = message.useMessage()
    const [form] = Form.useForm();
    const [products, setProducts] = useState([])
    const handleAdd = async values => {
      setLoading(true);
      try{
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/ozon/addProduct`, values, { withCredentials: true })
        if(res.status === 200){
          messageApi.success('Товар добавлен')
          getProducts()
        }
      }catch(error){
        console.error(error)
        messageApi.error('Ошибка при добавлении товара')
      }finally{
        form.resetFields();
        setLoading(false);
      }
    };
    
    const handleSyncAll = async () => {
      setLoading(true);
        try{
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/ozon/syncAllProduct`, { withCredentials: true })
          if(res.status === 200){
            messageApi.success('Товары добавлен')
            getProducts()
          }
        }catch(error){
          console.error(error)
          messageApi.error('Ошибка при добавлении товаров')
        }finally{
          setLoading(false);
        }
    };

    const handleNullAll = async () => {
      setLoading(true);
        try{
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/ozon/nullAll`, { withCredentials: true })
          if(res.status === 200){
            messageApi.success('Товары добавлен')
            getProducts()
          }
        }catch(error){
          console.error(error)
          messageApi.error('Ошибка при добавлении товаров')
        }finally{
          setLoading(false);
        }
    }

    const InfoAboutAddingProduct = () => (
        <Tooltip title="Чтобы добавить товар для автоматического обновления, который выставлен на ozon, введите сюда offer_id товара с ozon
            Товар должен быть добавлен в MoySklad и его код должен соответствовать offer_id">
            <InfoCircleOutlined style={{ marginLeft: 8, color: "#1890ff", cursor: "pointer" }} />
        </Tooltip>
    );
    const getProducts = useCallback(async () => {
        try{
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/ozon/getProducts`, { withCredentials: true })
            const formattedData = res.data.map(el => { return {...el, updateIt: el.updateIt ? 'Да' : 'Нет'}})
            setProducts(formattedData)
        }
        catch(error){
            console.error(error)
            messageApi.error('Не удалось загрузить товары')
        }
    }, [messageApi])
    useEffect(() => {
        getProducts()
    }, [getProducts])

    const searchInput = useRef(null);
    const handleSearch = (selectedKeys, confirm) => {
      confirm();
    };
    const handleReset = clearFilters => {
      clearFilters();
    };
    const getColumnSearchProps = useCallback(dataIndex => ({
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
        <div style={{ padding: 8 }} onKeyDown={e => e.stopPropagation()}>
          <Input
            ref={searchInput}
            placeholder={`Search ${dataIndex}`}
            value={selectedKeys[0]}
            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              Search
            </Button>
            <Button
              onClick={() => clearFilters && handleReset(clearFilters)}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() => {
                confirm({ closeDropdown: false });
              }}
            >
              Filter
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() => {
                close();
              }}
            >
              close
            </Button>
          </Space>
        </div>
      ),
      filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />,
      onFilter: (value, record) =>
        record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
      filterDropdownProps: {
        onOpenChange(open) {
          if (open) {
            setTimeout(() => {
              var _a;
              return (_a = searchInput.current) === null || _a === void 0 ? void 0 : _a.select();
            }, 100);
          }
        },
      }
    }), [])

    const columns = useMemo(() => [
        Object.assign({
            title: 'Название',
            dataIndex: 'name',
            width: '80%',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        }, getColumnSearchProps('name')),
        Object.assign({
            title: 'Код/offer_id',
            dataIndex: 'code',
            width: '15%',
            key: 'code',
            sorter: (a, b) => a.code.localeCompare(b.code),
        }, getColumnSearchProps('code')),
        Object.assign({
            title: 'Обновлять',
            dataIndex: 'updateIt',
            width: '5%',
            key: 'updateIt',
            sorter: (a, b) => (a.updateIt === b.updateIt ? 0 : a.updateIt ? -1 : 1),
        }, getColumnSearchProps('updateIt')),
    ], [getColumnSearchProps]);

    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [loading, setLoading] = useState(false);
    const switchUpdate = async () => {
        setLoading(true)
        try{
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/ozon/switchUpdate`, selectedRowKeys, { withCredentials: true })
            if(response.status === 200){
                response.data.length < 1 ? messageApi.success('Переключено успешно') : messageApi.success(`Переключено частично, коды товаров которые не удалось переключить ${response.data}`)
                getProducts()
            }
            else throw new Error(response.data)
        }catch(error){
            console.error(error)
            messageApi.error('Не удалось переключить обновление')
        }finally{
            setSelectedRowKeys([]);
            setLoading(false);
        }
    };
    const onSelectChange = newSelectedRowKeys => {
        setSelectedRowKeys(newSelectedRowKeys);
    };
    const rowSelection = useMemo(() => ({
        selectedRowKeys,
        onChange: onSelectChange,
    }), [selectedRowKeys]);
    
    const hasSelected = selectedRowKeys.length > 0;


    return (
        <>
            {contextHolder}
            <Card title="Управление товарами" >
                <Form form={form} layout="inline" onFinish={handleAdd}>
                    <Form.Item
                        name="code"
                        rules={[{ required: true, message: "Введите код" }]}
                    >
                        <Input placeholder="Code" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Добавить
                        </Button>
                        <InfoAboutAddingProduct />
                    </Form.Item>
                </Form>
            
                <Space style={{ marginTop: 16 }}>
                    <Button onClick={handleSyncAll} loading={loading}>Синхронизировать все</Button>
                    <Button onClick={handleNullAll} loading={loading}>Обнулить все остатки на Ozon</Button>
                </Space>
            </Card>
            <Flex gap="middle" vertical>
                <Flex align="center" gap="middle">
                    <Button type="primary" onClick={switchUpdate} disabled={!hasSelected} loading={loading}>
                        Переключить обновление
                    </Button>
                    {hasSelected ? `Selected ${selectedRowKeys.length} items` : null}
                </Flex>
                <span>Всего позиций: {products.length}</span>
                <Table rowSelection={rowSelection} columns={columns} dataSource={products} size="small" pagination={true} rowKey="code" />
            </Flex>
        </>
      );
}

export default OzonPage