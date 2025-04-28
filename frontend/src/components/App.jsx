import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage.jsx";
import MainLayout from "../layouts/MainLayout.jsx";
import axios from "axios";

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/isAuthenticated`, 
          { withCredentials: true }
        );
        setIsAuth(response.data.auth === true);
      } catch{
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
      <Router>
        <Routes>
          <Route
            path="/login"
            element={!isAuth ? <LoginPage setIsAuth={setIsAuth} /> : <Navigate to="/" replace />} 
          />
          <Route
            path="/*"
            element={isAuth ? <MainLayout /> : <Navigate to="/login" replace />}
          />
        </Routes>
    </Router>
  );
}

export default App;