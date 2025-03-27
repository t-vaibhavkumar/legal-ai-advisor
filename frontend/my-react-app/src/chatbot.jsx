import React, { useState, useEffect, useRef } from "react";
import "./chatbot.css";

const askQuestion = async (query) => {
  try {
    const temp = {
      "query" : query
    }
    console.log("Sending request to API...");
    const response = await fetch("http://127.0.0.1:5000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify( temp ),
    });

    console.log("Response received:", response);

    const data = await response.json();
    console.log("API Response:", data);
    return data.response;
  } catch (error) {
    console.error("Error fetching response:", error);
    return "Error fetching response";
  }
};

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);

  // const test = () => {
  //   botReplyText = "<script>alert('Hacked!')</script>"
  //   const botReply = { text: botReplyText, sender: "bot" };

  //   setMessages((prevMessages) => [...prevMessages, botReply]);
  // }

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    setLoading(true);
    const userMessage = { text: input, sender: "user" };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");

    const botReplyText = await askQuestion(input);
    const botReply = { text: botReplyText, sender: "bot" };

    setMessages((prevMessages) => [...prevMessages, botReply]);
    setLoading(false);

    // Keep input focused
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !loading) {
      event.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    chatBoxRef.current?.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

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
