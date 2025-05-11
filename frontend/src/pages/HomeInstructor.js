import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  FaChalkboardTeacher, 
  FaUsers, 
  FaBook, 
  FaChartLine, 
  FaLaptop, 
  FaCertificate,
  FaPlus,
  FaVideo,
  FaFileAlt,
  FaGraduationCap,
  FaComments
} from 'react-icons/fa';
import './HomeInstructor.css';

const HomeInstructor = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FaLaptop />,
      title: 'Create Engaging Courses',
      description: 'Design comprehensive courses with our intuitive course builder. Add videos, documents, quizzes, and interactive content to create an engaging learning experience.'
    },
    {
      icon: <FaVideo />,
      title: 'Live Interactive Sessions',
      description: 'Conduct real-time classes with integrated video conferencing. Share your screen, interact with students, and answer questions instantly.'
    },
    {
      icon: <FaFileAlt />,
      title: 'Assignment Management',
      description: 'Create and manage assignments, track submissions, and provide personalized feedback to help students excel in their learning journey.'
    }
  ];

  const benefits = [
    {
      icon: <FaGraduationCap />,
      title: 'Professional Growth',
      description: 'Expand your reach and impact as an educator. Share your expertise with students worldwide and build your teaching portfolio.'
    },
    {
      icon: <FaChartLine />,
      title: 'Performance Analytics',
      description: 'Track student progress, engagement metrics, and course performance. Use data-driven insights to improve your teaching methods.'
    },
    {
      icon: <FaUsers />,
      title: 'Community Building',
      description: 'Create a vibrant learning community. Connect with students, share resources, and foster collaborative learning.'
    }
  ];

  return (
    <div className="instructor-home">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="animate-slide-down">Welcome to Your Teaching Journey</h1>
          <p className="animate-fade-in">Share your expertise, inspire learners, and make a lasting impact through education</p>
          <div className="hero-actions animate-fade-in">
            <Button 
              variant="light" 
              size="lg" 
              className="create-course-btn"
              onClick={() => navigate('/course/create')}
            >
              <FaPlus className="me-2" /> Create Your First Course
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <Container>
          <h2 className="section-title">How It Works</h2>
          <div className="steps-container">
            <div className="step-item">
              <div className="step-number">1</div>
              <h3>Create Your Course</h3>
              <p>Design your curriculum, upload materials, and structure your content using our intuitive course builder. Add videos, documents, and interactive elements to create an engaging learning experience.</p>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <h3>Engage with Students</h3>
              <p>Conduct live sessions, answer questions, and provide feedback. Use our interactive tools to keep students engaged and motivated throughout their learning journey.</p>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <h3>Track Progress</h3>
              <p>Monitor student performance, track engagement metrics, and analyze course effectiveness. Use these insights to continuously improve your teaching methods.</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <Container>
          <h2 className="section-title">Teaching Tools</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="feature-card animate-fade-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <Container>
          <h2 className="section-title">Why Teach With Us</h2>
          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="benefit-card animate-fade-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="benefit-icon">{benefit.icon}</div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <Container>
          <div className="cta-content">
            <h2>Ready to Start Teaching?</h2>
            <p>Join our community of educators and share your knowledge with students worldwide</p>
            <Button 
              variant="light" 
              size="lg" 
              className="create-course-btn"
              onClick={() => navigate('/course/create')}
            >
              <FaPlus className="me-2" /> Create Your Course Now
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default HomeInstructor; 