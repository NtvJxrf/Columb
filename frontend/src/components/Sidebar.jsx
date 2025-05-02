import React from "react";
import { Link } from "react-router-dom";
import { Layout, Menu, Button } from 'antd';
import axios from "axios";
const { Sider } = Layout

function getItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
  };
}

const items = [
  getItem(<Link to="/calcs/ballons">Баллоны</Link>, "1"),
  getItem(<Link to="/calcs/falshbort">Фальшборта</Link>, "2"),
  getItem(<Link to="/calcs/mattress">Матрасы</Link>, "3"),
  getItem(<Link to="/ozon">Ozon</Link>, "5")
];




function Sidebar() {
  // const navigate = useNavigate();

  const role = localStorage.getItem("role")
  if (role === 'admin') {
    items.push(getItem(<Link to="/admin">Админка</Link>, "4"));
    items.push(getItem(<Link to="/logs">Логи</Link>, "6"));
  }

  const handleLogout = async () => {
    localStorage.removeItem("user"); 
    localStorage.removeItem("role");
    localStorage.removeItem("id");
    try {
      await axios.get(`${import.meta.env.VITE_API_URL}/api/user/logout`, { withCredentials: true })
      window.location.replace("/login");
      //navigate("/login");
    } catch (error) {
      console.error("Ошибка при логауте:", error);
      window.location.replace("/login");
      // navigate("/login");
    }
  };

  return (
          <Sider width="10%" >
            <Menu theme="dark" defaultSelectedKeys={['1']} mode='vertical' items={items} />
            <Button 
              type="default" 
              block 
              onClick={handleLogout}
            >
              Выйти
            </Button>
          </Sider>
  )
}

export default Sidebar