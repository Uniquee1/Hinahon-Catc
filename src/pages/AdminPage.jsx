import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles.css";

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [articles, setArticles] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Article form state
  const [articleForm, setArticleForm] = useState({
    title: "",
    content: "",
    emotion_tag: "",
    image_url: ""
  });
  const [editingArticle, setEditingArticle] = useState(null);

  const emotions = ["happy", "sad", "angry", "anxious", "stressed", "overwhelmed"];

  useEffect(() => {
    getCurrentUser();
    fetchUsers();
    fetchArticles();
    fetchConsultations();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchUsers = async () => {
    try {
      console.log("Fetching users...");
      const { data, error } = await supabase
        .from("users")
        .select("id, email, role, name")
        .order("email");

      console.log("Users query result:", { data, error });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      setUsers(data || []);
      console.log("Users set:", data);
    } catch (err) {
      console.error("Error fetching users:", err);
      // Try alternative query if RLS is blocking
      try {
        console.log("Trying alternative approach...");
        const { data: currentUser } = await supabase.auth.getUser();
        console.log("Current user:", currentUser);
        
        // Check if current user is admin
        const { data: adminCheck, error: adminError } = await supabase
          .from("users")
          .select("role")
          .eq("id", currentUser.user?.id)
          .single();
          
        console.log("Admin check:", { adminCheck, adminError });
      } catch (debugErr) {
        console.error("Debug error:", debugErr);
      }
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const fetchConsultations = async () => {
    try {
      const { data, error } = await supabase
        .from("consultations")
        .select(`
          id,
          date,
          time,
          status,
          student:student_id(name, email),
          counselor:counselor_id(name, email)
        `)
        .order("date", { ascending: false });

      if (error) throw error;
      setConsultations(data || []);
    } catch (err) {
      console.error("Error fetching consultations:", err);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;
      fetchUsers();
      alert("User role updated successfully!");
    } catch (err) {
      console.error("Error updating role:", err);
      alert("Failed to update user role.");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (error) throw error;
      fetchUsers();
      alert("User deleted successfully!");
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user.");
    }
  };

  const handleArticleSubmit = async (e) => {
    e.preventDefault();
    
    if (!articleForm.title || !articleForm.content || !articleForm.emotion_tag) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      if (editingArticle) {
        const { error } = await supabase
          .from("articles")
          .update(articleForm)
          .eq("id", editingArticle.id);

        if (error) throw error;
        alert("Article updated successfully!");
      } else {
        const { error } = await supabase
          .from("articles")
          .insert(articleForm);

        if (error) throw error;
        alert("Article created successfully!");
      }

      setArticleForm({ title: "", content: "", emotion_tag: "", image_url: "" });
      setEditingArticle(null);
      fetchArticles();
    } catch (err) {
      console.error("Error saving article:", err);
      alert("Failed to save article.");
    }
  };

  const editArticle = (article) => {
    setArticleForm(article);
    setEditingArticle(article);
  };

  const deleteArticle = async (articleId) => {
    if (!window.confirm("Are you sure you want to delete this article?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", articleId);

      if (error) throw error;
      fetchArticles();
      alert("Article deleted successfully!");
    } catch (err) {
      console.error("Error deleting article:", err);
      alert("Failed to delete article.");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getStatusBadgeStyle = (status) => {
    const baseStyle = {
      padding: "4px 12px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "600",
      textTransform: "uppercase"
    };

    switch (status) {
      case "pending":
        return { ...baseStyle, backgroundColor: "#fff3cd", color: "#856404" };
      case "accepted":
        return { ...baseStyle, backgroundColor: "#d4edda", color: "#155724" };
      case "rejected":
        return { ...baseStyle, backgroundColor: "#f8d7da", color: "#721c24" };
      default:
        return baseStyle;
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="landing-root">
      <header className="landing-header">
        <div className="header-left">
          <div className="logo-top">Hinahon</div>
          <div className="tagline-mini">Admin Dashboard</div>
        </div>
        <div className="header-right">
          <span style={{ color: "#666", fontSize: "14px", marginRight: "16px" }}>
            {user?.email}
          </span>
          <button className="btn-logout" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </header>

      <main style={{ padding: "40px 24px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Tab Navigation */}
        <div style={{ 
          display: "flex", 
          marginBottom: "32px", 
          borderBottom: "1px solid #e0e0e0" 
        }}>
          <button
            onClick={() => setActiveTab("users")}
            style={{
              padding: "12px 24px",
              border: "none",
              background: "none",
              cursor: "pointer",
              borderBottom: activeTab === "users" ? "3px solid var(--teal)" : "none",
              color: activeTab === "users" ? "var(--teal)" : "#666",
              fontWeight: activeTab === "users" ? "600" : "400",
              fontSize: "16px"
            }}
          >
            Manage Users
          </button>
          <button
            onClick={() => setActiveTab("articles")}
            style={{
              padding: "12px 24px",
              border: "none",
              background: "none",
              cursor: "pointer",
              borderBottom: activeTab === "articles" ? "3px solid var(--teal)" : "none",
              color: activeTab === "articles" ? "var(--teal)" : "#666",
              fontWeight: activeTab === "articles" ? "600" : "400",
              fontSize: "16px"
            }}
          >
            Manage Articles
          </button>
          <button
            onClick={() => setActiveTab("consultations")}
            style={{
              padding: "12px 24px",
              border: "none",
              background: "none",
              cursor: "pointer",
              borderBottom: activeTab === "consultations" ? "3px solid var(--teal)" : "none",
              color: activeTab === "consultations" ? "var(--teal)" : "#666",
              fontWeight: activeTab === "consultations" ? "600" : "400",
              fontSize: "16px"
            }}
          >
            View Consultations
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <h2 style={{ color: "var(--pink)", marginBottom: "24px" }}>
              User Management
            </h2>
            
            <div style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "var(--card-shadow)",
              overflow: "hidden"
            }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8f9fa" }}>
                      <th style={{ padding: "16px", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>
                        Name
                      </th>
                      <th style={{ padding: "16px", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>
                        Email
                      </th>
                      <th style={{ padding: "16px", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>
                        Role
                      </th>
                      <th style={{ padding: "16px", textAlign: "center", borderBottom: "1px solid #e0e0e0" }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <tr key={user.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td style={{ padding: "16px" }}>
                            {user.name || "—"}
                          </td>
                          <td style={{ padding: "16px" }}>
                            {user.email}
                          </td>
                          <td style={{ padding: "16px" }}>
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRole(user.id, e.target.value)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: "1px solid #e0e0e0",
                                fontSize: "14px"
                              }}
                            >
                              <option value="student">Student</option>
                              <option value="counselor">Counselor</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td style={{ padding: "16px", textAlign: "center" }}>
                            <button
                              onClick={() => deleteUser(user.id)}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "#dc3545",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "600"
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Articles Tab */}
        {activeTab === "articles" && (
          <div>
            <h2 style={{ color: "var(--pink)", marginBottom: "24px" }}>
              Article Management
            </h2>

            {/* Article Form */}
            <div style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "var(--card-shadow)",
              marginBottom: "32px"
            }}>
              <h3 style={{ marginTop: "0", marginBottom: "20px" }}>
                {editingArticle ? "Edit Article" : "Create New Article"}
              </h3>
              <form onSubmit={handleArticleSubmit}>
                <div style={{ display: "grid", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                      Title *
                    </label>
                    <input
                      type="text"
                      value={articleForm.title}
                      onChange={(e) => setArticleForm(prev => ({ ...prev, title: e.target.value }))}
                      required
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #e0e0e0",
                        fontSize: "14px",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                      Content *
                    </label>
                    <textarea
                      value={articleForm.content}
                      onChange={(e) => setArticleForm(prev => ({ ...prev, content: e.target.value }))}
                      required
                      rows="6"
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #e0e0e0",
                        fontSize: "14px",
                        boxSizing: "border-box",
                        resize: "vertical"
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                        Emotion Tag *
                      </label>
                      <select
                        value={articleForm.emotion_tag}
                        onChange={(e) => setArticleForm(prev => ({ ...prev, emotion_tag: e.target.value }))}
                        required
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: "8px",
                          border: "1px solid #e0e0e0",
                          fontSize: "14px"
                        }}
                      >
                        <option value="">Select emotion...</option>
                        {emotions.map(emotion => (
                          <option key={emotion} value={emotion}>
                            {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                        Image URL (optional)
                      </label>
                      <input
                        type="url"
                        value={articleForm.image_url}
                        onChange={(e) => setArticleForm(prev => ({ ...prev, image_url: e.target.value }))}
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: "8px",
                          border: "1px solid #e0e0e0",
                          fontSize: "14px",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                    <button
                      type="submit"
                      className="btn-action primary"
                    >
                      {editingArticle ? "Update Article" : "Create Article"}
                    </button>
                    {editingArticle && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingArticle(null);
                          setArticleForm({ title: "", content: "", emotion_tag: "", image_url: "" });
                        }}
                        className="btn-action secondary"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Articles List */}
            <div style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "var(--card-shadow)",
              padding: "24px"
            }}>
              <h3 style={{ marginTop: "0", marginBottom: "20px" }}>
                Existing Articles
              </h3>
              
              {articles.length === 0 ? (
                <p style={{ color: "#666", fontStyle: "italic" }}>
                  No articles found. Create your first article above.
                </p>
              ) : (
                <div style={{ display: "grid", gap: "16px" }}>
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      style={{
                        padding: "20px",
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                        backgroundColor: "#f8f9fa"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: "0 0 8px 0", color: "var(--text)" }}>
                            {article.title}
                          </h4>
                          <p style={{ margin: "0 0 8px 0", color: "#666", fontSize: "14px" }}>
                            {article.content.length > 100 
                              ? article.content.substring(0, 100) + "..."
                              : article.content
                            }
                          </p>
                          <span style={{
                            backgroundColor: "var(--teal)",
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600",
                            textTransform: "uppercase"
                          }}>
                            {article.emotion_tag}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "8px", marginLeft: "16px" }}>
                          <button
                            onClick={() => editArticle(article)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "var(--teal)",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "600"
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteArticle(article.id)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "600"
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Consultations Tab */}
        {activeTab === "consultations" && (
          <div>
            <h2 style={{ color: "var(--pink)", marginBottom: "24px" }}>
              Consultation Overview
            </h2>
            
            <div style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "var(--card-shadow)",
              overflow: "hidden"
            }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8f9fa" }}>
                      <th style={{ padding: "16px", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>
                        Student
                      </th>
                      <th style={{ padding: "16px", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>
                        Counselor
                      </th>
                      <th style={{ padding: "16px", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>
                        Date
                      </th>
                      <th style={{ padding: "16px", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultations.length > 0 ? (
                      consultations.map((consultation) => (
                        <tr key={consultation.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td style={{ padding: "16px" }}>
                            {consultation.student?.name || consultation.student?.email || "Unknown"}
                          </td>
                          <td style={{ padding: "16px" }}>
                            {consultation.counselor?.name || consultation.counselor?.email || "Unknown"}
                          </td>
                          <td style={{ padding: "16px" }}>
                            {formatDate(consultation.date)}
                          </td>
                          <td style={{ padding: "16px" }}>
                            <span style={getStatusBadgeStyle(consultation.status)}>
                              {consultation.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                          No consultations found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}