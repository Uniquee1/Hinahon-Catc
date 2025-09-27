import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles.css";

export default function ArticlesPage({ session }) {
  const navigate = useNavigate();
  const { emotion } = useParams();
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmotion, setSelectedEmotion] = useState(emotion || "all");
  const [expandedArticle, setExpandedArticle] = useState(null);

  const emotions = [
    { label: "All", value: "all" },
    { label: "Happy", value: "happy" },
    { label: "Sad", value: "sad" },
    { label: "Angry", value: "angry" },
    { label: "Anxious", value: "anxious" },
    { label: "Stressed", value: "stressed" },
    { label: "Overwhelmed", value: "overwhelmed" },
  ];

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [articles, selectedEmotion]);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("title");

      if (error) throw error;
      setArticles(data || []);
    } catch (err) {
      console.error("Error fetching articles:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterArticles = () => {
    if (selectedEmotion === "all") {
      setFilteredArticles(articles);
    } else {
      setFilteredArticles(
        articles.filter(article => 
          article.emotion_tag.toLowerCase() === selectedEmotion.toLowerCase()
        )
      );
    }
  };

  const handleEmotionChange = (emotionValue) => {
    setSelectedEmotion(emotionValue);
    setExpandedArticle(null);
  };

  const toggleArticle = (articleId) => {
    setExpandedArticle(expandedArticle === articleId ? null : articleId);
  };

  const truncateContent = (content, maxLength = 200) => {
    if (content.length <= maxLength) return content;
    return content.substr(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading articles...
      </div>
    );
  }

  return (
    <div className="landing-root">
      <header className="landing-header">
        <div className="header-left">
          <div className="logo-top">Hinahon</div>
          <div className="tagline-mini">Mental Health Articles</div>
        </div>
        <div className="header-right">
          <button 
            onClick={() => navigate("/landing")}
            style={{ 
              background: "none", 
              border: "none", 
              color: "#666", 
              cursor: "pointer",
              font: "inherit"
            }}
          >
            ← Back to Home
          </button>
        </div>
      </header>

      <main style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ 
            color: "var(--pink)", 
            fontSize: "36px", 
            margin: "0 0 12px 0",
            fontFamily: "Playfair Display, serif"
          }}>
            Mental Health Resources
          </h1>
          <p style={{ color: "#666", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
            Explore our collection of articles designed to support your mental health journey.
            {emotion && ` Here are resources specifically for when you're feeling ${emotion}.`}
          </p>
        </div>

        {/* Emotion Filter */}
        <div style={{ 
          marginBottom: "32px", 
          display: "flex", 
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          {emotions.map((emotionOption) => (
            <button
              key={emotionOption.value}
              onClick={() => handleEmotionChange(emotionOption.value)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: selectedEmotion === emotionOption.value ? "2px solid var(--teal)" : "1px solid #e0e0e0",
                backgroundColor: selectedEmotion === emotionOption.value ? "var(--teal)" : "white",
                color: selectedEmotion === emotionOption.value ? "white" : "#666",
                cursor: "pointer",
                fontWeight: selectedEmotion === emotionOption.value ? "600" : "400",
                transition: "all 0.2s ease"
              }}
            >
              {emotionOption.label}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        {filteredArticles.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "40px", 
            backgroundColor: "#f9f9f9", 
            borderRadius: "12px" 
          }}>
            <p style={{ color: "#666", fontSize: "16px" }}>
              {selectedEmotion === "all" 
                ? "No articles available at the moment." 
                : `No articles found for "${selectedEmotion}" emotion.`
              }
            </p>
          </div>
        ) : (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", 
            gap: "24px" 
          }}>
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  boxShadow: "var(--card-shadow)",
                  overflow: "hidden",
                  border: "1px solid #f0f0f0",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 20px 40px rgba(18,18,18,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "var(--card-shadow)";
                }}
              >
                {article.image_url && (
                  <img
                    src={article.image_url}
                    alt={article.title}
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover"
                    }}
                  />
                )}
                
                <div style={{ padding: "24px" }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "flex-start",
                    marginBottom: "12px"
                  }}>
                    <h3 style={{ 
                      margin: "0", 
                      color: "var(--text)", 
                      fontSize: "18px",
                      lineHeight: "1.4"
                    }}>
                      {article.title}
                    </h3>
                    <span style={{
                      backgroundColor: "var(--teal)",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      marginLeft: "12px",
                      whiteSpace: "nowrap"
                    }}>
                      {article.emotion_tag}
                    </span>
                  </div>

                  <p style={{ 
                    color: "#666", 
                    lineHeight: "1.6",
                    margin: "0 0 16px 0"
                  }}>
                    {expandedArticle === article.id 
                      ? article.content 
                      : truncateContent(article.content)
                    }
                  </p>

                  <button
                    onClick={() => toggleArticle(article.id)}
                    style={{
                      backgroundColor: "transparent",
                      color: "var(--teal)",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "600",
                      padding: "0",
                      fontSize: "14px"
                    }}
                  >
                    {expandedArticle === article.id ? "Read Less" : "Read More"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div style={{ 
          textAlign: "center", 
          marginTop: "48px",
          padding: "32px",
          backgroundColor: "rgba(233,30,99,0.03)",
          borderRadius: "12px"
        }}>
          <h3 style={{ color: "var(--pink)", marginBottom: "16px" }}>
            Need Professional Support?
          </h3>
          <p style={{ color: "#666", marginBottom: "24px", maxWidth: "500px", margin: "0 auto 24px auto" }}>
            While these articles provide helpful insights, sometimes you need personalized guidance. 
            Connect with our licensed counselors for professional support.
          </p>
          <button
            onClick={() => navigate("/booking")}
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
            Book a Consultation
          </button>
        </div>
      </main>
    </div>
  );
}