import React, { useState } from "react";
import axios from 'axios';
import { Link, useNavigate } from "react-router-dom";
import { ENDPOINTS, apiUrl } from "../api";

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const getRequestError = (err) => {
    const backendMessage = err.response?.data?.error;
    if (backendMessage) return backendMessage;

    const responseBody = typeof err.response?.data === "string" ? err.response.data : "";
    if (
      err.response?.status === 500 &&
      (
        responseBody.includes("proxy") ||
        responseBody.includes("ECONNREFUSED") ||
        responseBody.includes("Error occurred while trying to proxy")
      )
    ) {
      return "Registration service is unavailable. Start the backend on port 5000 and try again.";
    }

    if (!err.response) {
      return "Registration service is unavailable. Check that the backend is running on port 5000.";
    }

    return "An error occurred. Please try again.";
  };

  const registerUser = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    if (!username.trim() || !email.trim() || !password) {
      setLoading(false);
      setError("Username, email, and password are required.");
      return;
    }
    try {
      const response = await axios.post(apiUrl(ENDPOINTS.auth.register), {
        username: username,
        email: email,
        password: password
      });
      if (response && response.status === 201) {
        navigate("/login", {
          replace: true,
          state: { message: "User registered successfully. Sign in to continue." }
        });
      }
    } catch (requestError) {
      setLoading(false);
      setError(getRequestError(requestError));
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (pw) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = passwordStrength(password);
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#dc2626", "#c59c45", "#0a7b6e", "#075e55"][strength];

  return (
    <>
      <style>{`
        .auth-shell {
          min-height: 100vh;
          padding: 32px 20px;
          background:
            radial-gradient(circle at top left, rgba(10, 123, 110, 0.08), transparent 28%),
            linear-gradient(180deg, var(--theme-bg) 0%, #ffffff 100%);
          font-family: var(--theme-font-sans);
        }
        .auth-container {
          width: 100%;
          max-width: 680px;
          margin: 0 auto;
        }
        .auth-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 18px;
          text-decoration: none;
          color: var(--theme-slate);
          font-size: 0.82rem;
          font-weight: 500;
        }
        .auth-back:hover { color: var(--theme-teal); }
        .auth-intro,
        .auth-card {
          background: var(--theme-white);
          border: 1px solid var(--theme-border);
          border-radius: 1.1rem;
          box-shadow: 0 2px 12px rgba(16, 39, 59, 0.05);
        }
        .auth-intro {
          padding: 24px;
          margin-bottom: 18px;
        }
        .auth-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 999px;
          background: var(--theme-teal-soft);
          color: var(--theme-teal-dark);
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .auth-kicker-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--theme-teal);
        }
        .auth-title {
          margin: 0 0 8px;
          font-family: var(--theme-font-serif);
          font-size: 1.7rem;
          font-weight: 700;
          color: var(--theme-navy);
          line-height: 1.15;
        }
        .auth-subtitle {
          margin: 0;
          font-size: 0.86rem;
          line-height: 1.7;
          color: var(--theme-slate);
        }
        .auth-steps {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid var(--theme-border);
        }
        .auth-step {
          padding: 12px;
          border-radius: 14px;
          background: var(--theme-bg);
          border: 1px solid var(--theme-border);
        }
        .auth-step-label {
          display: block;
          margin-bottom: 4px;
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--theme-slate);
        }
        .auth-step-title {
          font-size: 0.86rem;
          font-weight: 600;
          color: var(--theme-navy);
          margin-bottom: 4px;
        }
        .auth-step-copy {
          font-size: 0.8rem;
          line-height: 1.6;
          color: var(--theme-slate);
        }
        .auth-card {
          padding: 24px;
        }
        .auth-card-header {
          margin-bottom: 20px;
        }
        .auth-card-title {
          margin: 0 0 6px;
          font-family: var(--theme-font-serif);
          font-size: 1.45rem;
          font-weight: 700;
          color: var(--theme-navy);
        }
        .auth-card-copy {
          margin: 0;
          font-size: 0.84rem;
          line-height: 1.7;
          color: var(--theme-slate);
        }
        .auth-alert {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 14px;
          margin-bottom: 16px;
          font-size: 0.84rem;
          line-height: 1.6;
        }
        .auth-alert--error {
          background: var(--theme-red-soft);
          border: 1px solid rgba(220, 38, 38, 0.14);
          color: var(--theme-red);
        }
        .auth-alert--success {
          background: var(--theme-teal-soft);
          border: 1px solid rgba(10, 123, 110, 0.18);
          color: var(--theme-teal-dark);
        }
        .auth-form {
          display: grid;
          gap: 16px;
        }
        .auth-field-label {
          display: block;
          margin-bottom: 6px;
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--theme-slate);
        }
        .auth-field-wrap {
          position: relative;
        }
        .auth-field-input {
          width: 100%;
          padding: 0.84rem 1rem 0.84rem 2.75rem;
          border: 1.5px solid var(--theme-border);
          border-radius: 10px;
          background: var(--theme-white);
          color: var(--theme-navy);
          font-size: 0.88rem;
          font-family: var(--theme-font-sans);
          outline: none;
        }
        .auth-field-input:focus {
          border-color: var(--theme-teal);
          box-shadow: 0 0 0 3px rgba(10, 123, 110, 0.12);
        }
        .auth-field-input::placeholder { color: #8aa0ad; }
        .auth-field-input--password { padding-right: 2.75rem; }
        .auth-field-icon,
        .auth-field-toggle {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--theme-slate);
        }
        .auth-field-icon {
          left: 14px;
          pointer-events: none;
        }
        .auth-field-toggle {
          right: 14px;
          background: transparent;
          border: 0;
          cursor: pointer;
          padding: 0;
        }
        .auth-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .auth-check {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          color: var(--theme-slate);
        }
        .auth-check input {
          width: 16px;
          height: 16px;
          accent-color: var(--theme-teal);
        }
        .auth-note {
          font-size: 0.78rem;
          color: var(--theme-slate);
        }
        .auth-strength-track {
          height: 4px;
          margin-top: 8px;
          border-radius: 999px;
          background: var(--theme-border);
          overflow: hidden;
        }
        .auth-strength-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.25s ease, background-color 0.25s ease;
        }
        .auth-strength-label {
          margin-top: 6px;
          font-size: 0.74rem;
          font-weight: 600;
        }
        .auth-submit {
          width: 100%;
          padding: 0.92rem 1rem;
          border: 0;
          border-radius: 0.75rem;
          background: var(--theme-teal);
          color: var(--theme-white);
          font-size: 0.9rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 16px rgba(10, 123, 110, 0.22);
          cursor: pointer;
        }
        .auth-submit:hover:not(:disabled) { background: var(--theme-teal-dark); }
        .auth-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .auth-spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255,255,255,0.35);
          border-top-color: var(--theme-white);
          border-radius: 50%;
          animation: auth-spin 0.7s linear infinite;
        }
        .auth-footer {
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid var(--theme-border);
          text-align: center;
          font-size: 0.84rem;
          color: var(--theme-slate);
        }
        .auth-link {
          color: var(--theme-teal);
          text-decoration: none;
          font-weight: 600;
        }
        .auth-link:hover { color: var(--theme-teal-dark); }
        @keyframes auth-spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 640px) {
          .auth-shell { padding: 20px 14px; }
          .auth-intro, .auth-card { padding: 18px; }
          .auth-steps { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="auth-shell">
        <div className="auth-container">
          <Link to="/" className="auth-back">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7" />
            </svg>
            Back to Home
          </Link>

          <section className="auth-intro">
            <div className="auth-kicker">
              <span className="auth-kicker-dot" />
              New Clinical Account
            </div>
            <h1 className="auth-title">Create your BTDS access profile</h1>
            <p className="auth-subtitle">
              Register once, then complete your secure clinician workflow from diagnosis through patient reporting in one environment.
            </p>
            <div className="auth-steps">
              <div className="auth-step">
                <span className="auth-step-label">Step 01</span>
                <div className="auth-step-title">Create account</div>
                <div className="auth-step-copy">Use your professional name and email.</div>
              </div>
              <div className="auth-step">
                <span className="auth-step-label">Step 02</span>
                <div className="auth-step-title">Secure credentials</div>
                <div className="auth-step-copy">Choose a strong password for protected access.</div>
              </div>
              <div className="auth-step">
                <span className="auth-step-label">Step 03</span>
                <div className="auth-step-title">Enter workspace</div>
                <div className="auth-step-copy">Sign in and continue to the clinical dashboard.</div>
              </div>
            </div>
          </section>

          <section className="auth-card">
            <div className="auth-card-header">
              <h2 className="auth-card-title">Register Account</h2>
              <p className="auth-card-copy">Complete the form below to create your login credentials.</p>
            </div>

            {error ? (
              <div className="auth-alert auth-alert--error">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            ) : null}

            {message ? <div className="auth-alert auth-alert--success">{message}</div> : null}

            <div className="auth-form">
              <div>
                <label className="auth-field-label">Username</label>
                <div className="auth-field-wrap">
                  <span className="auth-field-icon">
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    className="auth-field-input"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="auth-field-label">Email Address</label>
                <div className="auth-field-wrap">
                  <span className="auth-field-icon">
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    className="auth-field-input"
                    placeholder="Enter a valid email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="auth-field-label">Password</label>
                <div className="auth-field-wrap">
                  <span className="auth-field-icon">
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="auth-field-input auth-field-input--password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" className="auth-field-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {password ? (
                  <>
                    <div className="auth-strength-track">
                      <div className="auth-strength-fill" style={{ width: `${(strength / 4) * 100}%`, backgroundColor: strengthColor }} />
                    </div>
                    <div className="auth-strength-label" style={{ color: strengthColor }}>
                      {strengthLabel} password
                    </div>
                  </>
                ) : null}
              </div>

              <div className="auth-row">
                <label className="auth-check">
                  <input type="checkbox" id="rememberMe" />
                  Remember me
                </label>
                <span className="auth-note">Password reset not configured yet</span>
              </div>

              <button type="button" className="auth-submit" onClick={registerUser} disabled={loading}>
                {loading ? <><span className="auth-spinner" />Registering...</> : <>Create Account</>}
              </button>
            </div>

            <div className="auth-footer">
              Already have an account? <Link to="/login" className="auth-link">Login</Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
