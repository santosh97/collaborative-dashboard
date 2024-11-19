/*******
 * src/api.js: API 
 * 
 * 11/2024 Santosh Dubey
 *
 */

import axios from 'axios';

const API_BASE_URL = 'https://collaborative-dashboard-backend.onrender.com/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Add a request interceptor to include the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
