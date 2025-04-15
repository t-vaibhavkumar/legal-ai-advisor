import React, { useEffect, useState, useRef } from "react";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import "./ChatPage.css";
import "./chatbot.css"; // For spinner and typing-indicator

const ChatPage = ({ user }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingConvId, setLoadingConvId] = useState(null); // Track which conversation is loading
  const [initialLoad, setInitialLoad] = useState(true);
  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);

  // Load all conversations for the user
  useEffect(() => {
    if (!user) return;
    
    const fetchConversations = async () => {
      try {
        const convRef = collection(db, "chats", user.uid, "conversations");
        const q = query(convRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        const chats = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firebase timestamp to JS Date if needed
          createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date(),
        }));
        
        setConversations(chats);
        
        // If there are conversations and no current one is selected, select the most recent
        if (chats.length > 0 && initialLoad) {
          setCurrentConvId(chats[0].id);
          setInitialLoad(false);
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
      }
    };
    
    fetchConversations();
  }, [user, initialLoad]);

  // Load messages for the currently selected conversation
  useEffect(() => {
    if (!user || !currentConvId) return;

    const loadMessages = async () => {
      try {
        const docRef = doc(db, "chats", user.uid, "conversations", currentConvId);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          const data = snap.data();
          setMessages(data.messages || []);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
        setMessages([]);
      }
    };

    loadMessages();
    // Focus on the input field when switching chats
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [currentConvId, user]);

  // Create a new conversation
  const startNewConversation = async () => {
    if (!user) return;
    
    try {
      // Create a reference to a new document with auto-generated ID
      const newConvRef = doc(collection(db, "chats", user.uid, "conversations"));
      
      // New conversation object
      const newChat = {
        title: "New Conversation",
        createdAt: serverTimestamp(),
        messages: [], // Start with empty messages
        lastUpdated: serverTimestamp(),
        conversationId: newConvRef.id // Store the conversation ID for API requests
      };
      
      // Write to Firestore
      await setDoc(newConvRef, newChat);
      
      // Update local state to add the new conversation
      const newChatWithId = { 
        id: newConvRef.id, 
        ...newChat,
        createdAt: new Date() // Local timestamp for immediate display
      };
      
      setConversations(prevConvs => [newChatWithId, ...prevConvs]);
      
      // Switch to the new conversation
      setCurrentConvId(newConvRef.id);
      setMessages([]); // Clear messages for the new conversation
      setInput("");
      
      // Focus on input field
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error("Error creating new conversation:", err);
    }
  };

  // Handle conversation switching
  const switchConversation = (convId) => {
    if (convId === currentConvId) return;
    
    setCurrentConvId(convId);
    setInput(""); // Clear input when switching
  };

  // Send a message in the current conversation
  const sendMessage = async () => {
    if (!input.trim() || loadingConvId || !user || !currentConvId) return;

    setLoadingConvId(currentConvId); // Track which conversation is loading
    const trimmedInput = input.trim();
    
    // Create user message object
    const userMsg = { 
      sender: "user", 
      text: trimmedInput,
      timestamp: new Date().toISOString()
    };
    
    // Update local state immediately with user message
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");

    try {
      // IMPORTANT: Update Firestore immediately with user message
      // This ensures the message persists even if user switches conversations
      const convRef = doc(db, "chats", user.uid, "conversations", currentConvId);
      await updateDoc(convRef, {
        messages: updatedMessages,
        lastUpdated: serverTimestamp()
      });

      // Get response from the API - IMPORTANT: Send the conversation ID to maintain context separation
      const response = await fetch("http://127.0.0.1:5000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: trimmedInput,
          conversationId: currentConvId, // Send conversation ID to ensure context isolation
          isNewConversation: messages.length === 0 // Let API know if this is first message
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Create bot response object
      const botMsg = { 
        sender: "bot", 
        text: data.response,
        timestamp: new Date().toISOString()
      };
      
      // Update messages with bot response
      const finalMessages = [...updatedMessages, botMsg];
      setMessages(finalMessages);
      
      // Reference to the conversation document
      // Update the conversation in Firestore
      await updateDoc(convRef, {
        messages: finalMessages,
        lastUpdated: serverTimestamp()
      });
      
      // Update the title if this is the first message
      if (messages.length === 0) {
        // Create a title from the first user message
        const newTitle = trimmedInput.length > 30 
          ? trimmedInput.substring(0, 30) + "..." 
          : trimmedInput;
        
        await updateDoc(convRef, { title: newTitle });
        
        // Update local conversations state
        setConversations(prevConvs => 
          prevConvs.map(conv => 
            conv.id === currentConvId ? {...conv, title: newTitle} : conv
          )
        );
      }
    } catch (err) {
      console.error("Error sending message:", err);
      
      // Add error message
      const errorMsg = { 
        sender: "bot", 
        text: "Sorry, I couldn't process your request. Please try again.",
        error: true,
        timestamp: new Date().toISOString()
      };
      
      const messagesWithError = [...updatedMessages, errorMsg];
      setMessages(messagesWithError);
      
      // Update Firestore with error message
      try {
        const convRef = doc(db, "chats", user.uid, "conversations", currentConvId);
        await updateDoc(convRef, {
          messages: messagesWithError,
          lastUpdated: serverTimestamp()
        });
      } catch (firestoreErr) {
        console.error("Error updating Firestore with error message:", firestoreErr);
      }
    } finally {
      setLoadingConvId(null);
    }
  };

  // Handle keyboard events
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-scroll to the latest message
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="chat-layout">
      <div className="sidebar">
        <button className="new-chat" onClick={startNewConversation}>
          ➕ New Chat
        </button>
        <div className="chat-history">
          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`chat-item ${conv.id === currentConvId ? "active" : ""}`}
                onClick={() => switchConversation(conv.id)}
              >
                {conv.title}
              </div>
            ))
          ) : (
            <div className="empty-history">No conversations yet</div>
          )}
        </div>
      </div>

      <div className="chat-view">
        <div className="chat-brand">Nomos 1.0</div>

        <div className="chat-box" ref={chatBoxRef}>
          {currentConvId ? (
            <>
              {messages.length > 0 ? (
                messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`message ${msg.sender} ${msg.error ? 'error-text' : ''}`}
                  >
                    {msg.text}
                  </div>
                ))
              ) : (
                <div className="welcome-message">
                  <p>Start a new conversation by typing a message below.</p>
                </div>
              )}

              {/* Bot typing animation - only show for current conversation */}
              {loadingConvId === currentConvId && (
                <div className="message bot typing-indicator">
                  Bot is typing<span className="dots"><span>.</span><span>.</span><span>.</span></span>
                </div>
              )}
            </>
          ) : (
            <div className="select-conversation-prompt">
              <p>Select a conversation or start a new one</p>
            </div>
          )}
        </div>

        <div className="chat-input">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !currentConvId ? "Select or create a conversation first" :
              loadingConvId === currentConvId ? "Waiting for response..." : 
              "Type your message here..."
            }
            disabled={loadingConvId === currentConvId || !currentConvId}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loadingConvId === currentConvId || !currentConvId}
          >
            {loadingConvId === currentConvId ? <div className="spinner"></div> : "➤"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;