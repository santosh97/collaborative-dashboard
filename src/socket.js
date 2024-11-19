/*******
 * src/socket.js: Sockect init
 * 
 * 11/2024 Santosh Dubey
 *
 */
import { io } from 'socket.io-client';

const socket = io('https://collaborative-dashboard-backend.onrender.com/', {
    withCredentials: true,
});

export default socket;
