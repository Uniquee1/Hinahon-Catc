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

  // Calendar and availability state
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
        .gte("date", new Date().toISOString().split('T')[0]) // Only future dates
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      setAvailability(data || []);
    } catch (err) {
      console.error("Error fetching availability:", err);
    }
  };

  const addAvailability = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !startTime || !endTime) {
      alert("Please fill in all fields");
      return;
    }

    if (startTime >= endTime) {
      alert("End time must be after start time");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Call the database function to generate time slots
      const { data, error } = await supabase.rpc('add_counselor_availability', {
        p_counselor_id: user.id,
        p_date: selectedDate,
        p_start_time: startTime,
        p_end_time: endTime
      });

      if (error) throw error;

      if (data > 0) {
        setSelectedDate("");
        setStartTime("");
        setEndTime("");
        fetchAvailability();
        alert(`${data} time slots added successfully!`);
      } else {
        alert("No new slots were added. They may already exist.");
      }
    } catch (err) {
      console.error("Error adding availability:", err);
      alert("Failed to add availability.");
    }
  };

  const deleteAvailabilitySlot = async (slotId) => {
    if (!window.confirm("Are you sure you want to delete this time slot?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("availability")
        .delete()
        .eq("id", slotId);

      if (error) throw error;
      fetchAvailability();
      alert("Time slot deleted successfully!");
    } catch (err) {
      console.error("Error deleting availability:", err);
      alert("Failed to delete time slot.");
    }
  };

  const updateConsultationStatus = async (consultationId, status) => {
    try {
      let updateData = { status };
      
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
    const roomId = Math.random().toString(36).substr(2, 9);
    return `https://hinahon.daily.co/${roomId}`;
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

  // Get minimum date (today)
  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Get maximum date (3 months from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  // Group availability by date for better display
  const groupedAvailability = availability.reduce((acc, slot) => {
    const date = slot.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {});

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
            onClick={() => setActiveTab("calendar")}
            style={{
              padding: "12px 24px",
              border: "none",
              background: "none",
              cursor: "pointer",
              borderBottom: activeTab === "calendar" ? "3px solid var(--teal)" : "none",
              color: activeTab === "calendar" ? "var(--teal)" : "#666",
              fontWeight: activeTab === "calendar" ? "600" : "400",
              fontSize: "16px"
            }}
          >
            Calendar & Availability
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

        {/* Calendar & Availability Tab */}
        {activeTab === "calendar" && (
          <div>
            <h2 style={{ color: "var(--pink)", marginBottom: "24px" }}>
              Calendar & Availability Management
            </h2>

            {/* Add Availability Form */}
            <div style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "var(--card-shadow)",
              marginBottom: "32px"
            }}>
              <h3 style={{ marginTop: "0", marginBottom: "20px" }}>
                Add Available Time Slots
              </h3>
              <form onSubmit={addAvailability}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "16px", alignItems: "end" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                      Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={getMinDate()}
                      max={getMaxDate()}
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
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
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
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
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
                    Add Slots
                  </button>
                </div>
                <p style={{ color: "#666", fontSize: "14px", marginTop: "8px" }}>
                  * Time slots will be created in 1-hour intervals between start and end time
                </p>
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
                Your Upcoming Availability
              </h3>
              
              {Object.keys(groupedAvailability).length === 0 ? (
                <p style={{ color: "#666", fontStyle: "italic" }}>
                  No availability set. Add your available dates and times above.
                </p>
              ) : (
                <div style={{ display: "grid", gap: "20px" }}>
                  {Object.entries(groupedAvailability).map(([date, slots]) => (
                    <div key={date} style={{
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      padding: "16px",
                      backgroundColor: "#f8f9fa"
                    }}>
                      <h4 style={{ margin: "0 0 12px 0", color: "var(--text)" }}>
                        {formatDate(date)}
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
                        {slots.map((slot) => (
                          <div
                            key={slot.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 12px",
                              backgroundColor: slot.is_booked ? "#ffebee" : "white",
                              borderRadius: "6px",
                              border: "1px solid #e0e0e0"
                            }}
                          >
                            <span style={{ fontSize: "14px" }}>
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              {slot.is_booked && <span style={{ color: "#d32f2f", marginLeft: "8px" }}>(Booked)</span>}
                            </span>
                            {!slot.is_booked && (
                              <button
                                onClick={() => deleteAvailabilitySlot(slot.id)}
                                style={{
                                  padding: "4px 8px",
                                  backgroundColor: "#dc3545",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "11px"
                                }}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
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