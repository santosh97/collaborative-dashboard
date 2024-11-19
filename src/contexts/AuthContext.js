/*******
 * src/contexts/AuthContext.js: login/logout Provider
 * 
 * 11/2024 Santosh Dubey
 *
 */
import React, { createContext, useState, useEffect } from 'react';
import api from './api';  // Import your api.js instance

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            // Attempt to fetch user data only if token exists
            api.get('/auth')  // Use the centralized API instance
                .then((response) => {
                    setUser(response.data.user);  // Set the user if token is valid
                })
                .catch(() => {
                    setUser(null);  // Logout if fetching user data fails
                });
        }
    }, []);

    const login = (token, userData) => {
        localStorage.setItem('jwtToken', token);
        setUser(userData);  // Store user data after successful login
    };

    const logout = () => {
        localStorage.removeItem('jwtToken');
        setUser(null);  // Clear user data on logout
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;

