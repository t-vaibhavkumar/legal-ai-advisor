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
  const [isTempChat, setIsTempChat] = useState(false);
  const [tempChatMessages, setTempChatMessages] = useState([]);
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
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true); 
  const [isGuest, setIsGuest] = useState(false);
  const [guestConversations, setGuestConversations] = useState([]);
  const [guestIdCounter, setGuestIdCounter] = useState(1); 
  
  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const chatContainerRef = useRef(null);
  const renameInputRef = useRef(null);

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

  useEffect(() => {
    if (renameState.isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renameState.isRenaming]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
    }
  }, [input]);

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
      
      const hasMessagesInConversations = chats.some(chat => 
        chat.messages && chat.messages.length > 0
      );
      
      if (chats.length > 0 && isFirstLoad) {
        if (hasMessagesInConversations) {
          const firstConvWithMessages = chats.find(chat => 
            chat.messages && chat.messages.length > 0
          );
          setCurrentConvId(firstConvWithMessages ? firstConvWithMessages.id : null);
        } else {
          setCurrentConvId(null);
        }
      }
      
      setShowWelcomeScreen(!hasMessagesInConversations);
      
      setInitialLoad(false);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };
  
  fetchConversations();
}, [user, isGuest, isFirstLoad]);

  useEffect(() => {
    if (isGuest && initialLoad) {
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
      setShowWelcomeScreen(true);
    }
  }, [isGuest, initialLoad, guestIdCounter]);
  
  useEffect(() => {
    setIsGuest(!user);
    
    if (!user) {
      setInitialLoad(true);
      setShowWelcomeScreen(true);
      setIsFirstLoad(true);
    }
  }, [user]);

  useEffect(() => {
    if (!currentConvId) return;
    
    if (isGuest) {
      const currentConv = guestConversations.find(conv => conv.id === currentConvId);
      if (currentConv) {
        setMessages(currentConv.messages || []);
      } else {
        setMessages([]);
      }
    } else if (user) {
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
            setLoadingConvId(null);
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
  const startTemporaryChat = () => {
    setShowWelcomeScreen(false);
    
    setIsTempChat(true);
    
    const tempChatId = `temp-${Date.now()}`;
    setCurrentConvId(tempChatId);
    
    setTempChatMessages([]);
    setMessages([]);
    
    setSidebarCollapsed(false);
    
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const startNewConversation = async () => {
    setShowWelcomeScreen(false);
    
    if (isGuest) {
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
    
    setShowWelcomeScreen(false);
    
    if (isTempChat) {
      setIsTempChat(false);
      setTempChatMessages([]); 
    }
    
    setCurrentConvId(convId);
    setInput("");
    if (window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
  };

  const handleChatOptionsClick = (e, chatId) => {
    e.stopPropagation(); 
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

  const startRenaming = (e, chatId, currentTitle) => {
    e.stopPropagation();
    setRenameState({
      isRenaming: true,
      chatId,
      newTitle: currentTitle,
    });
    setMenuOpenForChat(null);
  };

  const cancelRenaming = () => {
    setRenameState({
      isRenaming: false,
      chatId: null,
      newTitle: "",
    });
  };

  const saveNewChatName = async () => {
    if (!renameState.chatId || !renameState.newTitle.trim()) {
      cancelRenaming();
      return;
    }

    if (isGuest) {
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
      const chatToDeleteId = deleteConfirmation.chatId;
      const updatedConversations = conversations.filter(conv => conv.id !== chatToDeleteId);
      setGuestConversations(updatedConversations);
      setConversations(updatedConversations);
      
      if (currentConvId === chatToDeleteId) {
        if (updatedConversations.length > 0) {
          setCurrentConvId(updatedConversations[0].id);
        } else {
          setCurrentConvId(null);
          setMessages([]);
          setShowWelcomeScreen(true); 
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

      const updatedConversations = conversations.filter(
        (conv) => conv.id !== chatToDeleteId
      );
      setConversations(updatedConversations);

      if (currentConvId === chatToDeleteId) {
        if (updatedConversations.length > 0) {
          setCurrentConvId(updatedConversations[0].id);
        } else {
          setCurrentConvId(null);
          setMessages([]);
          setShowWelcomeScreen(true);
        }
      }

      closeDeleteConfirmation();
    } catch (err) {
      console.error("Error deleting chat:", err);
    }
  };

  const generateDynamicTitle = (userInput, botResponse) => {
    const botFirstSentence = botResponse?.split(/[.!?]\s+/)[0];
    
    if (botFirstSentence && botFirstSentence.length >= 3 && botFirstSentence.length <= 50) {
      return botFirstSentence;
    }
    
    const userFirstLine = userInput.split('\n')[0].trim();
    
    if (userFirstLine.length > 40) {
      return userFirstLine.substring(0, 40) + "...";
    }
    
    return userFirstLine || "New Conversation";
  };

  const sendMessage = async () => {
    if (!input.trim() || loadingConvId) return;
    
    if (currentConvId) {
      setLoadingConvId(currentConvId);
    }
    
    setShowWelcomeScreen(false);
    
    const userInputWithLineBreaks = input.replace(/^\s*\n+|\n+\s*$/g, '');
    
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
    
setIsFirstLoad(false);
  
try {
  if (isTempChat) {
    setTempChatMessages(updatedMessages);
  }
  else if (isGuest) {
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

  // const response = await fetch("http://127.0.0.1:5000/ask", {
  const response = await fetch("https://9237-203-192-244-112.ngrok-free.app/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: userInputWithLineBreaks.trim(), 
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
  
  if (isTempChat) {
    setTempChatMessages(finalMessages);
  } else if (isGuest) {
    setGuestConversations(prev => 
      prev.map(conv => 
        conv.id === currentConvId 
          ? { ...conv, messages: finalMessages, lastUpdated: new Date() } 
          : conv
      )
    );
    
    if (messages.length === 0) {
      const newTitle = generateDynamicTitle(userInputWithLineBreaks, data.response);
      
      setGuestConversations(prev => 
        prev.map(conv => 
          conv.id === currentConvId 
            ? { ...conv, title: newTitle } 
            : conv
        )
      );
      
      setConversations(prev =>
        prev.map(c =>
          c.id === currentConvId ? { ...c, title: newTitle } : c
        )
      );
    }
  } else if (user) {
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
  
  if (isTempChat) {
    setTempChatMessages(messagesWithError);
  } else if (isGuest) {
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
        return; 
      } else {
        e.preventDefault();
        
        if (input.trim()) {
          sendMessage();
        }
      }
    }
  };

  useEffect(() => {
    if (isGuest) {
      setConversations(guestConversations);
    }
  }, [isGuest, guestConversations]);
  
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

const renderWelcomeContent = () => {
  if (showWelcomeScreen && !isTempChat) {
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
  } else if (isTempChat && tempChatMessages.length === 0) {
    return (
      <div className="welcome-message-container">
<div className="welcome-logo">
  <img src="../src/assets/Temp.png" alt="Temporary Chat" className="temp-chat-logo" />
</div>
        <h1 className="welcome-title">Temporary Chat</h1>
        <p className="welcome-tagline">Quick conversations without the commitment</p>
        <p className="welcome-instruction">This is a temporary chat session. Your messages won't be saved and will be lost when you reload the page.</p>
        <div className="welcome-guest-notice">
          For persistent conversations, use your regular chats from the sidebar.
        </div>
      </div>
    );
  } else if (!currentConvId && !isTempChat) {
    return (
      <div className="welcome-message-container">
        <p className="welcome-instruction">Select a conversation or start a new one</p>
      </div>
    );
  } else if (messages.length === 0 && !isTempChat) {
    return (
      <div className="welcome-message-container">
        <p className="welcome-instruction">Start a new conversation by typing a message below.</p>
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
        {user && !isGuest && (
          <button className="temp-chat" onClick={startTemporaryChat}>
  <img src="../src/assets/Temporary.png" alt="Temporary Chat" className={sidebarCollapsed ? "temp-chat-icon-collapsed" : "temp-chat-icon"} />
  <span className="temp-chat-text">Temporary Chat</span>
</button>
)}
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

      <div className="chat-container" ref={chatContainerRef}>
        <div className="chat-view">
        <div className="chat-box" ref={chatBoxRef}>
  {renderWelcomeContent()}
  
  {isTempChat ? (
    tempChatMessages.length > 0 && (
      <>
        {tempChatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`message-container ${msg.sender}`}
          >
            {msg.sender === 'user' ? (
              <div className={`message ${msg.sender}`}>
                {msg.text}
              </div>
            ) : (
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
    )
  ) : (
    currentConvId && messages.length > 0 && (
      <>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message-container ${msg.sender}`}
          >
            {msg.sender === 'user' ? (
              <div className={`message ${msg.sender}`}>
                {msg.text}
              </div>
            ) : (
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
    )
  )}
</div>
</div>
</div>

<div className="chat-input">
  <div className="chat-input-container">
    <textarea
      ref={inputRef}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={
        !currentConvId && !isTempChat
          ? "Select or create a conversation first"
          : loadingConvId === currentConvId
          ? "Waiting for response..."
          : "Ask anything"
      }
      disabled={loadingConvId === currentConvId || (!currentConvId && !isTempChat)}
    />
    <button
  className="send-button"
  onClick={sendMessage}
  disabled={
    !input.trim() ||
    loadingConvId !== null ||
    (!currentConvId && !isTempChat)
  }
>
  {loadingConvId ? (
    <div className="spinner"></div>
  ) : (
    "➤"
  )}
</button>

  </div>
</div>

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