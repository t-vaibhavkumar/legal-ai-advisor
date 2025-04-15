// chatbot.jsx
import React, { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import "./chatbot.css";

const Chatbot = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);

  const saveMessages = async (updatedMessages) => {
    if (!user || !user.uid) return;
  
    const userDocRef = doc(db, "chats", user.uid);
    await setDoc(userDocRef, { messages: updatedMessages });
  };
  

  const loadMessages = async () => {
    if (!user || !user.uid) return;
  
    const userDocRef = doc(db, "chats", user.uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      setMessages(docSnap.data().messages || []);
    }
  };
  

  useEffect(() => {
    if (user) loadMessages();
  }, [user]);

  const askQuestion = async (query) => {
    const response = await fetch("http://172.16.239.65:5000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await response.json();
    return data.response;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    setLoading(true);
    const userMessage = { text: input, sender: "user" };
    const updatedUserMessages = [...messages, userMessage];

    setMessages(updatedUserMessages);
    setInput("");

    const botReplyText = await askQuestion(input);
    const botReply = { text: botReplyText, sender: "bot" };

    const updatedAllMessages = [...updatedUserMessages, botReply];
    setMessages(updatedAllMessages);
    saveMessages(updatedAllMessages); // 🔥 Save to Firestore
    setLoading(false);
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
      <div className="chat-brand">Nomos 1.0</div>

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
          {loading ? <div className="spinner"></div> : "➤"}
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
