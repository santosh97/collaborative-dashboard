import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './App.css'; // Import the color styling

// Setup socket connection
const token = localStorage.getItem('jwtToken');
const socket = io('http://localhost:5000', { auth: { token } });

function App() {
  const [widgets, setWidgets] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [selectedWidget, setSelectedWidget] = useState(null);

  useEffect(() => {
    fetchWidgets();

    socket.on('widget-updated', (updatedWidget) => {
      setWidgets((prevWidgets) =>
        prevWidgets.map((widget) => (widget._id === updatedWidget._id ? updatedWidget : widget))
      );
    });

    return () => {
      socket.off('widget-updated');
    };
  }, []);

  const fetchWidgets = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/widgets');
      setWidgets(response.data);
    } catch (error) {
      console.error('Error fetching widgets:', error);
    }
  };

  const handleCreateOrUpdateWidget = async () => {
    const widgetData = { title, description, type };

    if (selectedWidget) {
      setWidgets((prevWidgets) =>
        prevWidgets.map((widget) => (widget._id === selectedWidget._id ? { ...widget, ...widgetData } : widget))
      );

      try {
        socket.emit('edit-widget', { ...widgetData, _id: selectedWidget._id });
      } catch (error) {
        console.error('Failed to update widget:', error);
      }
    } else {
      try {
        const response = await axios.post('http://localhost:5000/api/widgets', widgetData);
        setWidgets([...widgets, response.data]);
      } catch (error) {
        console.error('Failed to create widget:', error);
      }
    }

    setTitle('');
    setDescription('');
    setType('');
    setSelectedWidget(null);
  };

  const handleEditWidget = (widget) => {
    setSelectedWidget(widget);
    setTitle(widget.title);
    setDescription(widget.description);
    setType(widget.type);
  };

  const handleDeleteWidget = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/widgets/${id}`);
    } catch (error) {
      console.error('Failed to delete widget:', error);
    }
  };

  return (
    <div className="app-container">
      <h1 className="title">Collaborative Dashboard</h1>
      <div className="input-container">
        {/* Title Field */}
        <div className="field">
          <label className="label">Title</label>
          <input
            className="input"
            placeholder="Enter widget title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Description Field */}
        <div className="field">
          <label className="label">Description</label>
          <textarea
            className="input"
            placeholder="Enter widget description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Type Field */}
        <div className="field">
          <label className="label">Type</label>
          <input
            className="input"
            placeholder="Enter widget type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
        </div>

        <button className="button" onClick={handleCreateOrUpdateWidget}>
          {selectedWidget ? 'Update Widget' : 'Create Widget'}
        </button>
      </div>

      <div className="widgets-list">
        {widgets.map((widget) => (
          <div key={widget._id} className="widget-card">
            {/* Widget Data Display with Proper Labeling */}
            <div className="widget-field">
              <strong>Title:</strong> {widget.title}
            </div>
            <div className="widget-field">
              <strong>Description:</strong> {widget.description}
            </div>
            <div className="widget-field">
              <strong>Type:</strong> {widget.type}
            </div>

            {/* Edit and Delete Buttons */}
            <button className="button" onClick={() => handleEditWidget(widget)}>
              Edit
            </button>
            <button className="button" onClick={() => handleDeleteWidget(widget._id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
