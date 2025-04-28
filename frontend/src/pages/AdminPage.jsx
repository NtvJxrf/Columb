import { useState, useEffect } from 'react'
import { Button, Form, Input, message, Select, Popconfirm, Table } from 'antd';
import axios from 'axios';
const AdminPage = () => {
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()
  const [isDisabled, setIsDisabled] = useState(false)
  const onFinish = async values => {
    try{
      setIsDisabled(true)
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/user/createUser`, {...values, creatorId: localStorage.getItem('id')}, {withCredentials: true})
      console.log(response)
      if(response.status != 201)
        throw new Error(response)
      messageApi.success(`Пользователь ${values.username} создан`)
      setIsDisabled(false)
      fetchUsers()
    }catch(error){
      console.error(error)
      messageApi.error(`Ошибка при создании пользователя, ${error?.response?.data?.message}`)
      setIsDisabled(false)
    }
  };

  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/getUsers`, {withCredentials: true });
      setUsers(res.data);
    } catch (err) {
      console.error("Ошибка при загрузке пользователей:", err);
    }
  };

  const deleteUser = async (id, force = false) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/user/deleteUser`, {
        data: { userToDelete: id, force },
        withCredentials: true
      });
      console.log('УДАЛИЛ')
      messageApi.success("Пользователь удален");
      fetchUsers();
    } catch (err) {
      console.error("Ошибка при удалении пользователя:", err);
      messageApi.error(`Ошибка при удалении пользователя, ${err?.response?.data?.message}`)
    }
  };

  const restoreUser = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/user/restoreUser`, {
        data: { userToRestore: id },
        withCredentials: true
      });
      messageApi.success("Пользователь восстановлен");
      fetchUsers();
    } catch (err) {
      console.error("Ошибка при восстановлении пользователя:", err);
      messageApi.error(`Ошибка при восстановлении пользователя, ${err?.response?.data?.message}`)
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: '25%' },
    { title: "Логин", dataIndex: "username", key: "username", width: '25%' },
    { title: "Роль", dataIndex: "role", key: "role", width: '25%' },
    {
      title: "Действия",
      key: "actions",
      render: (_, record) => (
        <Popconfirm title="Удалить пользователя?" onConfirm={() => deleteUser(record.id)}>
          <Button danger>Удалить</Button>
        </Popconfirm>
        
      ), width: '25%'
    },
  ];

  const columns2 = [
    { title: "ID", dataIndex: "id", key: "id", width: '25%' },
    { title: "Логин", dataIndex: "username", key: "username", width: '25%' },
    { title: "Роль", dataIndex: "role", key: "role", width: '25%' },
    {
      title: "Действия",
      key: "actions",
      render: (_, record) => (
        <>
          <Popconfirm title="Восстановить пользователя?" onConfirm={() => restoreUser(record.id)}>
            <Button>Восстановить</Button>
          </Popconfirm>
          <Popconfirm title="Вы уверены?Удаление пользователя навсегда удалит все записи связанные с ним" onConfirm={() => deleteUser(record.id, true)}>
            <Button>Удалить навсегда</Button>
          </Popconfirm>
        </>
      ), width: '25%'
    },
  ];

  return (
    <>
      {contextHolder}
      <Form
        form={form}
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 300 }}
        initialValues={{ remember: true }}
        onFinish={onFinish}
        autoComplete="off"
        size='small'
      >
        <Form.Item
          label="Имя"
          name="username"
          rules={[
            { required: true, message: 'Введите имя пользователя' },
            { min: 3, message: 'Имя должно быть не короче 3 символов' },
            { max: 16, message: 'Имя должно быть не длиннее 20 символов' },
            { pattern: /^[a-zA-Z0-9_]+$/, message: 'Имя может содержать только буквы, цифры и _' },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Пароль"
          name="password"
          rules={[
            { required: true, message: 'Введите пароль' },
            { min: 8, message: 'Пароль должен быть не менее 8 символов' },
            { max: 64, message: 'Пароль слишком длинный' },
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          label='Роль'
          name='role'
        >
          <Select>
            <Select.Option value='admin' key='admin'/>
            <Select.Option value='user' key='user'/>
          </Select>
        </Form.Item>
        <Form.Item label={null}>
          <Button type="primary" htmlType="submit" disabled={isDisabled}>
            Создать
          </Button>
        </Form.Item>
      </Form>

      <div style={{ padding: "20px" }}>
        <h2>Список пользователей</h2>
        <Table dataSource={users.filter(el => !el.deletedAt)} columns={columns} rowKey="id" />
        <h2>Отстраненные пользователи</h2>
        <Table dataSource={users.filter(el => el.deletedAt)} columns={columns2} rowKey="id" />
      </div>

    </>
  )
};

export default AdminPage;
