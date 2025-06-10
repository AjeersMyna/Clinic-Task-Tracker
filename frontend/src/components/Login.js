// frontend/src/components/Login.js

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // Import toast
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [error, setError] = useState(''); // Removed, using toast for errors
  const [loading, setLoading] = useState(false);

  const { login, user } = useAuth(); // Use the auth context
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // If user is already logged in, redirect to dashboard or home
      navigate('/'); // Or a specific dashboard route like '/dashboard'
      toast.success(`Welcome back, ${user.name}!`); // Display success toast on successful login/redirection
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // setError(''); // Removed
    setLoading(true);

    try {
      await login(email, password);
      // Login successful, useEffect will handle navigation and toast
    } catch (err) {
      // Error message from the catch block in AuthContext or backend response
      toast.error(err || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card p-4 shadow-lg">
            <h2 className="card-title text-center mb-4 text-primary">Login</h2>
            {/* {error && <div className="alert alert-danger">{error}</div>} */}
            {/* Removed the alert div, toast will display messages */}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email address</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
              </div>
              <div className="d-grid gap-2">
                <button type="submit" className="btn btn-primary btn-lg rounded-pill" disabled={loading}>
                  {loading ? 'Logging In...' : 'Login'}
                </button>
              </div>
            </form>
            <p className="mt-3 text-center">
              Don't have an account? <Link to="/register">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;