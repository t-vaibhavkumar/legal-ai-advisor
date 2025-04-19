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
  const [renameState, setRenameState] = useState({
    isRenaming: false,
    chatId: null,
    newTitle: "",
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [guestConversations, setGuestConversations] = useState([]); // Local state for guest conversations
  const [guestIdCounter, setGuestIdCounter] = useState(1); // Counter for generating guest conversation IDs
  
  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const chatContainerRef = useRef(null);
  const renameInputRef = useRef(null);

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

  // Focus on rename input when it appears
  useEffect(() => {
    if (renameState.isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renameState.isRenaming]);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120); // Set maximum height
      textarea.style.height = `${newHeight}px`;
    }
  }, [input]);

  // Fetch conversations when user is authenticated (for registered users only)
  // Modified useEffect that fetches conversations
  useEffect(() => {
    if (!user || isGuest) return;
    
    const fetchConversations = async () => {
      try {
        const convRef = collection(db, "chats", user.uid, "conversations");
        const q = query(convRef, orderBy("lastUpdated", "desc"));
        const snapshot = await getDocs(q);
        const chats = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt
            ? doc.data().createdAt.toDate()
            : new Date(),
        }));
        setConversations(chats);
        
        // Only set currentConvId if there are chats, but DON'T load messages yet
        if (chats.length > 0 && isFirstLoad) {
          setCurrentConvId(chats[0].id);
          // Don't set loadingConvId here
        }
        setInitialLoad(false);
      } catch (err) {
        console.error("Error fetching conversations:", err);
      }
    };
    
    fetchConversations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isGuest]); // Deliberately omitting isFirstLoad

  // For guest mode: Initialize with one conversation on first load
  useEffect(() => {
    if (isGuest && initialLoad) {
      // Create a new conversation for guests on first load
      const newId = `guest-conv-${guestIdCounter}`;
      const updatedCounter = guestIdCounter + 1;
      setGuestIdCounter(updatedCounter);
      
      const newChat = {
        id: newId,
        title: "New Conversation",
        createdAt: new Date(),
        messages: [],
        lastUpdated: new Date(),
      };
      
      setGuestConversations([newChat]);
      setConversations([newChat]);
      setCurrentConvId(newId);
      setInitialLoad(false);
    }
  }, [isGuest, initialLoad, guestIdCounter]); // Add guestIdCounter to the dependency array
  
  useEffect(() => {
    // Update isGuest status whenever user changes
    setIsGuest(!user);
    
    // Reset initial load state when user status changes
    if (!user) {
      setInitialLoad(true);
    }
  }, [user]);

  // Load messages for the current conversation
  // Modified useEffect that handles loading messages for current conversation
  useEffect(() => {
    if (!currentConvId) return;
    
    if (isGuest) {
      // For guest mode: find messages in local state
      const currentConv = guestConversations.find(conv => conv.id === currentConvId);
      if (currentConv) {
        setMessages(currentConv.messages || []);
      } else {
        setMessages([]);
      }
    } else if (user) {
      // For registered users: load from Firestore
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
            // Important: Don't set loadingConvId here during initial load
            setLoadingConvId(null); // Explicitly reset loading state
          } else {
            setMessages([]);
          }
        } catch (err) {
          console.error("Failed to load messages:", err);
          setMessages([]);
        }
      };
      loadMessages();
    }
    
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [currentConvId, user, isGuest, guestConversations]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const startNewConversation = async () => {
    if (isGuest) {
      // For guest mode: create a new conversation in memory
      const newId = `guest-conv-${guestIdCounter}`;
      const updatedCounter = guestIdCounter + 1;
      setGuestIdCounter(updatedCounter);
      
      const newChat = {
        id: newId,
        title: "New Conversation",
        createdAt: new Date(),
        messages: [],
        lastUpdated: new Date(),
      };
      
      setGuestConversations(prev => [newChat, ...prev]);
      setConversations(prev => [newChat, ...prev]);
      setCurrentConvId(newId);
      setMessages([]);
      setInput("");
      setSidebarCollapsed(false);
      setInitialLoad(false);
      setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }
    
    // For registered users: create in Firestore
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
      setSidebarCollapsed(false);
      setInitialLoad(false);
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

  // Start renaming a chat
  const startRenaming = (e, chatId, currentTitle) => {
    e.stopPropagation();
    setRenameState({
      isRenaming: true,
      chatId,
      newTitle: currentTitle,
    });
    setMenuOpenForChat(null);
  };

  // Cancel renaming
  const cancelRenaming = () => {
    setRenameState({
      isRenaming: false,
      chatId: null,
      newTitle: "",
    });
  };

  // Save the new chat name
  const saveNewChatName = async () => {
    if (!renameState.chatId || !renameState.newTitle.trim()) {
      cancelRenaming();
      return;
    }

    if (isGuest) {
      // For guest mode: update in local state
      setGuestConversations(prev => 
        prev.map(conv => 
          conv.id === renameState.chatId 
            ? { ...conv, title: renameState.newTitle.trim() } 
            : conv
        )
      );
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === renameState.chatId 
            ? { ...conv, title: renameState.newTitle.trim() } 
            : conv
        )
      );
      
      cancelRenaming();
      return;
    }

    if (!user) {
      cancelRenaming();
      return;
    }

    try {
      const chatDocRef = doc(
        db,
        "chats",
        user.uid,
        "conversations",
        renameState.chatId
      );

      await updateDoc(chatDocRef, {
        title: renameState.newTitle.trim(),
      });

      // Update local state
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === renameState.chatId
            ? { ...conv, title: renameState.newTitle.trim() }
            : conv
        )
      );

      cancelRenaming();
    } catch (err) {
      console.error("Error renaming chat:", err);
    }
  };

  // Handle key press in rename input
  const handleRenameKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveNewChatName();
    } else if (e.key === "Escape") {
      cancelRenaming();
    }
  };

  const deleteChat = async () => {
    if (!deleteConfirmation.chatId) return;

    if (isGuest) {
      // For guest mode: delete from local state
      const chatToDeleteId = deleteConfirmation.chatId;
      const updatedConversations = conversations.filter(conv => conv.id !== chatToDeleteId);
      setGuestConversations(updatedConversations);
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
      return;
    }

    if (!user) return;

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
    }
  };

  // Generate a dynamic title based on the conversation content
  const generateDynamicTitle = (userInput, botResponse) => {
    // First try to extract a meaningful title from the bot's response
    const botFirstSentence = botResponse?.split(/[.!?]\s+/)[0];
    
    // If bot response has a reasonable first sentence (between 3-50 chars), use it
    if (botFirstSentence && botFirstSentence.length >= 3 && botFirstSentence.length <= 50) {
      return botFirstSentence;
    }
    
    // Otherwise use the first line of user input
    const userFirstLine = userInput.split('\n')[0].trim();
    
    // If the first line is too long, truncate it
    if (userFirstLine.length > 40) {
      return userFirstLine.substring(0, 40) + "...";
    }
    
    return userFirstLine || "New Conversation";
  };

  const sendMessage = async () => {
    if (!input.trim() || loadingConvId || !currentConvId) return;
    setLoadingConvId(currentConvId);
    
    // Trim leading and trailing empty lines before sending
    const userInputWithLineBreaks = input.replace(/^\s*\n+|\n+\s*$/g, '');
    
    // Skip if there's nothing left after trimming
    if (!userInputWithLineBreaks.trim()) {
      setLoadingConvId(null);
      setInput("");
      return;
    }
    
    const userMsg = {
      sender: "user",
      text: userInputWithLineBreaks,
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    
    // After first message, this is no longer a first-load state
    setIsFirstLoad(false);
  
    try {
      // For guest mode: update local state only
      if (isGuest) {
        // Update local guest conversations
        setGuestConversations(prev => 
          prev.map(conv => 
            conv.id === currentConvId 
              ? { 
                  ...conv, 
                  messages: updatedMessages,
                  lastUpdated: new Date() 
                } 
              : conv
          )
        );
      } else if (user) {
        // For registered users: update Firestore
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
      }
  
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
      
      if (isGuest) {
        // Update local state for guests
        const newTitle = messages.length === 0 
          ? generateDynamicTitle(userInputWithLineBreaks, data.response)
          : null;
        
        setGuestConversations(prev => 
          prev.map(conv => 
            conv.id === currentConvId 
              ? { 
                  ...conv, 
                  messages: finalMessages,
                  lastUpdated: new Date(),
                  ...(newTitle ? { title: newTitle } : {}) 
                } 
              : conv
          )
        );
        
        // Update the main conversations list for UI consistency
        if (newTitle) {
          setConversations(prev =>
            prev.map(c =>
              c.id === currentConvId ? { ...c, title: newTitle } : c
            )
          );
        }
      } else if (user) {
        // Update Firestore for registered users
        const convRef = doc(
          db,
          "chats",
          user.uid,
          "conversations",
          currentConvId
        );
        await updateDoc(convRef, {
          messages: finalMessages,
          lastUpdated: serverTimestamp(),
        });
  
        if (messages.length === 0) {
          // Create a dynamic title from the first message exchange
          const newTitle = generateDynamicTitle(userInputWithLineBreaks, data.response);
          
          await updateDoc(convRef, { title: newTitle });
          setConversations((prev) =>
            prev.map((c) =>
              c.id === currentConvId ? { ...c, title: newTitle } : c
            )
          );
        }
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
      
      // Update state based on user type
      if (isGuest) {
        setGuestConversations(prev => 
          prev.map(conv => 
            conv.id === currentConvId 
              ? { ...conv, messages: messagesWithError, lastUpdated: new Date() } 
              : conv
          )
        );
      } else if (user) {
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
        
        // Don't perform the trimming here, just send the message
        // The sendMessage function will handle the trimming
        if (input.trim()) {
          sendMessage();
        }
      }
    }
  };

  // Sync guest conversations to main conversations list for UI consistency
  useEffect(() => {
    if (isGuest) {
      setConversations(guestConversations);
    }
  }, [isGuest, guestConversations]);
  
  // Scroll to bottom when messages change
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

  // Custom welcome message when we have a new chat on first load
  const renderWelcomeContent = () => {
    // For first-time users (both logged-in and guest), show the welcome screen
    if ((isFirstLoad || !currentConvId || (currentConvId && messages.length === 0)) && 
        !conversations.some(conv => conv.messages && conv.messages.length > 0)) {
      return (
        <div className="welcome-message-container">
          <div className="welcome-logo">⚖️</div>
          <h1 className="welcome-title">Nomos Legal Assistant</h1>
          <p className="welcome-tagline">Where legal jargon meets plain English - no objections!</p>
          <p className="welcome-instruction">Ask me about any legal issue, and I'll help make sense of it.</p>
          {isGuest && (
            <p className="welcome-guest-notice">You're in guest mode. Your conversations won't be saved when you leave.</p>
          )}
        </div>
      );
    } else if (!currentConvId) {
      return (
        <div className="select-conversation-prompt">
          <p>Select a conversation or start a new one</p>
        </div>
      );
    } else if (messages.length === 0) {
      return (
        <div className="welcome-message">
          <p>Start a new conversation by typing a message below.</p>
          {isGuest && (
            <p className="welcome-guest-notice">You're in guest mode. Your conversations won't be saved when you leave.</p>
          )}
        </div>
      );
    }
    
    return null;
  };

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
                } ${renameState.isRenaming && renameState.chatId === conv.id ? "renaming" : ""}`}
                onClick={() => switchConversation(conv.id)}
              >
                {renameState.isRenaming && renameState.chatId === conv.id ? (
                  <div className="chat-rename-container" onClick={(e) => e.stopPropagation()}>
                    <input
                      ref={renameInputRef}
                      className="chat-rename-input"
                      value={renameState.newTitle}
                      onChange={(e) => setRenameState({ ...renameState, newTitle: e.target.value })}
                      onKeyDown={handleRenameKeyDown}
                      onBlur={saveNewChatName}
                    />
                  </div>
                ) : (
                  <>
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
                            className="chat-options-menu-item rename"
                            onClick={(e) => startRenaming(e, conv.id, conv.title)}
                          >
                            Rename Chat
                          </div>
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
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="empty-history">No conversations yet</div>
          )}
        </div>
      </div>

      {/* Chat container */}
      <div className="chat-container" ref={chatContainerRef}>
        <div className="chat-view">
          <div className="chat-box" ref={chatBoxRef}>
            {/* Welcome message or conversation messages */}
            {renderWelcomeContent()}
            
            {currentConvId && messages.length > 0 && (
              <>
                {messages.map((msg, idx) => (
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
                ))}
              </>
            )}

            {loadingConvId === currentConvId && messages.length > 0 && (
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