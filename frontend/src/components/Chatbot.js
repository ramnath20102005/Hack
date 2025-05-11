import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaMicrophone, FaMicrophoneSlash, FaVolumeUp, FaVolumeMute, FaPaperPlane } from 'react-icons/fa';
import './Chatbot.css';
const chatbotIcon = "/chatbot-icon.png"; // Make sure this path is correct

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ text: "Hello! How can I assist you today?", sender: "bot" }]);
  const [userInput, setUserInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [pageData, setPageData] = useState({
    currentPage: '',
    timeOnPage: 0,
    scrollDepth: 0,
    hasInteracted: false
  });
  const [userBehavior, setUserBehavior] = useState({
    visitCount: 0,
    preferredTopic: null,
    lastVisit: null,
    lastActivity: Date.now()
  });
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [userName, setUserName] = useState('');
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const pageTimerRef = useRef(null);

  // Initialize speech recognition and voices
  useEffect(() => {
    // Get username from localStorage
    const storedUserName = localStorage.getItem('userName');
    setUserName(storedUserName || 'User');

    // Initialize available voices
    const initVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        
        // Try to restore previously selected voice from localStorage if available
        const savedVoiceName = localStorage.getItem('selectedVoice');
        if (savedVoiceName) {
          const savedVoice = voices.find(voice => voice.name === savedVoiceName);
          if (savedVoice) {
            setSelectedVoice(savedVoice);
            return;
          }
        }
        
        // Set default to a female English voice if available
        const defaultVoice = voices.find(voice => 
          voice.lang.includes('en') && voice.name.includes('Female')
        ) || voices[0];
        
        setSelectedVoice(defaultVoice);
      }
    };

    // Handle voices loaded event
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = initVoices;
      initVoices(); // Initial call in case voices are already loaded
    }

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        // Auto-send voice message after a short delay
        setTimeout(() => sendMessage(transcript), 500);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    }

    // Load user behavior data from localStorage
    const loadUserBehavior = () => {
      const savedBehavior = localStorage.getItem('userBehavior');
      if (savedBehavior) {
        const behavior = JSON.parse(savedBehavior);
        setUserBehavior({
          ...behavior,
          visitCount: behavior.visitCount + 1,
          lastActivity: Date.now()
        });
      } else {
        // First visit
        setUserBehavior({
          visitCount: 1,
          preferredTopic: null,
          lastVisit: new Date().toISOString(),
          lastActivity: Date.now()
        });
      }
    };
    loadUserBehavior();

    // Update current page info
    setPageData(prev => ({
      ...prev,
      currentPage: window.location.pathname
    }));

    // Setup page tracking without auto-activation
    setupPageTracking();

    return () => {
      // Cleanup
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (pageTimerRef.current) {
        clearInterval(pageTimerRef.current);
      }
      
      // Save user behavior before unloading
      saveUserBehavior();
    };
  }, []);

  // Show welcome message when chatbot is first opened
  useEffect(() => {
    if (isOpen && !hasShownWelcome) {
      const welcomeMessage = `Hello ${userName}! How can I assist you today?`;
      setMessages([{ text: welcomeMessage, sender: "bot" }]);
      setHasShownWelcome(true);
      if (voiceEnabled) {
        speakMessage(welcomeMessage);
      }
    }
  }, [isOpen, hasShownWelcome, userName, voiceEnabled]);

  // Function to update last activity timestamp
  const updateLastActivity = (timestamp) => {
    setUserBehavior(prev => ({
      ...prev,
      lastActivity: timestamp
    }));
  };

  // Setup page tracking functions
  const setupPageTracking = () => {
    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(eventType => {
      window.addEventListener(eventType, () => {
        updateLastActivity(Date.now());
        setPageData(prev => ({...prev, hasInteracted: true}));
      });
    });

    // Track scroll depth
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      const scrollDepth = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
      setPageData(prev => ({...prev, scrollDepth}));
    });

    // Track time on page
    pageTimerRef.current = setInterval(() => {
      setPageData(prev => ({...prev, timeOnPage: prev.timeOnPage + 1}));
    }, 1000);
  };

  // Save user behavior data
  const saveUserBehavior = () => {
    const updatedBehavior = {
      ...userBehavior,
      lastVisit: new Date().toISOString()
    };
    localStorage.setItem('userBehavior', JSON.stringify(updatedBehavior));
  };

  // Update preferred topic based on user interactions
  const updatePreferredTopic = (message) => {
    // Simple topic detection based on keywords
    const topics = {
      'course': 'courses',
      'class': 'courses',
      'learn': 'courses',
      'assignment': 'assignments',
      'homework': 'assignments',
      'submit': 'assignments',
      'exam': 'exams',
      'test': 'exams',
      'grade': 'grades',
      'score': 'grades',
      'mark': 'grades',
      'registration': 'registration',
      'enroll': 'registration',
      'sign up': 'registration'
    };
    
    const messageLower = message.toLowerCase();
    for (const [keyword, topic] of Object.entries(topics)) {
      if (messageLower.includes(keyword)) {
        setUserBehavior(prev => ({...prev, preferredTopic: topic}));
        break;
      }
    }
  };

  // Get page-specific suggestions
  const getPageSuggestions = () => {
    const path = window.location.pathname;
    
    if (path.includes('courses')) {
      return "I see you're browsing our courses. Would you like help finding a specific subject or information about course requirements?";
    } else if (path.includes('assignments')) {
      return "Looking at assignments? I can help you understand the requirements or submission process.";
    } else if (path.includes('exams')) {
      return "Preparing for exams? I can offer study tips or explain the exam format.";
    } else if (path.includes('profile')) {
      return "Need help updating your profile or changing your account settings?";
    } else if (path.includes('login') || path.includes('register')) {
      return "Having trouble logging in or creating an account? I'm here to help!";
    } else {
      return "Welcome to our learning platform! How can I assist you today?";
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (voiceEnabled) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      setIsSpeaking(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening && isOpen) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Speech recognition error:", error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const speakMessage = (text) => {
    // Only speak if chatbot is open, voice is enabled, and not already speaking
    if (!isOpen || !voiceEnabled || !window.speechSynthesis || isSpeaking) return;
    
    // Clean text of any markdown or formatting symbols
    const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/\n/g, ' ');
    
    const speech = new SpeechSynthesisUtterance(cleanText);
    
    // Always use the currently selected voice
    if (selectedVoice) {
      speech.voice = selectedVoice;
    }
    
    speech.lang = 'en-US';
    speech.volume = 1;
    speech.rate = 1;
    speech.pitch = 1;
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(speech);
    
    speech.onend = () => {
      setIsSpeaking(false);
    };
  };

  const handleVoiceChange = (event) => {
    const voiceName = event.target.value;
    const voice = availableVoices.find(v => v.name === voiceName);
    if (voice) {
      setSelectedVoice(voice);
      // Save selected voice to localStorage to persist between sessions
      localStorage.setItem('selectedVoice', voice.name);
    }
  };

  const sendMessage = async (voiceText = null) => {
    // Only process messages if chatbot is open
    if (!isOpen) return;
    
    const messageText = voiceText || userInput;
    if (!messageText.trim()) return;

    // Add user message to chat
    const updatedMessages = [...messages, { text: messageText, sender: "user" }];
    setMessages(updatedMessages);
    setUserInput("");
    
    // Update user behavior based on message content
    updatePreferredTopic(messageText);
    
    // Show typing indicator
    setTypingIndicator(true);

    try {
      const token = localStorage.getItem('token');
      
      // For demonstration, if no token, simulate a response
      if (!token) {
        setTimeout(() => {
          setTypingIndicator(false);
          
          // Get contextual response based on user message
          const botResponse = getContextualResponse(messageText);
          const newMessages = [...updatedMessages, { text: botResponse, sender: "bot" }];
          setMessages(newMessages);
          
          // Speak the response if voice is enabled and chatbot is open
          if (voiceEnabled && isOpen) {
            speakMessage(botResponse);
          }
        }, 1000);
        return;
      }

      // Send message to backend API
      const response = await axios.post(
        "http://localhost:5000/api/ai/chatbot", 
        { message: messageText },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Hide typing indicator
      setTypingIndicator(false);
      
      // Update chat with bot response
      const botResponse = response.data.response || "I couldn't process that request. Please try again.";
      const newMessages = [...updatedMessages, { text: botResponse, sender: "bot" }];
      setMessages(newMessages);
      
      // Speak the response if voice is enabled and chatbot is open
      if (voiceEnabled && isOpen) {
        speakMessage(botResponse);
      }
    } catch (error) {
      console.error("Chatbot API Error:", error);
      setTypingIndicator(false);
      
      // Provide a fallback response based on the error
      const errorMessage = error.response?.status === 401 
        ? "Please login to use the chatbot" 
        : "Error connecting to chatbot. Please try again.";
      
      setMessages([...updatedMessages, { text: errorMessage, sender: "bot" }]);
      
      if (voiceEnabled && isOpen) {
        speakMessage(errorMessage);
      }
    }
  };

  // Get contextual response based on user message and context
  const getContextualResponse = (message) => {
    const messageLower = message.toLowerCase();
    const currentPage = window.location.pathname;
    
    // Check for FAQ patterns
    if (messageLower.includes('how to') || messageLower.includes('how do i')) {
      if (messageLower.includes('register') || messageLower.includes('sign up')) {
        return "To register for courses, navigate to the 'Registration' page from the main menu, then follow the step-by-step instructions. Would you like me to show you how to get there?";
      } else if (messageLower.includes('submit') || messageLower.includes('assignment')) {
        return "To submit an assignment, go to the 'Assignments' section, select the course, and click on the specific assignment. Then use the 'Upload' button to attach your file. Would you like me to help you navigate there?";
      } else if (messageLower.includes('check') && (messageLower.includes('grade') || messageLower.includes('mark'))) {
        return "You can check your grades in the 'My Grades' section under your profile. Would you like me to show you how to access that?";
      }
    }
    
    // Check for course-related queries
    if (currentPage.includes('courses') || messageLower.includes('course') || messageLower.includes('class')) {
      if (messageLower.includes('prerequisite') || messageLower.includes('require')) {
        return "Course prerequisites are listed on each course page under the 'Requirements' tab. If you're looking at a specific course, I can help you locate this information.";
      } else if (messageLower.includes('difficult') || messageLower.includes('hard')) {
        return "The difficulty level of each course is indicated by a rating system (1-5 stars). Additionally, you can read student reviews to get a better sense of the course complexity.";
      }
    }
    
    // Check for exam-related queries
    if (currentPage.includes('exams') || messageLower.includes('exam') || messageLower.includes('test')) {
      if (messageLower.includes('schedule') || messageLower.includes('when')) {
        return "Exam schedules are posted in the 'Calendar' section and on each course page. You'll also receive email notifications one week before each exam.";
      } else if (messageLower.includes('format') || messageLower.includes('type')) {
        return "Exam formats vary by course, but typically include multiple-choice, short answer, and essay questions. The specific format for each exam is listed on the course page.";
      }
    }
    
    // Check for general greeting
    if (messageLower.includes('hello') || messageLower.includes('hi') || messageLower === 'hey') {
      return "Hello! How can I assist with your learning today?";
    }
    
    // Check for thanks
    if (messageLower.includes('thank') || messageLower.includes('thanks')) {
      return "You're welcome! Is there anything else I can help you with today?";
    }
    
    // Default response based on current page
    if (currentPage.includes('courses')) {
      return "I see you're interested in our courses. Would you like information about course content, requirements, or how to enroll?";
    } else if (currentPage.includes('assignments')) {
      return "Looking at assignments? I can help with submission guidelines, deadlines, or troubleshooting upload issues.";
    } else if (currentPage.includes('profile')) {
      return "Need help with your profile settings or account preferences?";
    } else {
      return "I'm here to help with any questions about our learning platform. You can ask about courses, assignments, exams, or getting started with your studies.";
    }
  };

  const toggleChatbot = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    // If we're closing the chatbot, make sure to stop any speech
    if (!newIsOpen && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="chatbot-container">
      <div className={`chatbot-icon ${isOpen ? 'active' : ''} ${!hasShownWelcome ? 'pulse' : ''}`} onClick={toggleChatbot}>
        <img src={chatbotIcon} alt="Chatbot" />
      </div>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>E-Buddy Learning Assistant</h3>
            <div className="chatbot-controls">
              <button 
                className={`voice-toggle ${voiceEnabled ? 'active' : ''}`}
                onClick={toggleVoice}
                title={voiceEnabled ? "Disable voice" : "Enable voice"}
              >
                {voiceEnabled ? "🔊" : "🔇"}
              </button>
              <button onClick={toggleChatbot} className="close-btn">×</button>
            </div>
          </div>

          <div className="chatbot-options">
            {availableVoices.length > 0 && (
              <select 
                value={selectedVoice ? selectedVoice.name : ''} 
                onChange={handleVoiceChange}
                className="voice-selector"
              >
                {availableVoices.map(voice => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="chatbot-body">
            {messages.map((msg, index) => (
              <p key={index} className={msg.sender === "user" ? "user-message" : "bot-message"}>
                {msg.text}
              </p>
            ))}
            
            {typingIndicator && (
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-footer">
            <input
              type="text"
              placeholder="Type your message..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            
            <button 
              className={`mic-button ${isListening ? 'listening' : ''}`}
              onClick={isListening ? stopListening : startListening}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? "🎤❌" : "🎤"}
            </button>
            
            <button onClick={() => sendMessage()} className="send-button">
              📤
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot; 