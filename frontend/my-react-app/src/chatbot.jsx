import React, { useState, useEffect, useRef } from "react";
import "./chatbot.css";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatBoxRef = useRef(null);
  const inputRef = useRef(null); // Reference to input field

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    setLoading(true); // Disable input while waiting
    const userMessage = { text: input, sender: "user" };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    setInput(""); // Clear input field

    // Simulate bot response delay
    setTimeout(() => {
      const botReply = { text: "Hello! How can I assist you?", sender: "bot" };
      setMessages((prevMessages) => [...prevMessages, botReply]);
      setLoading(false); // Re-enable input

      // Ensure the cursor stays in the input field
      setTimeout(() => inputRef.current?.focus(), 10);
    }, 1000);
  };

  // Handle Enter key press
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !loading) {
      event.preventDefault();
      handleSend();
    }
  };

  // Auto-scroll to the latest message
  useEffect(() => {
    chatBoxRef.current?.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Keep focus on input when component renders
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="chat-container">
      <div className="chat-box" ref={chatBoxRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={loading ? "Waiting for response..." : "Ask anything..."}
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading}>➤</button>
      </div>
    </div>
  );
};

export default Chatbot;
