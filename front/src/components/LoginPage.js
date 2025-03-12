import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is already logged in and redirect to /home
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  // Retrieve the path the user attempted to access before login, default to home
  const redirectTo = location.state?.from?.pathname || "/home";

  const logInUser = async () => {
    if (!email) {
      alert("Email is required!");
      return;
    }
    if (!password) {
      alert("Password is required!");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:5000/login", {
        email,
        password,
      });

      console.log("Login Response Data:", response.data); // Debugging

      if (response.data && response.data.access_token) {
        // Store access token in localStorage
        localStorage.setItem("accessToken", response.data.access_token);

        // Optional: Store user role and other details if needed
        if (response.data.userRole) {
          localStorage.setItem("userRole", response.data.userRole);
        }

        alert("Login successful");
        navigate(redirectTo, { replace: true });
      } else {
        alert("Login successful, but no access token received.");
      }
    } catch (error) {
      console.error("Login Error:", error);

      if (error.response && error.response.status === 401) {
        alert("Invalid credentials. Please check your email and password.");
      } else if (error.message) {
        alert(`An error occurred: ${error.message}. Please try again later.`);
      } else {
        alert("An unknown error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center" style={styles.container}>
      <div className="row w-100 h-100 d-flex justify-content-center align-items-center">
        
        {/* Left Image Section (Restored Image) */}
        <div className="col-md-6 col-lg-5 d-none d-lg-flex align-items-center justify-content-center h-100 p-0">
          <img
            src="https://as1.ftcdn.net/v2/jpg/03/39/70/90/1000_F_339709048_ZITR4wrVsOXCKdjHncdtabSNWpIhiaR7.jpg"
            className="img-fluid rounded shadow-lg h-100 w-100"
            alt="Login visual"
            style={{ objectFit: "cover" }}
          />
        </div>

        {/* Login Form Section */}
        <div className="col-12 col-md-8 col-lg-5 d-flex align-items-center justify-content-center h-100">
          <div className="card shadow-lg border-0 w-100 p-4" style={styles.card}>
            <div className="card-body">
              <h3 className="text-center mb-4 fw-bold text-primary">Welcome Back</h3>
              <p className="text-center text-muted mb-4">Log into your account to continue</p>

              <form onSubmit={(e) => { e.preventDefault(); logInUser(); }}>
                {/* Email Field */}
                <div className="form-outline mb-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control form-control-lg"
                    placeholder="Enter a valid email address"
                    required
                  />
                  <label className="form-label">Email address</label>
                </div>

                {/* Password Field */}
                <div className="form-outline mb-3">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control form-control-lg"
                    placeholder="Enter password"
                    required
                  />
                  <label className="form-label">Password</label>
                </div>

                {/* Remember Me and Forgot Password */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" />
                    <label className="form-check-label">Remember me</label>
                  </div>
                  <a href="#!" className="text-muted">Forgot password?</a>
                </div>

                {/* Login Button */}
                <div className="d-grid gap-2 mb-4">
                  <button type="submit" className="btn btn-primary btn-lg">Login</button>
                </div>

                {/* Back to Landing Page & Register Link */}
                <p className="text-center">
                  <a href="/" className="text-primary fw-bold">Back to Landing Page</a>
                </p>
                <p className="text-center">
                  <span className="text-muted">Don't have an account? </span>
                  <a href="/register" className="text-primary fw-bold">Register</a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// **Inline Styles**
const styles = {
  container: {
    background: "linear-gradient(to right, #E3F2FD, #BBDEFB)",
    fontFamily: "'Poppins', sans-serif",
  },
  card: {
    backgroundColor: "#ffffff",
    maxWidth: "400px",
    borderRadius: "12px",
    boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)",
  },
};

export default LoginPage;
