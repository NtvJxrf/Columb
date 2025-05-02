import React from "react";
import { Routes, Route, Outlet,  } from "react-router-dom";
import { Layout } from 'antd'
import Sidebar from "../components/Sidebar"
import CalcsLayout from './CalcsLayout'
import ProtectedRoute from '../components/ProtectedRoute'
import AdminPage from "../pages/AdminPage";
import OzonPage from '../pages/OzonPage'
import LogsPage from '../pages/LogsPage'
const { Content } = Layout;



const contentStyle = {
  padding: "30px",
  minHeight: "100vh"
};

function MainLayout() {
  return (
    <Layout>
      <Sidebar />
      <Content style={contentStyle}>
        <Routes>
          <Route path="/calcs/falshbort" element={<CalcsLayout type={'fbort'}/>} />
          <Route path="/calcs/ballons" element={<CalcsLayout type={'ballons'}/>} />
          <Route path="/calcs/mattress" element={<CalcsLayout type={'mattress'}/>} />
          <Route path="/ozon" element={<OzonPage />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/logs" 
            element={
              <ProtectedRoute requiredRole="admin">
                <LogsPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
        <Outlet />
      </Content>
    </Layout>
  );
}

export default MainLayout;