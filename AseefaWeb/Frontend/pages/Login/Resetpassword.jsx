import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../apiService';
import "./Login.css";

function ResetForm() {
    const [reset, setReset] = useState({
        CurrentPassword: '',
        Newpassword: '',
        ConfirmPassword: '',
        Empid :''
    });
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setReset({
            ...reset,
            [name]: value,
        });
    };

    const handleLogout = async () => {
        try {
            const response = await api.post('/api/logout', {}, {
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.data.success) {
                sessionStorage.removeItem('token');
                navigate('/');
            } else {
                console.error('Logout failed:', response.data.Message || 'Unknown error');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            if (error.response) {
                console.error('Response error:', error.response.data);
            } else if (error.request) {
                console.error('Request error:', error.request);
            } else {
                console.error('Unknown error:', error.message);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoadingSubmit(true);
        setError('');
        setMessage('');

        if (reset.Newpassword !== reset.ConfirmPassword) {
            setError('New password and confirm password do not match.');
            setLoadingSubmit(false);
            return;
        }
        const Empid = sessionStorage.getItem('Empid'); // Retrieve Empid from sessionStorage
        try {
            const response = await api.post('/api/resetpassword', {
                Empid, // Pass Empid in the request body
                CurrentPassword: reset.CurrentPassword,
                NewPassword: reset.Newpassword,
            });

            if (response.data.success) {
                setMessage('Password successfully updated. Logging you out...');
                await handleLogout(); // Log out the user and redirect to the login page
            } else {
                setError(response.data.Message || 'Password reset failed.');
            }
        } catch (error) {
            if (error.response) {
                setError(error.response.data.Message || 'An error occurred while resetting the password.');
            } else if (error.request) {
                setError('No response received from the server.');
            } else {
                setError('An error occurred while resetting the password.');
            }
        }

        setLoadingSubmit(false);
    };

    return (
        <div className="page-wrapper">
            <div className="container-xl">
                <div className="page-header d-print-none mt-2">
                    <div className="row g-2 align-items-center">
                        <div className="col">
                            <h2 className="page-title">Reset Password</h2>
                        </div>
                    </div>
                </div>
                <div className="page-body">
                    <div className="container-xl">
                        <div className="row row-cards">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-body">
                                        <form className="reset-form" onSubmit={handleSubmit}>
                                            <div className="row">
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="CurrentPassword" className="form-label">Current Password</label>
                                                        <input
                                                            type="password"
                                                            id="CurrentPassword"
                                                            name="CurrentPassword"
                                                            className="form-control"
                                                            value={reset.CurrentPassword}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="Newpassword" className="form-label">New Password</label>
                                                        <input
                                                            type="password"
                                                            id="Newpassword"
                                                            name="Newpassword"
                                                            className="form-control"
                                                            value={reset.Newpassword}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="ConfirmPassword" className="form-label">Confirm Password</label>
                                                        <input
                                                            type="password"
                                                            id="ConfirmPassword"
                                                            name="ConfirmPassword"
                                                            className="form-control"
                                                            value={reset.ConfirmPassword}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="form-footer d-flex justify-content-center">
                                                <button
                                                    type="submit"
                                                    className="btn mx-1"
                                                    disabled={loadingSubmit}
                                                >
                                                    {loadingSubmit ? 'Submitting...' : 'Reset Password'}
                                                </button>
                                            </div>
                                            {error && <div className="alert alert-danger mt-3">{error}</div>}
                                            {message && (
                                                <div className="alert alert-success mt-3" style={{ color: 'green' }}>
                                                    {message} <a href="#" onClick={handleLogout}>Click here to log out.</a>
                                                </div>
                                            )}
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ResetForm;
