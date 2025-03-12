import React, { useEffect } from 'react';
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

const Topbar = () => {
  return (
    <Navbar expand="lg" bg="dark" variant="dark" sticky="top" className="py-3" style={{ fontSize: '1.2rem' }}>
      <Container>
        <Navbar.Brand as={Link} to="/" style={{ fontSize: '1.5rem', padding: '0.8rem 1rem' }}>MyAI Dashboard</Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto">
            {/* Home Link */}
            <Nav.Link as={Link} to="/" style={{ fontSize: '1.2rem', padding: '0.8rem 1rem' }}>Home</Nav.Link>

            {/* Expert Support Dropdown */}
            <NavDropdown title="Expert Support" id="expert-support-dropdown" style={{ fontSize: '1.2rem', padding: '0.8rem 1rem' }}>
              <NavDropdown.Item as={Link} to="/login">Login</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/register">Register</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/logout">Logout</NavDropdown.Item>

              {/* Account Management Submenu */}
              <NavDropdown title="Account Management" id="account-management-dropdown" drop="end">
                <NavDropdown.Item as={Link} to="/patient-registration">Patient Registration</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/patient-history">Patient History</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/patient-details">Patient Details</NavDropdown.Item>
              </NavDropdown>

              {/* Profile & RBAC Submenu */}
              <NavDropdown title="Profile & RBAC" id="profile-rbac-dropdown" drop="end">
                <NavDropdown.Item as={Link} to="/ProfilePage">Profile</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/role-management">Role Management</NavDropdown.Item>
              </NavDropdown>
            </NavDropdown>

            {/* Advanced Diagnostics Dropdown */}
            <NavDropdown title="Advanced Diagnostics" id="advanced-diagnostics-dropdown" style={{ fontSize: '1.2rem', padding: '0.8rem 1rem' }}>
              <NavDropdown.Item as={Link} to="/diagnosis">Diagnostics</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/mri-scan-analysis">MRI Scan Analysis</NavDropdown.Item>
            </NavDropdown>

            {/* Analytics & Results Dropdown */}
            <NavDropdown title="Analytics & Results" id="analytics-results-dropdown" style={{ fontSize: '1.2rem', padding: '0.8rem 1rem' }}>
              <NavDropdown.Item as={Link} to="/reports">Reports</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/outcome-analysis">Outcome Analysis</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/ml-pipelines">Machine Learning Pipelines</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>

      {/* Inline CSS for custom dropdown and navbar styling */}
      <style type="text/css">{`
        .navbar {
          font-size: 1.1rem;
        }

        .navbar .nav-link, .navbar .navbar-brand, .navbar .nav-dropdown {
          font-size: 1.2rem;
          padding: 0.8rem 1rem;
        }

        #expert-support-dropdown .dropdown-menu,
        #account-management-dropdown .dropdown-menu,
        #profile-rbac-dropdown .dropdown-menu,
        #advanced-diagnostics-dropdown .dropdown-menu,
        #analytics-results-dropdown .dropdown-menu {
          background-color: #343a40;
          border: 1px solid #6c757d;
          font-size: 1rem;
        }

        #expert-support-dropdown .dropdown-menu .submenu:hover .dropdown-menu {
          display: block;
        }

        .navbar .dropdown-menu .submenu .dropdown-item:hover {
          background-color: #495057;
        }
      `}</style>
    </Navbar>
  );
};

const Layout = ({ children }) => {
  const navigate = useNavigate();

  // Check if user is authenticated by checking for accessToken in localStorage
  const isAuthenticated = () => {
    return !!localStorage.getItem('accessToken');
  };

  useEffect(() => {
    // Redirect to login page if not authenticated
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  // Only render layout if authenticated
  if (!isAuthenticated()) return null;

  return (
    <div>
      {/* Top Navigation Bar */}
      <Topbar />

      {/* Main Content Area */}
      <main style={{ padding: '20px' }}>{children}</main>
    </div>
  );
};

export default Layout;
