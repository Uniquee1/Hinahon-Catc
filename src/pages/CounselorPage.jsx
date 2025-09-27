import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles.css";

export default function CounselorPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("consultations");
  const [consultations, setConsultations] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Availability form state
  const [newAvailability, setNewAvailability] = useState({
    day: "",
    start_time: "",
    end_time: ""
  });

  const days = [
    "monday", "tuesday", "wednesday", "thursday", 
    "friday", "saturday", "sunday"
  ];

  useEffect(() => {
    getCurrentUser();
    fetchConsultations();
    fetchAvailability();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchConsultations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("consultations")
        .select(`
          id,
          date,
          time,
          status,
          video_link,
          student:student_id(name, email)
        `)
        .eq("counselor_id", user.id)
        .order("date", { ascending: true });

      if (error) throw error;
      setConsultations(data || []);
    } catch (err) {
      console.error("Error fetching consultations:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("availability")
        .select("*")
        .eq("counselor_id", user.id)
        .order("day");

      if (error) throw error;
      setAvailability(data || []);
    } catch (err) {
      console.error("Error fetching availability:", err);
    }
  };

  const updateConsultationStatus = async (consultationId, status) => {
    try {
      let updateData = { status };
      
      // If accepting, generate a video link
      if (status === "accepted") {
        const videoLink = generateVideoLink();
        updateData.video_link = videoLink;
      }

      const { error } = await supabase
        .from("consultations")
        .update(updateData)
        .eq("id", consultationId);

      if (error) throw error;

      fetchConsultations();
      
      if (status === "accepted") {
        alert("Consultation accepted! Video link has been generated.");
      } else {
        alert("Consultation rejected.");
      }
    } catch (err) {
      console.error("Error updating consultation:", err);
      alert("Failed to update consultation status.");
    }
  };

  const generateVideoLink = () => {
    // Placeholder video link - integrate with Daily.co later
    const roomId = Math.random().toString(36).substr(2, 9);
    return `https://hinahon.daily.co/${roomId}`;
  };

  const addAvailability = async (e) => {
    e.preventDefault();
    
    if (!newAvailability.day || !newAvailability.start_time || !newAvailability.end_time) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("availability")
        .insert({
          counselor_id: user.id,
          day: newAvailability.day,
          start_time: newAvailability.start_time,
          end_time: newAvailability.end_time
        });

      if (error) throw error;

      setNewAvailability({ day: "", start_time: "", end_time: "" });
      fetchAvailability();
      alert("Availability added successfully!");
    } catch (err) {
      console.error("Error adding availability:", err);
      alert("Failed to add availability.");
    }
  };

  const deleteAvailability = async (availabilityId) => {
    if (!window.confirm("Are you sure you want to delete this availability?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("availability")
        .delete()
        .eq("id", availabilityId);

      if (error) throw error;
      fetchAvailability();
      alert("Availability deleted successfully!");
    } catch (err) {
      console.error("Error deleting availability:", err);
      alert("Failed to delete availability.");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
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
        Loading...
      </div>
    );
  }

  return (
    <div className="landing-root">
      <header className="landing-header">
        <div className="header-left">
          <div className="logo-top">Hinahon</div>
          <div className="tagline-mini">Counselor Dashboard</div>
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

      <main style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Tab Navigation */}
        <div style={{ 
          display: "flex", 
          marginBottom: "32px", 
          borderBottom: "1px solid #e0e0e0" 
        }}>
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
            Consultation Requests
          </button>
          <button
            onClick={() => setActiveTab("availability")}
            style={{
              padding: "12px 24px",
              border: "none",
              background: "none",
              cursor: "pointer",
              borderBottom: activeTab === "availability" ? "3px solid var(--teal)" : "none",
              color: activeTab === "availability" ? "var(--teal)" : "#666",
              fontWeight: activeTab === "availability" ? "600" : "400",
              fontSize: "16px"
            }}
          >
            Manage Availability
          </button>
        </div>

        {/* Consultations Tab */}
        {activeTab === "consultations" && (
          <div>
            <h2 style={{ color: "var(--pink)", marginBottom: "24px" }}>
              Consultation Requests
            </h2>
            
            {consultations.length === 0 ? (
              <div style={{ 
                textAlign: "center", 
                padding: "40px", 
                backgroundColor: "#f9f9f9", 
                borderRadius: "12px" 
              }}>
                <p style={{ color: "#666", fontSize: "16px" }}>
                  No consultation requests yet.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "16px" }}>
                {consultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    style={{
                      backgroundColor: "white",
                      padding: "24px",
                      borderRadius: "12px",
                      boxShadow: "var(--card-shadow)",
                      border: "1px solid #f0f0f0"
                    }}
                  >
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "flex-start",
                      marginBottom: "16px"
                    }}>
                      <div>
                        <h3 style={{ margin: "0 0 8px 0", color: "var(--text)" }}>
                          {consultation.student?.name || consultation.student?.email || "Student"}
                        </h3>
                        <p style={{ margin: "0 0 4px 0", color: "#666" }}>
                          📅 {formatDate(consultation.date)}
                        </p>
                        <p style={{ margin: "0 0 4px 0", color: "#666" }}>
                          🕐 {formatTime(consultation.time)}
                        </p>
                        {consultation.video_link && (
                          <p style={{ margin: "8px 0 0 0" }}>
                            <strong>Video Link:</strong>{" "}
                            <a 
                              href={consultation.video_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: "var(--teal)" }}
                            >
                              Join Session
                            </a>
                          </p>
                        )}
                      </div>
                      <div style={getStatusBadgeStyle(consultation.status)}>
                        {consultation.status}
                      </div>
                    </div>

                    {consultation.status === "pending" && (
                      <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                        <button
                          onClick={() => updateConsultationStatus(consultation.id, "accepted")}
                          className="btn-action primary"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => updateConsultationStatus(consultation.id, "rejected")}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "600"
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Availability Tab */}
        {activeTab === "availability" && (
          <div>
            <h2 style={{ color: "var(--pink)", marginBottom: "24px" }}>
              Manage Your Availability
            </h2>

            {/* Add New Availability Form */}
            <div style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "var(--card-shadow)",
              marginBottom: "32px"
            }}>
              <h3 style={{ marginTop: "0", marginBottom: "20px" }}>
                Add Availability
              </h3>
              <form onSubmit={addAvailability}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "16px", alignItems: "end" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                      Day
                    </label>
                    <select
                      value={newAvailability.day}
                      onChange={(e) => setNewAvailability(prev => ({ ...prev, day: e.target.value }))}
                      required
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #e0e0e0",
                        fontSize: "14px"
                      }}
                    >
                      <option value="">Select day...</option>
                      {days.map(day => (
                        <option key={day} value={day}>
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newAvailability.start_time}
                      onChange={(e) => setNewAvailability(prev => ({ ...prev, start_time: e.target.value }))}
                      required
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #e0e0e0",
                        fontSize: "14px"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                      End Time
                    </label>
                    <input
                      type="time"
                      value={newAvailability.end_time}
                      onChange={(e) => setNewAvailability(prev => ({ ...prev, end_time: e.target.value }))}
                      required
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #e0e0e0",
                        fontSize: "14px"
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-action primary"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>

            {/* Current Availability */}
            <div style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "var(--card-shadow)"
            }}>
              <h3 style={{ marginTop: "0", marginBottom: "20px" }}>
                Current Availability
              </h3>
              
              {availability.length === 0 ? (
                <p style={{ color: "#666", fontStyle: "italic" }}>
                  No availability set. Add your available times above.
                </p>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {availability.map((slot) => (
                    <div
                      key={slot.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "16px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        border: "1px solid #e9ecef"
                      }}
                    >
                      <div>
                        <strong style={{ textTransform: "capitalize" }}>
                          {slot.day}
                        </strong>
                        <span style={{ marginLeft: "16px", color: "#666" }}>
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteAvailability(slot.id)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}