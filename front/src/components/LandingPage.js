import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const LandingPage = () => {
  return (
    <div className="container-fluid d-flex flex-column align-items-center justify-content-center min-vh-100" style={styles.container}>
      
      {/* 🔹 System Title at the Top */}
      <h1 style={styles.systemTitle}>Advanced vision for brain scans</h1>

      {/* Hero Section */}
      <div className="row align-items-center w-100 text-center text-md-start">
        {/* Left Content */}
        <div className="col-md-6 px-5" style={styles.fadeIn}>
          <h1 style={styles.heading}>
            Get a <span style={styles.highlight}>Second Opinion</span>
          </h1>
          <h2 style={styles.subheading}>
            Making the Right Decision for <br /> Cancer Care
          </h2>
          <p style={styles.paragraph}>
            Our expert oncologists provide trusted second opinions to help patients make informed decisions about their treatment journey.
          </p>
          <div className="d-flex gap-3 justify-content-center justify-content-md-start mt-4">
            <Link to="/register" className="btn btn-lg" style={styles.registerButton}>
              REGISTER
            </Link>
            <Link to="/login" className="btn btn-lg" style={styles.loginButton}>
              LOGIN
            </Link>
          </div>
        </div>

        {/* Right Image */}
        <div className="col-md-6 d-flex justify-content-center" style={styles.imageContainer}>
          <img
            src="/medical_consultation.png"
            alt="Medical Consultation"
            className="img-fluid"
            style={styles.image}
          />
        </div>
      </div>

      {/* About Us Section */}
      <div className="mt-5 text-center w-75 p-4 rounded" style={styles.aboutUs}>
        <h3 style={styles.heading}>About Us</h3>
        <p style={styles.paragraph}>
          We are committed to providing comprehensive second opinions for cancer patients. Our specialized oncologists carefully review your
          diagnosis, medical history, and test results to offer a trusted recommendation for your next steps in treatment.
        </p>
      </div>

      {/* Call to Action */}
      <div className="mt-5 text-center">
        <h4 style={styles.subheading}>Still have questions?</h4>
        <p style={styles.paragraph}>Our team is here to help. Contact us for personalized assistance.</p>
        <Link to="/contact" className="btn btn-lg" style={styles.contactButton}>
          CONTACT US
        </Link>
      </div>
    </div>
  );
};

// **Enhanced Inline Styles**
const styles = {
  container: {
    background: "linear-gradient(to right, #E3F2FD, #BBDEFB)",
    fontFamily: "'Poppins', sans-serif",
    padding: "40px 0",
  },
  systemTitle: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#0d6efd",
    textAlign: "center",
    marginBottom: "30px",
  },
  fadeIn: {
    animation: "fadeIn 1.5s ease-in-out",
  },
  heading: {
    fontWeight: "bold",
    color: "#212529",
    fontSize: "2.5rem",
  },
  highlight: {
    color: "#0d6efd",
  },
  subheading: {
    fontWeight: "bold",
    color: "#0d6efd",
    fontSize: "1.8rem",
  },
  paragraph: {
    fontSize: "1.2rem",
    color: "#6c757d",
    lineHeight: "1.6",
  },
  registerButton: {
    backgroundColor: "#0d6efd",
    color: "#fff",
    padding: "14px 28px",
    borderRadius: "8px",
    fontWeight: "bold",
    textTransform: "uppercase",
    transition: "0.3s ease-in-out",
    border: "none",
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
  },
  loginButton: {
    backgroundColor: "transparent",
    border: "2px solid #0d6efd",
    color: "#0d6efd",
    padding: "14px 28px",
    borderRadius: "8px",
    fontWeight: "bold",
    textTransform: "uppercase",
    transition: "0.3s ease-in-out",
  },
  contactButton: {
    backgroundColor: "#ff6600",
    color: "#fff",
    padding: "14px 28px",
    borderRadius: "8px",
    fontWeight: "bold",
    textTransform: "uppercase",
    transition: "0.3s ease-in-out",
    border: "none",
    marginTop: "10px",
  },
  imageContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    maxHeight: "500px",
    animation: "fadeIn 1.5s ease-in-out",
    borderRadius: "12px",
    boxShadow: "0px 15px 30px rgba(0, 0, 0, 0.1)",
    transform: "scale(1)",
    transition: "0.3s ease-in-out",
  },
  aboutUs: {
    backgroundColor: "#fff",
    boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)",
    borderRadius: "12px",
    lineHeight: "1.6",
  },
};

export default LandingPage;
