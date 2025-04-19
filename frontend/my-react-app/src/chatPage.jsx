import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from 'react-markdown';
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
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import "./chatPage.css";

const ChatPage = ({ user }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingConvId, setLoadingConvId] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [menuOpenForChat, setMenuOpenForChat] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    chatId: null,
    chatTitle: "",
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpenForChat(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120); // Set maximum height to 80px (reduced)
      textarea.style.height = `${newHeight}px`;
    }
  }, [input]);

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
          createdAt: doc.data().createdAt
            ? doc.data().createdAt.toDate()
            : new Date(),
        }));
        setConversations(chats);
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

  useEffect(() => {
    if (!user || !currentConvId) return;
    const loadMessages = async () => {
      try {
        const docRef = doc(
          db,
          "chats",
          user.uid,
          "conversations",
          currentConvId
        );
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setMessages(snap.data().messages || []);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
        setMessages([]);
      }
    };
    loadMessages();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [currentConvId, user]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const startNewConversation = async () => {
    if (!user) return;
    try {
      const newConvRef = doc(
        collection(db, "chats", user.uid, "conversations")
      );
      const newChat = {
        title: "New Conversation",
        createdAt: serverTimestamp(),
        messages: [],
        lastUpdated: serverTimestamp(),
        conversationId: newConvRef.id,
      };
      await setDoc(newConvRef, newChat);
      const newChatWithId = {
        id: newConvRef.id,
        ...newChat,
        createdAt: new Date(),
      };
      setConversations((prev) => [newChatWithId, ...prev]);
      setCurrentConvId(newConvRef.id);
      setMessages([]);
      setInput("");
      // If sidebar is collapsed, expand it for better visibility of the new chat
      if (sidebarCollapsed) {
        setSidebarCollapsed(false);
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error("Error creating new conversation:", err);
    }
  };

  const switchConversation = (convId) => {
    if (convId === currentConvId) return;
    setCurrentConvId(convId);
    setInput("");
    // Optionally collapse the sidebar after selecting a chat on mobile
    if (window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
  };

  const handleChatOptionsClick = (e, chatId) => {
    e.stopPropagation(); // Prevent triggering chat selection
    setMenuOpenForChat(menuOpenForChat === chatId ? null : chatId);
  };

  const openDeleteConfirmation = (e, chatId, chatTitle) => {
    e.stopPropagation();
    setDeleteConfirmation({
      isOpen: true,
      chatId,
      chatTitle,
    });
    setMenuOpenForChat(null);
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      chatId: null,
      chatTitle: "",
    });
  };

  const deleteChat = async () => {
    if (!user || !deleteConfirmation.chatId) return;

    try {
      const chatToDeleteId = deleteConfirmation.chatId;
      const chatDocRef = doc(
        db,
        "chats",
        user.uid,
        "conversations",
        chatToDeleteId
      );

      await deleteDoc(chatDocRef);

      // Update local state
      const updatedConversations = conversations.filter(
        (conv) => conv.id !== chatToDeleteId
      );
      setConversations(updatedConversations);

      // If the deleted chat was the current one, switch to another chat or clear view
      if (currentConvId === chatToDeleteId) {
        if (updatedConversations.length > 0) {
          setCurrentConvId(updatedConversations[0].id);
        } else {
          setCurrentConvId(null);
          setMessages([]);
        }
      }

      closeDeleteConfirmation();
    } catch (err) {
      console.error("Error deleting chat:", err);
      // You might want to show an error message to the user here
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loadingConvId || !user || !currentConvId) return;
    setLoadingConvId(currentConvId);
    
    // Keep input as is without trimming to preserve line breaks
    const userInputWithLineBreaks = input;
    
    const userMsg = {
      sender: "user",
      text: userInputWithLineBreaks, // Use the non-trimmed input to preserve line breaks
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");

    try {
      const convRef = doc(
        db,
        "chats",
        user.uid,
        "conversations",
        currentConvId
      );
      await updateDoc(convRef, {
        messages: updatedMessages,
        lastUpdated: serverTimestamp(),
      });

      const response = await fetch("http://127.0.0.1:5000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userInputWithLineBreaks.trim(), // Still trim for the API request
          conversationId: currentConvId,
          isNewConversation: messages.length === 0,
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      const botMsg = {
        sender: "bot",
        text: data.response,
        timestamp: new Date().toISOString(),
      };
      const finalMessages = [...updatedMessages, botMsg];
      setMessages(finalMessages);
      await updateDoc(convRef, {
        messages: finalMessages,
        lastUpdated: serverTimestamp(),
      });

      if (messages.length === 0) {
        // Create title from first line of input
        const firstLine = userInputWithLineBreaks.split('\n')[0];
        const newTitle =
          firstLine.length > 30
            ? firstLine.substring(0, 30) + "..."
            : firstLine;
        await updateDoc(convRef, { title: newTitle });
        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentConvId ? { ...c, title: newTitle } : c
          )
        );
      }
    } catch (err) {
      console.error("Send error:", err);
      const errorMsg = {
        sender: "bot",
        text: "Sorry, I couldn't process your request. Please try again.",
        error: true,
        timestamp: new Date().toISOString(),
      };
      const messagesWithError = [...updatedMessages, errorMsg];
      setMessages(messagesWithError);
      try {
        const convRef = doc(
          db,
          "chats",
          user.uid,
          "conversations",
          currentConvId
        );
        await updateDoc(convRef, {
          messages: messagesWithError,
          lastUpdated: serverTimestamp(),
        });
      } catch (firestoreErr) {
        console.error("Firestore update error:", firestoreErr);
      }
    } finally {
      setLoadingConvId(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // Allow new line when Shift+Enter is pressed
        return; // This lets the default behavior happen (adding a new line)
      } else {
        // Send message when only Enter is pressed
        e.preventDefault();
        sendMessage();
      }
    }
  };

  useEffect(() => {
    chatBoxRef.current?.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);
  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="chat-layout">
      <div className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <button
            className="toggle-sidebar"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <img
              src="../src/assets/sidemenu.png"
              alt="Toggle sidebar"
              className="sidebar-icon"
            />
          </button>
          <div className="brand-text">Nomos</div>
        </div>
        <button className="new-chat" onClick={startNewConversation}>
          <span className="new-chat-text">➕ New Chat</span>
          {sidebarCollapsed && <span>➕</span>}
        </button>
        <div className="chat-history">
          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`chat-item ${
                  conv.id === currentConvId ? "active" : ""
                }`}
                onClick={() => switchConversation(conv.id)}
              >
                <div className="chat-item-title">{conv.title}</div>
                <div className="chat-options-container">
                  <button
                    className="chat-options-btn"
                    onClick={(e) => handleChatOptionsClick(e, conv.id)}
                  >
                    ⋮
                  </button>
                  {menuOpenForChat === conv.id && (
                    <div className="chat-options-menu" ref={menuRef}>
                      <div
                        className="chat-options-menu-item delete"
                        onClick={(e) =>
                          openDeleteConfirmation(e, conv.id, conv.title)
                        }
                      >
                        Delete Chat
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-history">No conversations yet</div>
          )}
        </div>
      </div>

      {/* New container for centering the chat view */}
      <div className="chat-container" ref={chatContainerRef}>
        <div className="chat-view">
          <div className="chat-box" ref={chatBoxRef}>
            {currentConvId ? (
              <>
                {messages.length > 0 ? (
  messages.map((msg, idx) => (
    <div
      key={idx}
      className={`message-container ${msg.sender}`}
    >
      {msg.sender === 'user' ? (
        // User message in bubble format
        <div className={`message ${msg.sender}`}>
          {msg.text}
        </div>
      ) : (
        // Bot message in full-width format
        <div className="bot-response">
          {msg.error ? (
            <div className="error-text">{msg.text}</div>
          ) : (
            <ReactMarkdown>{msg.text}</ReactMarkdown>
          )}
        </div>
      )}
    </div>
  ))
) : (
  <div className="welcome-message">
    <p>Start a new conversation by typing a message below.</p>
  </div>
)}

                {loadingConvId === currentConvId && (
                  <div className="message-container bot">
                    <div className="message bot typing-indicator">
                      Bot is typing
                      <span className="dots">
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                      </span>
                    </div>
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
            <div className="chat-input-container">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  !currentConvId
                    ? "Select or create a conversation first"
                    : loadingConvId === currentConvId
                    ? "Waiting for response..."
                    : "Ask anything"
                }
                disabled={loadingConvId === currentConvId || !currentConvId}
              />
              <button
                className="send-button"
                onClick={sendMessage}
                disabled={
                  !input.trim() ||
                  loadingConvId === currentConvId ||
                  !currentConvId
                }
              >
                {loadingConvId === currentConvId ? (
                  <div className="spinner"></div>
                ) : (
                  "➤"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <div className="delete-confirm-title">
              Delete chat "{deleteConfirmation.chatTitle}"?
            </div>
            <p>This action cannot be undone.</p>
            <div className="delete-confirm-buttons">
              <button
                className="delete-confirm-cancel"
                onClick={closeDeleteConfirmation}
              >
                Cancel
              </button>
              <button className="delete-confirm-delete" onClick={deleteChat}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;