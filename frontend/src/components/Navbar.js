import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Dropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaBook, FaTasks, FaChalkboardTeacher, FaCog, FaHome, FaGraduationCap, FaChartLine } from 'react-icons/fa';
import './Navbar.css';

const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
  const [userName, setUserName] = useState(localStorage.getItem('userName') || 'User');
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Update token and role when they change in localStorage
    const handleStorageChange = () => {
      setToken(localStorage.getItem('token'));
      setUserRole(localStorage.getItem('userRole'));
      setUserName(localStorage.getItem('userName') || 'User');
    };

    // Handle scroll event for navbar styling
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('scroll', handleScroll);
    
    // Initial check for authentication
    handleStorageChange();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userSkills');
    localStorage.removeItem('profileImage');
    setToken(null);
    setUserRole(null);
    navigate('/login');
  };

  // Check if the current path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <Navbar 
      expand="lg" 
      className={`main-navbar ${scrolled ? 'scrolled' : ''} ${expanded ? 'expanded' : ''}`}
      onToggle={(expanded) => setExpanded(expanded)}
    >
      <Container fluid className="px-4">
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center brand-container">
          <div className="logo-container">
            <FaGraduationCap className="logo-icon" />
          </div>
          <div className="brand-text">
            <span className="brand-primary">E-Learning</span>
            <span className="brand-secondary">Platform</span>
          </div>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" className="navbar-toggler" />
        
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-between">
          <Nav className="me-auto main-nav">
            {!token ? (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/login" 
                  className={`nav-link ${isActive('/login') ? 'active' : ''}`}
                >
                  <FaUser className="nav-icon" />
                  <span>Login</span>
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/signup" 
                  className={`nav-link ${isActive('/signup') ? 'active' : ''}`}
                >
                  <FaUser className="nav-icon" />
                  <span>Signup</span>
                </Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/" 
                  className={`nav-link ${isActive('/') ? 'active' : ''}`}
                >
                  <FaHome className="nav-icon" />
                  <span>Home</span>
                </Nav.Link>
                
                <Nav.Link 
                  as={Link} 
                  to="/profile" 
                  className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
                >
                  <FaUser className="nav-icon" />
                  <span>Profile</span>
                </Nav.Link>
                
                {userRole === 'student' && (
                  <>
                    <Nav.Link 
                      as={Link} 
                      to="/courses" 
                      className={`nav-link ${isActive('/courses') ? 'active' : ''}`}
                    >
                      <FaBook className="nav-icon" />
                      <span>My Courses</span>
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/assignments" 
                      className={`nav-link ${isActive('/assignments') ? 'active' : ''}`}
                    >
                      <FaTasks className="nav-icon" />
                      <span>Assignments</span>
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/career-guidance" 
                      className={`nav-link ${isActive('/career-guidance') ? 'active' : ''}`}
                    >
                      <FaChartLine className="nav-icon" />
                      <span>Career Guidance</span>
                    </Nav.Link>
                  </>
                )}
                
                {userRole === 'instructor' && (
                  <>
                    <Nav.Link 
                      as={Link} 
                      to="/instructor" 
                      className={`nav-link ${isActive('/instructor') ? 'active' : ''}`}
                    >
                      <FaChalkboardTeacher className="nav-icon" />
                      <span>Manage Courses</span>
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      to="/manage-assignments" 
                      className={`nav-link ${isActive('/manage-assignments') ? 'active' : ''}`}
                    >
                      <FaTasks className="nav-icon" />
                      <span>Manage Assignments</span>
                    </Nav.Link>
                  </>
                )}
              </>
            )}
          </Nav>
          
          {token && (
            <div className="user-section">
              <Dropdown align="end" className="user-dropdown">
                <Dropdown.Toggle variant="link" id="dropdown-user" className="user-toggle">
                  <div className="user-avatar">
                    {localStorage.getItem('profileImage') ? (
                      <img 
                        src={localStorage.getItem('profileImage')} 
                        alt="Profile" 
                        className="profile-image"
                      />
                    ) : (
                      <FaUser />
                    )}
                  </div>
                  <span className="user-name">{userName}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="dropdown-menu">
                  <Dropdown.Item as={Link} to="/profile" className="dropdown-item">
                    <FaUser className="dropdown-icon" />
                    <span>Profile</span>
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/settings" className="dropdown-item">
                    <FaCog className="dropdown-icon" />
                    <span>Settings</span>
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout} className="dropdown-item">
                    <FaSignOutAlt className="dropdown-icon" />
                    <span>Logout</span>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;