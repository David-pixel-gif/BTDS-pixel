// Layout.jsx
import React from 'react';
import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHome, FaUser, FaDiagnoses, FaChartLine, FaCogs } from 'react-icons/fa';

const Layout = ({ children }) => {
  const styles = {
    navbar: {
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      backgroundColor: '#343a40',
    },
    navbarBrand: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#f8f9fa',
    },
    navLink: {
      color: '#f8f9fa',
      fontWeight: '500',
      transition: 'color 0.2s ease-in-out',
    },
    navLinkHover: {
      color: '#adb5bd',
    },
    dropdownMenu: {
      backgroundColor: '#343a40',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    },
    dropdownItem: {
      color: '#f8f9fa',
      padding: '10px 20px',
      fontWeight: '500',
      transition: 'background-color 0.2s ease-in-out',
    },
    dropdownItemHover: {
      backgroundColor: '#495057',
    },
    dropdownDivider: {
      borderTop: '1px solid #495057',
    },
    dropdownHeader: {
      fontSize: '0.9rem',
      color: '#adb5bd',
      textTransform: 'uppercase',
      padding: '8px 20px',
    },
    mainContent: {
      padding: '2rem',
      backgroundColor: '#f8f9fa',
      minHeight: 'calc(100vh - 56px)',
    },
    icon: {
      marginRight: '0.5rem',
    },
  };

  return (
    <div>
      {/* Navbar */}
      <Navbar expand="lg" style={styles.navbar} sticky="top">
        <Container>
          <Navbar.Brand as={Link} to="/" style={styles.navbarBrand}>
            <FaHome style={styles.icon} /> MyHealthPoint
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Collapse id="navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/" style={styles.navLink}>
                Home
              </Nav.Link>

              {/* Expert Support Dropdown */}
              <NavDropdown title="Expert Support" id="expert-support-dropdown">
                <NavDropdown.Header style={styles.dropdownHeader}>Account Management</NavDropdown.Header>
                <NavDropdown.Item as={Link} to="/login" style={styles.dropdownItem}>Login</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/register" style={styles.dropdownItem}>Register</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/logout" style={styles.dropdownItem}>Logout</NavDropdown.Item>
                <NavDropdown.Divider style={styles.dropdownDivider} />
                <NavDropdown.Header style={styles.dropdownHeader}>Patient Information</NavDropdown.Header>
                <NavDropdown.Item as={Link} to="/patient-registration" style={styles.dropdownItem}>Patient Registration</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/patient-history" style={styles.dropdownItem}>Patient History</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/patient-details" style={styles.dropdownItem}>Patient Details</NavDropdown.Item>
                <NavDropdown.Divider style={styles.dropdownDivider} />
                <NavDropdown.Header style={styles.dropdownHeader}>Profile & RBAC</NavDropdown.Header>
                <NavDropdown.Item as={Link} to="/ProfilePage" style={styles.dropdownItem}>Profile</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/role-management" style={styles.dropdownItem}>Role Management</NavDropdown.Item>
              </NavDropdown>

              {/* Diagnostics Dropdown */}
              <NavDropdown title={<span><FaDiagnoses style={styles.icon} /> Advanced Diagnostics</span>} id="diagnostics-dropdown">
                <NavDropdown.Item as={Link} to="/diagnosis" style={styles.dropdownItem}>Diagnostics</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/mri-scan-analysis" style={styles.dropdownItem}>MRI Scan Analysis</NavDropdown.Item>
              </NavDropdown>

              {/* Analytics Dropdown */}
              <NavDropdown title={<span><FaChartLine style={styles.icon} /> Analytics & Results</span>} id="analytics-dropdown">
                <NavDropdown.Item as={Link} to="/reports" style={styles.dropdownItem}>Reports</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/outcome-analysis" style={styles.dropdownItem}>Outcome Analysis</NavDropdown.Item>
              </NavDropdown>

              {/* Settings Link */}
              <Nav.Link as={Link} to="/settings" style={styles.navLink}>
                <FaCogs style={styles.icon} /> Settings
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <main style={styles.mainContent}>{children}</main>
    </div>
  );
};

export default Layout;
