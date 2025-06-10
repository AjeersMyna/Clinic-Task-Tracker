// frontend/src/App.js

import { useCallback, useState } from 'react';
import { Link, Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify'; // Import ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Import toastify CSS
import './App.css'; // Added for future use
import Login from './components/Login';
import PrivateRoute from './components/PrivateRoute';
import Register from './components/Register';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import { useAuth } from './context/AuthContext';

function App() {
  const [refreshTasks, setRefreshTasks] = useState(0);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);

  const { user, logout } = useAuth();

  const handleTaskChange = useCallback(() => {
    setRefreshTasks(prev => prev + 1);
    setShowTaskForm(false);
    setCurrentTask(null);
  }, []);

  const handleAddTaskClick = () => {
    setCurrentTask(null);
    setShowTaskForm(true);
  };

  const handleEditTask = (task) => {
    setCurrentTask(task);
    setShowTaskForm(true);
  };

  const handleCloseForm = () => {
    setShowTaskForm(false);
    setCurrentTask(null);
  };

  return (
    <Router>
      <div className="App">
        {/* ToastContainer added here to display notifications */}
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

        <header className="App-header">
          <h1 className="mb-2">Clinic Task Tracker</h1>
          <p>Manage your clinic tasks efficiently.</p>

          <nav className="navbar navbar-expand-lg navbar-dark bg-dark w-100 px-4 py-2 mt-3">
            <div className="container-fluid">
              
              <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
              </button>
              <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                  {user && (
                    <li className="nav-item">
                      <Link className="nav-link" to="/tasks">My Tasks</Link>
                    </li>
                  )}
                  {/* Potentially add Admin/Doctor specific links here later */}
                  {user && user.role === 'admin' && (
                    <li className="nav-item">
                      {/* Placeholder for future Admin Management Link */}
                      
                    </li>
                  )}
                </ul>
                <ul className="navbar-nav">
                  {user ? (
                    <li className="nav-item dropdown">
                      <button
                        className="nav-link dropdown-toggle bg-transparent border-0 text-white"
                        type="button"
                        id="navbarDropdown"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        style={{ cursor: 'pointer' }}
                      >
                        Welcome, {user.name} ({user.role})
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                        {/* Profile link is kept as "Coming Soon" placeholder in this file based on your previous code */}
                        <li><Link className="dropdown-item" to="/profile">Profile</Link></li>
                        <li><hr className="dropdown-divider" /></li>
                        <li><button className="dropdown-item" onClick={logout}>Logout</button></li>
                      </ul>
                    </li>
                  ) : (
                    <>
                      <li className="nav-item">
                        <Link className="nav-link" to="/login">Login</Link>
                      </li>
                      <li className="nav-item">
                        <Link className="nav-link" to="/register">Register</Link>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </nav>
          {/* MODIFIED: Only show "Add New Task" button if user is admin */}
          {user && user.role === 'admin' && (
            <button className="add-task-button" onClick={handleAddTaskClick}>
              Add New Task
            </button>
          )}
        </header>

        <main className="container my-5">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Main Dashboard/Tasks route for any authenticated user */}
            <Route
              path="/"
              element={user ? (
                <PrivateRoute>
                  {showTaskForm ? (
                    <TaskForm
                      onTaskAdded={handleTaskChange}
                      onTaskUpdated={handleTaskChange}
                      currentTask={currentTask}
                      onCloseForm={handleCloseForm}
                    />
                  ) : (
                    <TaskList
                      refreshTrigger={refreshTasks}
                      onEditTask={handleEditTask}
                      onTaskDeleted={handleTaskChange}
                    />
                  )}
                </PrivateRoute>
              ) : (
                <Navigate to="/login" replace />
              )}
            />

            {/* "/tasks" route pointing to the same TaskList/TaskForm logic */}
            <Route
              path="/tasks"
              element={
                <PrivateRoute>
                  {showTaskForm ? (
                    <TaskForm
                      onTaskAdded={handleTaskChange}
                      onTaskUpdated={handleTaskChange}
                      currentTask={currentTask}
                      onCloseForm={handleCloseForm}
                    />
                  ) : (
                    <TaskList
                      refreshTrigger={refreshTasks}
                      onEditTask={handleEditTask}
                      onTaskDeleted={handleTaskChange}
                    />
                  )}
                </PrivateRoute>
              }
            />

            {/* Placeholder for Profile route (as per your current code) */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <h2 className="text-center my-5">User Profile (Coming Soon)</h2>
                  <p className="text-center">Name: {user?.name}</p>
                  <p className="text-center">Email: {user?.email}</p>
                  <p className="text-center">Role: {user?.role}</p>
                </PrivateRoute>
              }
            />

            {/* Admin-specific routes (placeholders for future implementation) */}
            

            {/* Doctor-specific routes (placeholders for future implementation) */}
            
            {/* Fallback for unmatched routes */}
            <Route path="*" element={user ? <Navigate to="/" replace /> : <Navigate to="/login" replace />} />

          </Routes>
        </main>

        <footer className="App-footer">
          <p>&copy; {new Date().getFullYear()} Clinic Task Tracker. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;