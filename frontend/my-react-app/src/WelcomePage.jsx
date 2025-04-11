import React, { useState } from "react";
import Chatbot from "./chatbot";
import Orb from "./orb"; // make sure this matches the actual filename!
import "./WelcomePage.css";

const WelcomePage = () => {
  const [started, setStarted] = useState(false);

  if (started) return <Chatbot />;

  return (
    <div className="welcome-page">
      {/* Orb animated background */}
      <div className="orb-bg">
        <Orb
          hoverIntensity={0.5}
          rotateOnHover={true}
          hue={0}
          forceHoverState={false}
        />
      </div>

      {/* Centered content */}
      <div className="welcome-content">
        <h1>Welcome to Nomos 1.0</h1>
        <p>
          The legal AI chatbot is made to ease legal issues. Whether you have a query about the
          Indian legal system or simply want to learn—you’re in the right place.
        </p>
        <button onClick={() => setStarted(true)}>Try Now</button>
      </div>
    </div>
  );
};

export default WelcomePage;
