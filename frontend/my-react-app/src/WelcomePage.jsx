import React, { useState, useEffect } from "react";
import ChatPage from "./chatPage";
import Orb from "./orb";
import { auth, provider, signInWithPopup } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./WelcomePage.css";

const WelcomePage = () => {
  const [user, setUser] = useState(null);
  const [started, setStarted] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          await currentUser.reload();
          setUser(currentUser);
          localStorage.setItem("chat-user", JSON.stringify(currentUser));
          setIsReturningUser(true);
        } catch (err) {
          console.error("User reload failed:", err);
          await auth.signOut();
          localStorage.removeItem("chat-user");
          setUser(null);
          setIsReturningUser(false);
        }
      } else {
        setUser(null);
        localStorage.removeItem("chat-user");
        setIsReturningUser(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const userData = result.user;
      localStorage.setItem("chat-user", JSON.stringify(userData));
      setUser(userData);
      setIsReturningUser(true);
    } catch (err) {
      console.error("Google Sign-In Error:", err);
      alert("Login failed. Try again.");
    }
  };

  if (started) return <ChatPage user={user} />;

  return (
    <div className="welcome-page">
      <div className="orb-bg">
        <Orb
          hoverIntensity={0.5}
          rotateOnHover={true}
          hue={0}
          forceHoverState={false}
        />
      </div>

      <div className="welcome-content">
        <h1>Nomos</h1>
        <p>
          Your legal AI chatbot for Indian law. Whether you want to understand
          your rights or just learn more, you’re in the right place.
        </p>

        {!user && (
          <div className="button-group">
<button className="guest-btn" onClick={() => {
  localStorage.removeItem("chat-user"); // Clear any stored user data
  setUser(null); // Ensure user is null for guest mode
  setStarted(true);
}}>
  Start as Guest
</button>

            <button className="google-btn" onClick={signInWithGoogle}>
              <img
                src="https://cdn-icons-png.flaticon.com/128/300/300221.png"
                alt="Google"
                className="google-logo"
              />
              Sign in with Google
            </button>
          </div>
        )}

        {user && isReturningUser && (
          <>
            <p>Welcome back, <strong>{user.displayName}</strong></p>
            <button onClick={() => setStarted(true)}>View Chat</button>
          </>
        )}
      </div>
    </div>
  );
};

export default WelcomePage;
