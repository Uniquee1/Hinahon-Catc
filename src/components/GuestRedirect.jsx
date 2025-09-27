
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function GuestRedirect({ message = "You need to sign in to access this page." }) {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleSignInNow = () => {
    navigate("/");
  };

  return (
    <div className="landing-root">
      <header className="landing-header">
        <div className="header-left">
          <div className="logo-top">Hinahon</div>
          <div className="tagline-mini">Sign In Required</div>
        </div>
      </header>

      <main style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "60vh",
        padding: "40px 24px"
      }}>
        <div style={{
          textAlign: "center",
          backgroundColor: "white",
          padding: "48px",
          borderRadius: "12px",
          boxShadow: "var(--card-shadow)",
          maxWidth: "500px",
          width: "100%"
        }}>
          <div style={{ fontSize: "64px", marginBottom: "24px" }}>🔒</div>
          
          <h2 style={{ 
            color: "var(--pink)", 
            marginBottom: "16px",
            fontSize: "24px"
          }}>
            Sign In Required
          </h2>
          
          <p style={{ 
            color: "#666", 
            marginBottom: "24px",
            lineHeight: "1.6"
          }}>
            {message}
          </p>

          <p style={{ 
            color: "#999", 
            fontSize: "14px",
            marginBottom: "24px"
          }}>
            You'll be redirected to the sign-in page in a few seconds...
          </p>

          <button
            onClick={handleSignInNow}
            style={{
              padding: "12px 24px",
              backgroundColor: "var(--teal)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "16px"
            }}
          >
            Sign In Now
          </button>

          <div style={{ marginTop: "24px" }}>
            <button
              onClick={() => window.history.back()}
              style={{
                background: "none",
                border: "none",
                color: "var(--teal)",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              ← Go Back
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}