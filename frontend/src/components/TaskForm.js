// frontend/src/components/TaskForm.js

import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify'; // Import toast
import { useAuth } from '../context/AuthContext'; // Import useAuth to get the token

function TaskForm({ onTaskAdded, onTaskUpdated, currentTask, onCloseForm }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState(''); // State for time
  const [assignedTo, setAssignedTo] = useState(''); // Stores the _id of the assigned doctor
  const [doctors, setDoctors] = useState([]); // State to store fetched doctors
  const [loadingDoctors, setLoadingDoctors] = useState(false); // New: Loading state for doctors

  const [errors, setErrors] = useState({});

  const { user } = useAuth(); // Get user from AuthContext to access the token

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoadingDoctors(true); // Set loading true when fetching starts
      if (!user || !user.token) {
        console.error('No user token available to fetch doctors.');
        toast.error('Authentication error: No user token to fetch doctors.'); // Use toast for error
        setLoadingDoctors(false);
        return;
      }
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        const { data } = await axios.get('http://localhost:5000/api/users/doctors', config);
        setDoctors(data);
      } catch (error) {
        console.error('Error fetching doctors:', error.response ? error.response.data : error.message);
        toast.error('Failed to fetch doctors list. Please try again.'); // Use toast for error
      } finally {
        setLoadingDoctors(false); // Set loading false when fetching ends
      }
    };

    fetchDoctors();
  }, [user]); // Re-fetch doctors if user changes (e.g., after login/logout)

  useEffect(() => {
    if (currentTask) {
      setTitle(currentTask.title || '');
      setDescription(currentTask.description || '');
      setStatus(currentTask.status || 'pending');

      // Parse dueDate and dueTime from currentTask if available
      if (currentTask.dueDate) {
        const dt = new Date(currentTask.dueDate);
        // Format to YYYY-MM-DD
        const formattedDate = dt.toISOString().split('T')[0];
        setDueDate(formattedDate);
        // Format to HH:MM
        const formattedTime = dt.toTimeString().split(' ')[0].substring(0, 5);
        setDueTime(formattedTime);
      } else {
        setDueDate('');
        setDueTime('');
      }

      setAssignedTo(currentTask.assignedTo || ''); // Assuming assignedTo stores doctor's _id
    } else {
      setTitle('');
      setDescription('');
      setStatus('pending');
      setDueDate('');
      setDueTime(''); // Clear time for new task
      setAssignedTo('');
      setErrors({});
    }
  }, [currentTask]);

  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    if (!title.trim()) {
      newErrors.title = 'Title is required.';
      isValid = false;
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long.';
      isValid = false;
    }

    if (description.trim() && description.trim().length < 5) {
      newErrors.description = 'Description must be at least 5 characters long if provided.';
      isValid = false;
    }

    // Due Date validation (not in the past) and time validation
    if (!dueDate) {
      newErrors.dueDate = 'Due Date is required.';
      isValid = false;
    }
    if (!dueTime) {
      newErrors.dueTime = 'Due Time is required.';
      isValid = false;
    }
    if (dueDate && dueTime) {
      const selectedDateTime = new Date(`${dueDate}T${dueTime}:00`); // Combine date and time
      const now = new Date();

      if (selectedDateTime < now) {
        newErrors.dueDate = 'Due Date and Time cannot be in the past.';
        isValid = false;
      }
    }

    if (!assignedTo) { // Validate if a doctor is selected
      newErrors.assignedTo = 'Please assign a doctor.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please correct the form errors.'); // Notify user about form errors
      return;
    }

    const token = user ? user.token : null;

    if (!token) {
      toast.error('You are not authorized. Please log in.'); // Use toast for auth error
      return;
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    // Combine date and time for dueDate
    const fullDueDate = dueDate && dueTime ? new Date(`${dueDate}T${dueTime}:00`).toISOString() : null;

    const taskData = {
      title,
      description,
      status,
      dueDate: fullDueDate,
      assignedTo, // This will now be the doctor's _id
    };

    try {
      if (currentTask) {
        const response = await axios.put(`http://localhost:5000/api/tasks/${currentTask._id}`, taskData, config);
        onTaskUpdated(response.data);
        toast.success('Task updated successfully!'); // Use toast for success
      } else {
        const response = await axios.post('http://localhost:5000/api/tasks', taskData, config);
        onTaskAdded(response.data);
        toast.success('Task created successfully!'); // Use toast for success
      }
      onCloseForm();
    } catch (error) {
      console.error('Error submitting task:', error.response ? error.response.data : error.message);
      toast.error(`Error: ${error.response && error.response.data && error.response.data.message ? error.response.data.message : 'Something went wrong!'}`); // Use toast for submission error
    }
  };

  return (
    <div className="card p-4 shadow-lg mx-auto" style={{ maxWidth: '600px' }}>
      <h2 className="mb-4 text-center text-primary">{currentTask ? 'Edit Task' : 'Create New Task'}</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="title" className="form-label">Title:</label>
          <input
            type="text"
            id="title"
            className={`form-control form-control-lg ${errors.title ? 'is-invalid' : ''}`}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors(prev => ({ ...prev, title: null }));
            }}
            required
            placeholder="e.g., Patient Follow-up"
          />
          {errors.title && <div className="invalid-feedback">{errors.title}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="description" className="form-label">Description:</label>
          <textarea
            id="description"
            className={`form-control ${errors.description ? 'is-invalid' : ''}`}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors(prev => ({ ...prev, description: null }));
            }}
            rows="3"
            placeholder="Detailed description of the task..."
          ></textarea>
          {errors.description && <div className="invalid-feedback">{errors.description}</div>}
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label htmlFor="status" className="form-label">Status:</label>
            <select
              id="status"
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In-Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          {/* Due Date and Due Time inputs */}
          <div className="col-md-3">
            <label htmlFor="dueDate" className="form-label">Due Date:</label>
            <input
              type="date"
              id="dueDate"
              className={`form-control ${errors.dueDate ? 'is-invalid' : ''}`}
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                if (errors.dueDate) setErrors(prev => ({ ...prev, dueDate: null }));
              }}
              required
            />
            {errors.dueDate && <div className="invalid-feedback">{errors.dueDate}</div>}
          </div>
          <div className="col-md-3">
            <label htmlFor="dueTime" className="form-label">Due Time:</label>
            <input
              type="time"
              id="dueTime"
              className={`form-control ${errors.dueTime ? 'is-invalid' : ''}`}
              value={dueTime}
              onChange={(e) => {
                setDueTime(e.target.value);
                if (errors.dueTime) setErrors(prev => ({ ...prev, dueTime: null }));
              }}
              required
            />
            {errors.dueTime && <div className="invalid-feedback">{errors.dueTime}</div>}
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="assignedTo" className="form-label">Assigned To:</label>
          <select
            id="assignedTo"
            className={`form-select ${errors.assignedTo ? 'is-invalid' : ''}`}
            value={assignedTo}
            onChange={(e) => {
              setAssignedTo(e.target.value);
              if (errors.assignedTo) setErrors(prev => ({ ...prev, assignedTo: null }));
            }}
            required
            disabled={loadingDoctors}
          >
            <option value="">
              {loadingDoctors ? 'Loading doctors...' : '-- Select Doctor --'}
            </option>
            {doctors.map(doctor => (
              <option key={doctor._id} value={doctor._id}>
                {doctor.name} ({doctor.username})
              </option>
            ))}
          </select>
          {errors.assignedTo && <div className="invalid-feedback">{errors.assignedTo}</div>}
        </div>

        <div className="d-flex justify-content-end">
          <button type="submit" className="btn btn-primary btn-lg me-2 rounded-pill">
            {currentTask ? 'Update Task' : 'Add Task'}
          </button>
          <button type="button" onClick={onCloseForm} className="btn btn-secondary btn-lg rounded-pill">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default TaskForm;