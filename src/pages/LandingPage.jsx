import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles.css";

export default function LandingPage({ session, setSession }) {
  const navigate = useNavigate();
  const user = session?.user ?? null;
  const isGuest = session?.isGuest === true || user?.email === "guest";

  const [selectedEmotion, setSelectedEmotion] = useState(null);

  async function handleAuthAction() {
    if (isGuest) {
      localStorage.removeItem("hinahon_guest");
      setSession(null);
      navigate("/");
      return;
    }

    await supabase.auth.signOut();
    setSession(null);
    navigate("/");
  }

  const emotions = [
    { label: "Happy", icon: "😊", value: "happy" },
    { label: "Sad", icon: "😢", value: "sad" },
    { label: "Angry", icon: "😡", value: "angry" },
    { label: "Anxious", icon: "😰", value: "anxious" },
    { label: "Stressed", icon: "😤", value: "stressed" },
    { label: "Tired", icon: "😴", value: "tired" },
    { label: "Confused", icon: "😕", value: "confused" },
    { label: "Overwhelmed", icon: "😵", value: "overwhelmed" },
  ];

  const handleBookAppointment = () => {
    if (selectedEmotion) {
      navigate(`/booking/${selectedEmotion}`);
    } else {
      navigate("/booking");
    }
  };

  const handleReadArticles = () => {
    if (selectedEmotion) {
      navigate(`/articles/${selectedEmotion}`);
    } else {
      navigate("/articles");
    }
  };

  const getUserDisplayName = () => {
    if (isGuest) return "Guest";
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  return (
    <div className="landing-root">
      <header className="landing-header">
        <div className="header-left">
          <div className="logo-top">Hinahon</div>
          <div className="tagline-mini">A Mental Health Booking App</div>
        </div>

        <div className="header-right">
          <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <button 
              onClick={() => navigate("/articles")}
              style={{ 
                background: "none", 
                border: "none", 
                color: "#666", 
                textDecoration: "none",
                cursor: "pointer",
                font: "inherit"
              }}
            >
              Articles
            </button>
            <button 
              onClick={() => navigate("/booking")}
              style={{ 
                background: "none", 
                border: "none", 
                color: "#666", 
                textDecoration: "none",
                cursor: "pointer",
                font: "inherit"
              }}
            >
              Book Session
            </button>
          </nav>

          {isGuest ? (
            <button className="btn-guest" onClick={handleAuthAction}>
              Sign In
            </button>
          ) : (
            <>
              <span style={{ color: "#666", fontSize: "14px" }}>
                {getUserDisplayName()}
              </span>
              <button className="btn-logout" onClick={handleAuthAction}>
                Sign Out
              </button>
            </>
          )}
        </div>
      </header>

      <main className="landing-hero">
        <div className="hero-inner">
          <div className="greeting">
            <div className="greet-small">
              Hello, {getUserDisplayName()}!
            </div>

            <h2 className="brand-display" style={{ marginTop: 6 }}>
              Hinahon
            </h2>

            <p className="hero-note">
              The Digital Solution to Accessible Mental Health Services in the Philippines.
            </p>

            <div className="feeling-ask">How are you feeling today?</div>

            <div className="emotions-grid" role="list" aria-label="Emotions">
              {emotions.map((emotion) => (
                <button
                  key={emotion.value}
                  className={`emotion ${selectedEmotion === emotion.value ? "selected" : ""}`}
                  type="button"
                  onClick={() => setSelectedEmotion(emotion.value)}
                  aria-label={`Select ${emotion.label} emotion`}
                >
                  <div className="emotion-circle">{emotion.icon}</div>
                  <div className="emotion-label">{emotion.label}</div>
                </button>
              ))}
            </div>

            {selectedEmotion && (
              <div className="post-actions">
                <div className="selected-note">
                  You're feeling{" "}
                  <strong>
                    {emotions.find(e => e.value === selectedEmotion)?.label}
                  </strong>
                  . What would you like to do?
                </div>
                <div className="action-buttons">
                  <button
                    className="btn-action primary"
                    onClick={handleBookAppointment}
                  >
                    Book Consultation
                  </button>
                  <button
                    className="btn-action secondary"
                    onClick={handleReadArticles}
                  >
                    Read Articles
                  </button>
                </div>
              </div>
            )}

            {!selectedEmotion && (
              <div className="post-actions">
                <div className="selected-note">
                  Or explore our services directly:
                </div>
                <div className="action-buttons">
                  <button
                    className="btn-action primary"
                    onClick={handleBookAppointment}
                  >
                    Book Consultation
                  </button>
                  <button
                    className="btn-action secondary"
                    onClick={handleReadArticles}
                  >
                    Browse Articles
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="hero-image-placeholder" aria-hidden />
        </div>
      </main>

      <footer className="landing-footer">
        ©2025 TEAM HINAHON | All Rights Reserved
      </footer>
    </div>
  );
}