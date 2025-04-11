import React, { useState, useRef, useEffect } from "react";
import Chatbot from "./Chatbot";
import "./welcome.css";

const WelcomePage = () => {
  const [showChatbot, setShowChatbot] = useState(false);
  const [initialMessage, setInitialMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle Enter key press or clicking the button
  const handleStartChat = () => {
    if (initialMessage.trim()) {
      setShowChatbot(true);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && initialMessage.trim()) {
      event.preventDefault();
      handleStartChat();
    }
  };

  // Focus input when component mounts with safety check and delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
    
    // Cleanup the timeout if component unmounts
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`app-container ${showChatbot ? "transition-active" : ""}`}>
      {!showChatbot ? (
        <div className="welcome-container">
          <div className="welcome-content">
            <h1>Welcome to Legal Advisor</h1>
            <p>Search your queries, ask questions, know the law and more...</p>
            
            <div className="welcome-input-container">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type your legal question here..."
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button onClick={handleStartChat}>Get Started</button>
            </div>
          </div>
        </div>
      ) : (
        <Chatbot initialMessage={initialMessage} />
      )}
    </div>
  );
};

export default WelcomePage;