import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button, Form } from 'react-bootstrap';
import Chatbot from '../components/Chatbot';
import './Home.css';

const Home = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    
    // Redirect instructors to their dashboard
    if (userRole === 'instructor') {
      navigate('/instructor');
      return;
    }

    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          setLoading(false);
          return;
        }

        const response = await axios.get('http://localhost:5000/api/courses/student', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('Fetched courses:', response.data);
        // Limit to 9 recommended courses
        setCourses(response.data.slice(0, 9));
      } catch (error) {
        console.error('Error fetching courses:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [navigate]);

  // Handle search input changes
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearch(query);
    
    if (query.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Add debounce to prevent too many API calls
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(
          `http://localhost:5000/api/courses/search?query=${encodeURIComponent(query.trim())}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            timeout: 5000 // Add timeout
          }
        );

        if (response.data && Array.isArray(response.data)) {
          setSearchResults(response.data);
        } else {
          console.error('Invalid response format:', response.data);
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching courses:', error);
        setSearchResults([]);
        // Don't show error to user, just show no results
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  };

  const handleCourseClick = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  const handleEnroll = async (courseId, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.post(`http://localhost:5000/api/courses/${courseId}/enroll`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setCourses(courses.map(course => 
        course._id === courseId 
          ? { ...course, isEnrolled: true }
          : course
      ));
    } catch (error) {
      console.error('Error enrolling in course:', error);
      if (error.response?.status === 400) {
        alert('You are already enrolled in this course');
      } else if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        alert('Failed to enroll in course. Please try again.');
      }
    }
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to E-Learning Platform</h1>
          <p>Your gateway to knowledge and professional growth</p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>How Our Platform Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Browse Courses</h3>
            <p>Explore a wide range of courses from expert instructors</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Enroll & Learn</h3>
            <p>Enroll in courses and access high-quality learning materials</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Track Progress</h3>
            <p>Monitor your learning journey with our progress tracking system</p>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="featured-courses">
        <h2>Featured Courses</h2>
        <Form className="mb-4" style={{ maxWidth: 400 }}>
          <Form.Control
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={handleSearch}
          />
        </Form>
        {loading ? (
          <div className="loading">Loading courses...</div>
        ) : (
          <div className="course-grid">
            {(search.trim() ? searchResults : courses).map((course) => (
              <div 
                key={course._id} 
                className="course-card"
                onClick={() => handleCourseClick(course._id)}
              >
                <div className="course-image">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} />
                  ) : (
                    <div className="default-thumbnail">Course Image</div>
                  )}
                </div>
                <div className="course-info">
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <div className="course-meta">
                    <span>Instructor: {course.instructor?.name || 'Unknown Instructor'}</span>
                    <span>Duration: {course.duration}</span>
                  </div>
                  <Button
                    variant={course.isEnrolled ? "success" : "primary"}
                    onClick={(e) => handleEnroll(course._id, e)}
                    disabled={course.isEnrolled}
                  >
                    {course.isEnrolled ? "Enrolled" : "Enroll Now"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {search.trim() && searchResults.length === 0 && !isSearching && (
          <div className="no-courses">
            <p>No courses found matching your search.</p>
          </div>
        )}
      </section>

      {/* Add Chatbot component */}
      <Chatbot />
    </div>
  );
};

export default Home; 