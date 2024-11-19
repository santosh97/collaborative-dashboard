
/*******
 * src/App.js:app file
 * 
 * 11/2024 Santosh Dubey
 *
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import socket from './socket';
import './App.css';


const App = () => {
  const navigate = useNavigate();
  const [widgets, setWidgets] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isLogin, setIsLogin] = useState(true); // To toggle between login and registration forms
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'disconnected'

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      fetchWidgets();  // Fetch widgets if authenticated
    } else {
      navigate('/login');  // Redirect to login page if no token is found
    }
  }, [navigate]);

  // Handle real-time updates using socket events
  useEffect(() => {
    // Socket.IO connection events
    socket.on('connect', () => {
      setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('reconnect', () => {
      setConnectionStatus('connected');
    });

    // Handle widget events
    socket.on('widget:created', (newWidget) => {
      setWidgets((prevWidgets) => [...prevWidgets, newWidget]);
    });

    socket.on('widget:updated', (updatedWidget) => {
      setWidgets((prevWidgets) =>
        prevWidgets.map((widget) =>
          widget._id === updatedWidget._id ? updatedWidget : widget
        )
      );
    });

    socket.on('widget:deleted', (deletedWidgetId) => {
      setWidgets((prevWidgets) => prevWidgets.filter((widget) => widget._id !== deletedWidgetId));
    });

    // Cleanup on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('reconnect');
      socket.off('widget:created');
      socket.off('widget:updated');
      socket.off('widget:deleted');
    };
  }, []); // Empty array to run this effect only once

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'orange'; // Orange for connecting
      case 'connected':
        return 'green';  // Green for connected
      case 'disconnected':
        return 'red';    // Red for disconnected
      default:
        return 'gray';   // Default color
    }
  };


  // Fetch widgets from the backend
  const fetchWidgets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/widgets');
      setWidgets(response.data);
    } catch (err) {
      setError('Failed to load widgets');
    } finally {
      setLoading(false);
    }
  };

  // Handle form validation
  const validateForm = () => {
    const errors = {};
    if (!title) errors.title = 'Title is required';
    if (!description) errors.description = 'Description is required';
    if (!type) errors.type = 'Type is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle widget creation or update
  const handleCreateOrUpdateWidget = async () => {
    if (!validateForm()) return;

    const widgetData = { title, description, type };

    if (selectedWidget) {
      try {
        const response = await api.put(`/widgets/${selectedWidget._id}`, widgetData);
        // setWidgets(widgets.map(widget => (widget._id === selectedWidget._id ? { ...widget, ...widgetData } : widget)));
        socket.emit('widget:update', response.data); // Emit update event
        setSelectedWidget(null);
      } catch (err) {
        setError('Failed to update widget');
      }
    } else {
      try {
        const response = await api.post('/widgets', widgetData);
        // setWidgets([...widgets, response.data]);
        socket.emit('widget:create', response.data); // Emit create event
      } catch (err) {
        setError('Failed to create widget');
      }
    }

    // Reset form fields
    setTitle('');
    setDescription('');
    setType('');
  };

  // Pre-fill form fields for editing a widget
  const handleEditWidget = (widget) => {
    setSelectedWidget(widget);
    setTitle(widget.title);
    setDescription(widget.description);
    setType(widget.type);
  };

  // Handle widget deletion
  const handleDeleteWidget = async (id) => {
    try {
      await api.delete(`/widgets/${id}`);
      socket.emit('widget:delete', id); // Emit delete event
      // setWidgets(widgets.filter(widget => widget._id !== id));
    } catch (err) {
      setError('Failed to delete widget');
    }
  };

  // Handle login form submission
  const handleLogin = async () => {
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('jwtToken', response.data.token); // Store JWT token
      navigate('/');  // Redirect to dashboard
    } catch (err) {
      setError('Login failed');
    }
  };

  // Handle registration form submission
  const handleRegister = async () => {
    try {
      await api.post('/auth/register', { email, password });
      setIsLogin(true); // Switch to login after successful registration
    } catch (err) {
      setError('Registration failed');
    }
  };

  // Logout functionality
  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    navigate('/login');  // Redirect to login page after logout
  };

  // Conditional rendering of login/registration and dashboard
  if (!localStorage.getItem('jwtToken')) {
    return (
      <div className="app-container">


        <div className="auth-container">
          <h1 className="title">{isLogin ? "Login" : "Register"}</h1>
          {error && <div className="error">{error}</div>}

          <div className="input-container">
            <div className="field">
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              className="button"
              onClick={isLogin ? handleLogin : handleRegister}
            >
              {isLogin ? "Login" : "Register"}
            </button>
          </div>

          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span
              onClick={() => setIsLogin(!isLogin)}
              className="link"
              style={{ cursor: "pointer", color: "#4a90e2", textDecoration: "underline" }}
            >
              {isLogin ? "Register" : "Login"}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // Dashboard with widgets
  return (
    <div className="app-container">
      {/* Logout Button */}
      <button className="logout-button" onClick={handleLogout}>
        Logout
      </button>
      <h1 className="title">Collaborative Dashboard</h1>
      {/* {error && <div className="error">{error}</div>} */}
      {/*   socket connection  lable  */}
      <div style={{ color: getConnectionColor(), fontWeight: 'bold' }}>
        Connection Status: {connectionStatus}
      </div>

      <div className="input-container">
        {/* Title Field */}
        <div className="field">
          <label className="label">Title</label>
          <input
            className={`input ${formErrors.title ? 'error' : ''}`}
            placeholder="Enter widget title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {formErrors.title && <div className="error-message">{formErrors.title}</div>}
        </div>

        {/* Description Field */}
        <div className="field">
          <label className="label">Description</label>
          <textarea
            className={`input ${formErrors.description ? 'error' : ''}`}
            placeholder="Enter widget description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {formErrors.description && <div className="error-message">{formErrors.description}</div>}
        </div>

        {/* Type Field */}
        <div className="field">
          <label className="label">Type</label>
          <input
            className={`input ${formErrors.type ? 'error' : ''}`}
            placeholder="Enter widget type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
          {formErrors.type && <div className="error-message">{formErrors.type}</div>}
        </div>

        <button className="button" onClick={handleCreateOrUpdateWidget}>
          {selectedWidget ? 'Update Widget' : 'Create Widget'}
        </button>


      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="widgets-list">
          {widgets.map((widget) => (
            <div key={widget._id} className="widget-card">
              <div className="widget-field">
                <strong>Title:</strong> {widget.title}
              </div>
              <div className="widget-field">
                <strong>Description:</strong> {widget.description}
              </div>
              <div className="widget-field">
                <strong>Type:</strong> {widget.type}
              </div>

              <button className="button" onClick={() => handleEditWidget(widget)}>
                Edit
              </button>
              <button className="button" onClick={() => handleDeleteWidget(widget._id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
