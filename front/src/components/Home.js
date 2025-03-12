import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaBrain, FaMicroscope, FaUserMd, FaFileMedicalAlt, FaChartLine } from 'react-icons/fa';

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="text-center text-light d-flex align-items-center justify-content-center" style={styles.heroSection}>
        <Container>
          <h1 className="display-3 fw-bold" style={styles.heroText}>Welcome to MySecond-Opinion</h1>
          <p className="lead" style={styles.heroSubtext}>Brain Tumor Detection Using Advanced Neural Networks</p>
          <Button variant="primary" size="lg" className="mt-4" href="/register">
            Get Started
          </Button>
        </Container>
      </section>

      {/* About Section */}
      <section className="about py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="display-4 fw-bold" style={styles.sectionHeading}>About Us</h2>
              <p className="lead text-muted">
                At MySecond-Opinion, we provide cutting-edge solutions for brain tumor diagnosis, using deep learning algorithms and MRI scans to assist doctors in accurate tumor detection.
              </p>
            </Col>
          </Row>
          <Row>
            {[
              { title: "Advanced Diagnostics", icon: <FaBrain />, text: "Our neural networks analyze MRI scans to detect even the smallest abnormalities, giving doctors a second, reliable opinion." },
              { title: "State-of-the-Art Technology", icon: <FaMicroscope />, text: "We use the latest advancements in AI to improve detection accuracy and speed, providing results within minutes." },
              { title: "Expert Support", icon: <FaUserMd />, text: "Our platform assists medical professionals by providing clear, actionable insights from MRI scans." },
            ].map((item, idx) => (
              <Col md={4} key={idx}>
                <Card className="shadow-sm mb-4 h-100 text-center" style={styles.card}>
                  <Card.Body>
                    <div className="text-primary mb-3" style={styles.icon}>{item.icon}</div>
                    <h3 style={styles.cardTitle}>{item.title}</h3>
                    <p className="text-muted">{item.text}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Services Section */}
      <section className="services py-5" style={styles.servicesSection}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="display-4 fw-bold" style={styles.sectionHeading}>Our Services</h2>
              <p className="lead text-muted">Delivering quality healthcare through innovation and AI-driven solutions.</p>
            </Col>
          </Row>
          <Row>
            {[
              { title: "MRI Scan Analysis", icon: <FaFileMedicalAlt />, text: "Upload your MRI scans to receive a detailed analysis powered by deep learning models, providing a second opinion for brain tumor detection." },
              { title: "Diagnostic Reports", icon: <FaChartLine />, text: "Generate comprehensive reports that detail the findings from the MRI scan, including tumor size, location, and type." },
            ].map((service, idx) => (
              <Col md={6} key={idx}>
                <Card className="shadow-lg mb-4 h-100 text-center" style={styles.card}>
                  <Card.Body>
                    <div className="text-primary mb-3" style={styles.icon}>{service.icon}</div>
                    <h3 style={styles.cardTitle}>{service.title}</h3>
                    <p className="text-muted">{service.text}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Call to Action Section */}
      <section className="text-light text-center py-5" style={styles.ctaSection}>
        <Container>
          <h2 className="display-4 fw-bold mb-3" style={styles.sectionHeading}>Ready to Improve Patient Outcomes?</h2>
          <p className="lead mb-4">Sign up today and leverage AI to make diagnosis faster and more accurate.</p>
          <Button variant="primary" size="lg" href="/register">
            Join Us Now
          </Button>
        </Container>
      </section>
    </div>
  );
};

// Inline styles for the component
const styles = {
  heroSection: {
    minHeight: '75vh',
    backgroundImage: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', // Modern gradient background
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '4rem 0',
  },
  heroText: {
    color: '#2d2d2d', // Darker color for primary hero text
  },
  heroSubtext: {
    color: '#6c757d', // Subtle gray for hero subtext
  },
  sectionHeading: {
    color: '#2d2d2d',
  },
  servicesSection: {
    backgroundColor: '#f8f9fa',
  },
  icon: {
    fontSize: '3rem',
  },
  card: {
    transition: 'transform 0.3s ease-in-out',
  },
  cardTitle: {
    color: '#2d2d2d',
  },
  ctaSection: {
    backgroundColor: '#2d2d2d',
  },
};

export default Home;
