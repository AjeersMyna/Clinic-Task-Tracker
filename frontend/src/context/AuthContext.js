// frontend/src/context/AuthContext.js

import axios from 'axios';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const { data } = await axios.post(
        'http://localhost:5000/api/users/login',
        { email, password },
        config
      );
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Login failed:', error.response ? error.response.data.message : error.message);
      throw error.response ? error.response.data.message : 'Login failed';
    }
  };

  // UPDATED: register function - Corrected API endpoint URL
  const register = async (name, email, password, username, role = 'patient') => { // Added default role
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const { data } = await axios.post(
        // IMPORTANT CHANGE: Corrected URL from '/api/users/register' to '/api/users'
        'http://localhost:5000/api/users', // This matches router.post('/', registerUser)
        { name, email, password, username, role }, // Included role
        config
      );
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Registration failed:', error.response ? error.response.data.message : error.message);
      throw error.response ? error.response.data.message : 'Registration failed';
    }
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};