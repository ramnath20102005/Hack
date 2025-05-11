import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Alert, Form, Row, Col, ProgressBar } from 'react-bootstrap';
import { FaUserGraduate, FaCalendarAlt, FaBook, FaCheckCircle } from 'react-icons/fa';
import Confetti from 'react-confetti';

const AssignmentAttempt = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/assignments/${assignmentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch assignment');
        const data = await response.json();
        setAssignment(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [assignmentId]);

  const handleOptionChange = (questionId, optionText) => {
    setAnswers({ ...answers, [questionId]: optionText });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/assignments/${assignmentId}/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'Submission failed');
      setScore(data.score);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentQuestion((prev) => Math.min(prev + 1, assignment.questions.length - 1));
  };
  const handlePrev = () => {
    setCurrentQuestion((prev) => Math.max(prev - 1, 0));
  };

  if (loading && !assignment) return <Container className="mt-5 text-center"><div className="spinner-border" role="status"></div></Container>;
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
  if (!assignment) return null;

  return (
    <Container className="mt-5 mb-5">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={400} />}
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-lg p-3 mb-4 bg-white rounded quiz-attempt-card animate__animated animate__fadeIn">
            <Card.Body>
              <div className="d-flex align-items-center mb-4">
                {assignment.thumbnail ? (
                  <img src={assignment.thumbnail} alt="Assignment Thumbnail" className="img-fluid rounded me-3" style={{ width: 80, height: 80, objectFit: 'cover', boxShadow: '0 4px 16px #6e8efb33' }} />
                ) : (
                  <div className="default-thumbnail me-3" style={{ width: 80, height: 80, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>No Image</div>
                )}
                <div>
                  <h2 className="mb-1 quiz-title-gradient">{assignment.title}</h2>
                  <div className="text-muted mb-2">{assignment.description}</div>
                  <div className="d-flex flex-wrap gap-3">
                    <span className="badge bg-primary"><FaUserGraduate className="me-1" /> {assignment.enrolledStudents || 0} Students</span>
                    <span className="badge bg-info text-dark"><FaCalendarAlt className="me-1" /> {assignment.duration || 'Flexible'} weeks</span>
                    <span className="badge bg-secondary"><FaBook className="me-1" /> {assignment.level || 'All Levels'}</span>
                    <span className="badge bg-light text-dark border"><b>Instructor:</b> {assignment.instructor?.name || 'Unknown'}</span>
                    <span className="badge bg-light text-dark border"><b>Created:</b> {assignment.createdAt ? new Date(assignment.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
              <ProgressBar now={((currentQuestion+1)/assignment.questions.length)*100} className="mb-4 quiz-progress-bar" style={{height: '10px', borderRadius: '8px', background: '#f3f6fd'}} />
              <Form onSubmit={handleSubmit} className="mt-4 animate__animated animate__fadeInUp">
                {assignment.questions.map((q, idx) => (
                  <div key={q._id} style={{ display: idx === currentQuestion ? 'block' : 'none', transition: 'all 0.5s' }}>
                    <Card className={`mb-3 border-0 shadow-sm quiz-question-card ${idx === currentQuestion ? 'active-question' : ''}`}>
                    <Card.Body>
                        <Card.Subtitle className="mb-2 fw-bold quiz-question-title">Q{idx + 1}: {q.questionText}</Card.Subtitle>
                      <div className="ms-3">
                        {q.options.map((opt, oidx) => (
                          <Form.Check
                            key={oidx}
                            type="radio"
                            name={q._id}
                            label={opt.text}
                            value={opt.text}
                            checked={answers[q._id] === opt.text}
                            onChange={() => handleOptionChange(q._id, opt.text)}
                            disabled={submitted}
                              className={`mb-2 quiz-option ${answers[q._id] === opt.text ? 'selected-option animate__animated animate__pulse' : ''}`}
                          />
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                  </div>
                ))}
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <Button variant="outline-primary" onClick={handlePrev} type="button" disabled={currentQuestion === 0}>Previous</Button>
                  {!submitted && (
                    currentQuestion === assignment.questions.length - 1 ? (
                      <Button type="submit" variant="success" className="quiz-submit-btn animate__animated animate__pulse">Submit Quiz</Button>
                    ) : (
                      <Button variant="primary" onClick={handleNext} type="button" className="quiz-next-btn animate__animated animate__pulse">Next</Button>
                    )
                  )}
                </div>
              </Form>
              {submitted && score !== null && (
                <Alert variant="success" className="mt-4 text-center animate__animated animate__fadeInDown">
                  <h5 className="mb-2"><FaCheckCircle className="me-2 text-success" />Quiz submitted!</h5>
                  <div>Your score: <b>{score} / {assignment.totalPoints}</b></div>
                </Alert>
              )}
              {error && (
                <Alert variant="danger" className="mt-3 animate__animated animate__shakeX">{error}</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AssignmentAttempt; 