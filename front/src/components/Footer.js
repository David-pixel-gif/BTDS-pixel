import React from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Import Font Awesome for social icons

const Footer = () => {
  // Inline styles for the footer and social icons
  const footerStyles = {
      width: '100%', // Full width for footer
      padding: '10px',
      backgroundColor: '#333',
      color: '#fff',
      textAlign: 'center',
      marginTop: 'auto', // pushes footer to the bottom if using flex layout in parent
  };

  const socialIconStyles = {
    color: '#ffffff',
    margin: '0 0.5rem',
    fontSize: '1.5rem',
    transition: 'color 0.3s ease',
  };

  const socialIconHoverStyles = {
    color: '#007bff',
  };

  return (
    <footer style={footerStyles}>
      <p>&copy; 2024 E-Website. All rights reserved.</p>
      <div>
        <a
          href="https://facebook.com"
          target="_blank"
          rel="noopener noreferrer"
          style={socialIconStyles}
          onMouseOver={(e) => (e.currentTarget.style.color = socialIconHoverStyles.color)}
          onMouseOut={(e) => (e.currentTarget.style.color = socialIconStyles.color)}
        >
          <i className="fab fa-facebook"></i>
        </a>
        <a
          href="https://twitter.com"
          target="_blank"
          rel="noopener noreferrer"
          style={socialIconStyles}
          onMouseOver={(e) => (e.currentTarget.style.color = socialIconHoverStyles.color)}
          onMouseOut={(e) => (e.currentTarget.style.color = socialIconStyles.color)}
        >
          <i className="fab fa-twitter"></i>
        </a>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          style={socialIconStyles}
          onMouseOver={(e) => (e.currentTarget.style.color = socialIconHoverStyles.color)}
          onMouseOut={(e) => (e.currentTarget.style.color = socialIconStyles.color)}
        >
          <i className="fab fa-instagram"></i>
        </a>
        <a
          href="https://linkedin.com"
          target="_blank"
          rel="noopener noreferrer"
          style={socialIconStyles}
          onMouseOver={(e) => (e.currentTarget.style.color = socialIconHoverStyles.color)}
          onMouseOut={(e) => (e.currentTarget.style.color = socialIconStyles.color)}
        >
          <i className="fab fa-linkedin"></i>
        </a>
      </div>
    </footer>
  );
};

export default Footer;
