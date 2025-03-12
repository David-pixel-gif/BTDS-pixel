import React, { useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const registerUser = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.post('http://127.0.0.1:5000/create_user', {
                username: username,
                email: email,
                password: password
            });
            if (response && response.status === 201) {
                alert("User registered successfully!");
                navigate("/login");
            }
        } catch (error) {
            setLoading(false);
            if (error.response) {
                if (error.response.status === 401) {
                    setError("Invalid credentials");
                } else {
                    setError("An error occurred. Please try again.");
                }
            } else {
                setError("Network error. Please check your connection.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container d-flex align-items-center justify-content-center vh-100" style={{ backgroundColor: "#f7f8fa" }}>
            <div className="card shadow-lg border-0" style={{ maxWidth: "900px" }}>
                <div className="row g-0">
                    <div className="col-md-6 d-none d-md-flex align-items-center justify-content-center" style={{ backgroundColor: "#f0f2f5" }}>
                        <img 
                            src="https://as2.ftcdn.net/v2/jpg/03/39/70/91/1000_F_339709132_H9HSSTtTmayePcbARkTSB2qoZTubJ6bR.jpg" 
                            alt="Register illustration" 
                            className="img-fluid"
                            style={{ width: "80%", padding: "20px" }}
                        />
                    </div>
                    <div className="col-md-6 d-flex align-items-center">
                        <div className="card-body">
                            <h5 className="card-title text-center mb-4" style={{ color: "#0d6efd", fontSize: "1.5rem", fontWeight: "bold" }}>Create Your Account</h5>
                            <p className="text-center text-muted mb-4">Sign up to get started with our services</p>
                            {error && <div className="alert alert-danger">{error}</div>}
                            <form>
                                <div className="form-outline mb-3">
                                    <label htmlFor="username" className="form-label">Username</label>
                                    <input 
                                        type="text" 
                                        value={username} 
                                        onChange={(e) => setUsername(e.target.value)} 
                                        id="username" 
                                        className="form-control form-control-lg" 
                                        placeholder="Enter your username" 
                                    />
                                </div>
                                <div className="form-outline mb-3">
                                    <label htmlFor="email" className="form-label">Email address</label>
                                    <input 
                                        type="email" 
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)} 
                                        id="email" 
                                        className="form-control form-control-lg" 
                                        placeholder="Enter a valid email address" 
                                    />
                                </div>
                                <div className="form-outline mb-3">
                                    <label htmlFor="password" className="form-label">Password</label>
                                    <input 
                                        type="password" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        id="password" 
                                        className="form-control form-control-lg" 
                                        placeholder="Enter password" 
                                    />
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div className="form-check">
                                        <input 
                                            className="form-check-input" 
                                            type="checkbox" 
                                            id="rememberMe" 
                                        />
                                        <label className="form-check-label" htmlFor="rememberMe">
                                            Remember me
                                        </label>
                                    </div>
                                    <a href="#!" className="text-secondary small">Forgot password?</a>
                                </div>
                                <div className="d-grid">
                                    <button 
                                        type="button" 
                                        className="btn btn-primary btn-lg" 
                                        onClick={registerUser} 
                                        disabled={loading}
                                    >
                                        {loading ? "Registering..." : "Sign Up"}
                                    </button>
                                </div>
                                <p className="small text-center mt-4 mb-0">
                                    Already have an account? <a href="/login" className="link-primary">Login</a>
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
