// frontend/src/components/TaskList.js

import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify'; // Import toast
import { useAuth } from '../context/AuthContext';

function TaskList({ onEditTask, onTaskDeleted, refreshTrigger }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [doctorsMap, setDoctorsMap] = useState({});
  const [doctorsList, setDoctorsList] = useState([]);

  // STATES FOR FILTERING
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssignedTo, setFilterAssignedTo] = useState('');
  const [filterDueDateStart, setFilterDueDateStart] = useState('');
  const [filterDueDateEnd, setFilterDueDateEnd] = useState('');

  // STATES FOR SORTING
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // NEW STATES for rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [taskToReject, setTaskToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { user } = useAuth(); // <--- This line is already here, good!

  // Function to fetch tasks and doctors (remains the same)
  const fetchTasksAndDoctors = useCallback(async () => {
    if (!user || !user.token) {
      toast.error('Authentication required to fetch tasks.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        params: {
          status: filterStatus,
          assignedTo: filterAssignedTo,
          dueDateStart: filterDueDateStart,
          dueDateEnd: filterDueDateEnd,
          sortBy: sortField,
          order: sortOrder
        }
      };

      // Only fetch doctors if the user is an admin or if the assignedTo filter is relevant (e.g., for a doctor viewing their own tasks if assignedTo is set to their ID).
      // For now, we'll fetch them for admins to populate the dropdown.
      // If a doctor should *only* see their own tasks and not filter by other doctors, you might adjust the backend fetching logic as well.
      // But for the UI, we only show the filter for admins.
      if (user.role === 'admin') { // <--- Only fetch doctors list if user is admin
        const doctorsResponse = await axios.get('http://localhost:5000/api/users/doctors', config);
        const fetchedDoctors = doctorsResponse.data;
        const map = {};
        fetchedDoctors.forEach(doc => {
          map[doc._id] = doc.name || doc.username || 'Unknown Doctor';
        });
        setDoctorsMap(map);
        setDoctorsList(fetchedDoctors);
      } else {
        // If not an admin, clear the doctors list and map
        setDoctorsMap({});
        setDoctorsList([]);
        // Also, if a doctor logs in, ensure their filterAssignedTo is set to their own ID by default
        // This is a good place to ensure doctors only fetch their own tasks
        // However, this might need more robust handling depending on your backend's task fetching logic.
        // For now, the existing `fetchTasksAndDoctors` with `filterAssignedTo` is enough if backend respects it.
      }


      // Fetch Tasks
      const tasksResponse = await axios.get('http://localhost:5000/api/tasks', config);
      setTasks(tasksResponse.data);

    } catch (err) {
      console.error('Error fetching tasks or doctors:', err.response ? err.response.data : err.message);
      toast.error(`Failed to load tasks: ${err.response && err.response.data && err.response.data.message ? err.response.data.message : 'Please try again later.'}`);
    } finally {
      setLoading(false);
    }
  }, [user, filterStatus, filterAssignedTo, filterDueDateStart, filterDueDateEnd, sortField, sortOrder]);


  useEffect(() => {
    fetchTasksAndDoctors();
  }, [fetchTasksAndDoctors, refreshTrigger]);

  const handleDeleteTask = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        await axios.delete(`http://localhost:5000/api/tasks/${id}`, config);
        onTaskDeleted();
        toast.success('Task deleted successfully!');
      } catch (err) {
        console.error('Error deleting task:', err.response ? err.response.data : err.message);
        toast.error(`Failed to delete task: ${err.response && err.response.data && err.response.data.message ? err.response.data.message : 'Something went wrong!'}`);
      }
    }
  };

  const handleAcceptTask = async (taskId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      await axios.put(`http://localhost:5000/api/tasks/${taskId}/accept`, {}, config);
      toast.success('Task accepted!');
      fetchTasksAndDoctors();
    } catch (err) {
      console.error('Error accepting task:', err.response ? err.response.data : err.message);
      toast.error(`Failed to accept task: ${err.response && err.response.data && err.response.data.message ? err.response.data.message : 'Something went wrong!'}`);
    }
  };

  const handleOpenRejectModal = (task) => {
    setTaskToReject(task);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
    setTaskToReject(null);
    setRejectionReason('');
  };

  const handleRejectTask = async () => {
    if (!taskToReject) return;
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      await axios.put(`http://localhost:5000/api/tasks/${taskToReject._id}/reject`, { rejectionReason }, config);
      toast.success('Task rejected!');
      handleCloseRejectModal();
      fetchTasksAndDoctors();
    } catch (err) {
      console.error('Error rejecting task:', err.response ? err.response.data : err.message);
      toast.error(`Failed to reject task: ${err.response && err.response.data && err.response.data.message ? err.response.data.message : 'Something went wrong!'}`);
    }
  };

  return (
    <div>
      <h2 className="text-center mb-4">Current Tasks</h2>

      {/* Filter and Sort Controls */}
      <div className="d-flex justify-content-end mb-4 gap-3 flex-wrap">
        {/* Status Filter */}
        <div className="col-md-3 col-sm-6">
          <label htmlFor="filterStatus" className="form-label visually-hidden">Filter by Status:</label>
          <select
            id="filterStatus"
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In-Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Assigned To Filter - CONDITIONAL RENDERING HERE */}
        {user.role === 'admin' && ( // <--- ADD THIS CONDITIONAL CHECK
          <div className="col-md-3 col-sm-6">
            <label htmlFor="filterAssignedTo" className="form-label visually-hidden">Filter by Doctor:</label>
            <select
              id="filterAssignedTo"
              className="form-select"
              value={filterAssignedTo}
              onChange={(e) => setFilterAssignedTo(e.target.value)}
            >
              <option value="">All Doctors</option>
              {doctorsList.map(doctor => (
                <option key={doctor._id} value={doctor._id}>
                  {doctor.name || doctor.username}
                </option>
              ))}
            </select>
          </div>
        )} {/* <--- CLOSE THE CONDITIONAL RENDERING */}


        {/* Due Date Start Filter */}
        <div className="col-md-3 col-sm-6">
          <label htmlFor="filterDueDateStart" className="form-label visually-hidden">Due Date Start:</label>
          <input
            type="date"
            id="filterDueDateStart"
            className="form-control"
            placeholder="Due Date Start"
            value={filterDueDateStart}
            onChange={(e) => setFilterDueDateStart(e.target.value)}
          />
        </div>

        {/* Due Date End Filter */}
        <div className="col-md-3 col-sm-6">
          <label htmlFor="filterDueDateEnd" className="form-label visually-hidden">Due Date End:</label>
          <input
            type="date"
            id="filterDueDateEnd"
            className="form-control"
            placeholder="Due Date End"
            value={filterDueDateEnd}
            onChange={(e) => setFilterDueDateEnd(e.target.value)}
          />
        </div>

        {/* Sort By Field (adjusted column for spacing) */}
        <div className="col-md-3 col-sm-6">
          <label htmlFor="sortField" className="form-label visually-hidden">Sort By:</label>
          <select
            id="sortField"
            className="form-select"
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
          >
            <option value="createdAt">Created At</option>
            <option value="dueDate">Due Date</option>
            <option value="status">Status</option>
          </select>
        </div>

        {/* Sort Order (adjusted column for spacing) */}
        <div className="col-md-2 col-sm-6">
          <label htmlFor="sortOrder" className="form-label visually-hidden">Order:</label>
          <select
            id="sortOrder"
            className="form-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-center">Loading tasks...</p>
      ) : error ? (
        <p className="text-danger text-center">{error}</p>
      ) : tasks.length === 0 ? (
        <p className="text-center">No tasks found. Add a new task!</p>
      ) : (
        <div className="row justify-content-center">
          {tasks.map(task => (
            <div key={task._id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title text-primary">{task.title}</h5>
                  {task.description && <p className="card-text flex-grow-1"><strong>Description:</strong> {task.description}</p>}
                  <p className="card-text">
                    <strong>Status:</strong>{' '}
                    <span className={`badge ${task.status === 'completed' ? 'bg-success' : task.status === 'in-progress' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                      {task.status}
                    </span>
                  </p>
                  {/* Display Assignment Status */}
                  <p className="card-text">
                    <strong>Assignment:</strong>{' '}
                    <span className={`badge ${
                        task.assignmentStatus === 'accepted' ? 'bg-success' :
                        task.assignmentStatus === 'rejected' ? 'bg-danger' :
                        'bg-info text-dark'
                    }`}>
                      {task.assignmentStatus}
                    </span>
                    {task.rejectionReason && task.assignmentStatus === 'rejected' && (
                        <small className="d-block text-muted">Reason: {task.rejectionReason}</small>
                    )}
                  </p>
                  {task.dueDate && (
                    <p className="card-text">
                      <strong>Due Date:</strong> {new Date(task.dueDate).toLocaleDateString()} at {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  {task.assignedTo && (
                    <p className="card-text">
                      <strong>Assigned To:</strong> {doctorsMap[task.assignedTo] || 'N/A'}
                    </p>
                  )}
                  <div className="mt-3 d-flex justify-content-end">
                    {/* Admin Buttons (Edit/Delete) */}
                    {user.role === 'admin' && (
                      <>
                        <button onClick={() => onEditTask(task)} className="btn btn-sm btn-info me-2">Edit</button>
                        <button onClick={() => handleDeleteTask(task._id)} className="btn btn-sm btn-danger">Delete</button>
                      </>
                    )}
                    {/* Doctor Buttons (Accept/Reject/Edit Task Status/View Details) */}
                    {user.role === 'doctor' && task.assignedTo === user._id && (
                      <>
                        {task.assignmentStatus === 'pending-acceptance' && (
                          <>
                            <button
                              onClick={() => handleAcceptTask(task._id)}
                              className="btn btn-sm btn-success me-2"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleOpenRejectModal(task)}
                              className="btn btn-sm btn-danger me-2"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {/* Once accepted, doctor can edit task to change its *progress* status */}
                        {task.assignmentStatus === 'accepted' && (
                           <button onClick={() => onEditTask(task)} className="btn btn-sm btn-info me-2">
                              Edit Task Progress
                           </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Task Modal */}
      <Modal show={showRejectModal} onHide={handleCloseRejectModal}>
        <Modal.Header closeButton>
          <Modal.Title>Reject Task</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to reject this task: **{taskToReject?.title}**?</p>
          <Form.Group className="mb-3">
            <Form.Label>Reason for rejection (optional):</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Not enough time, already overloaded, not my area of expertise..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseRejectModal}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRejectTask}>
            Confirm Reject
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}

export default TaskList;