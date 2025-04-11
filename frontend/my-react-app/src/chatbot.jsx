import React, { useState, useEffect, useRef } from "react";
import "./chatbot.css";

const askQuestion = async (query) => {
  const backendUrl = "http://172.16.239.65:5000/ask"
  try {
    const temp = {
      "query" : query
    }
    console.log("Sending request to API...");
    const response = await fetch(backendUrl, {
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
    return "⚠️ Sorry, the server is not responding. Please try again later.";
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
    const updatedUserMessages = [...messages, userMessage];
  
    setMessages(updatedUserMessages);
    setInput("");
    localStorage.setItem("chat-messages", JSON.stringify(updatedUserMessages));
  
    const botReplyText = await askQuestion(input);
    const botReply = {
      text: botReplyText,
      sender: "bot"
    };
  
    const updatedAllMessages = [...updatedUserMessages, botReply];
    setMessages(updatedAllMessages);
    localStorage.setItem("chat-messages", JSON.stringify(updatedAllMessages));
    setLoading(false);
  
    setTimeout(() => inputRef.current?.focus(), 10);
  };
  

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !loading) {
      event.preventDefault();
      handleSend();
    }
  };
  useEffect(() => {
    const savedMessages = sessionStorage.getItem("chat-messages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);
  

  useEffect(() => {
    chatBoxRef.current?.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: "smooth",
    });
    console.log("Messages updated:", messages);
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="chat-container">
       {/* Brand Header */}
    <div className="chat-brand">
      Nomos 1.0
    </div>

      <div className="chat-box" ref={chatBoxRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
{loading && (
  <div className="message bot typing-indicator">
    Bot is typing<span className="dots"><span>.</span><span>.</span><span>.</span></span>
  </div>
)}


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
<button onClick={handleSend} disabled={loading}>
  {loading ? (
    <div className="spinner"></div>
  ) : (
    "➤"
  )}
</button>
      </div>
    </div>
  );
};

export default Chatbot;
