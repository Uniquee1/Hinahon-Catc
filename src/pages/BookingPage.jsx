import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles.css";

export default function BookingPage({ session }) {
  const navigate = useNavigate();
  const { emotion } = useParams();
  const [bookingFlow, setBookingFlow] = useState(""); // "date-first" or "counselor-first"
  const [counselors, setCounselors] = useState([]);
  const [selectedCounselor, setSelectedCounselor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [availableCounselors, setAvailableCounselors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isGuest = session?.isGuest;
  const user = session?.user;

  useEffect(() => {
    fetchCounselors();
  }, []);

  // Fetch available slots when date changes (for date-first flow)
  useEffect(() => {
    if (bookingFlow === "date-first" && selectedDate) {
      fetchAvailableCounselorsForDate();
    }
  }, [selectedDate, bookingFlow]);

  // Fetch available slots when counselor changes (for counselor-first flow)
  useEffect(() => {
    if (bookingFlow === "counselor-first" && selectedCounselor) {
      fetchAvailableSlotsForCounselor();
    }
  }, [selectedCounselor, bookingFlow]);

  const fetchCounselors = async () => {
    try {
      console.log("Fetching counselors...");
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("role", "counselor");

      console.log("Counselors query result:", { data, error });

      if (error) throw error;
      setCounselors(data || []);
      console.log("Counselors set:", data);
    } catch (err) {
      console.error("Error fetching counselors:", err);
      setError("Failed to load counselors");
    }
  };

  // For date-first flow: get counselors available on selected date
  const fetchAvailableCounselorsForDate = async () => {
    try {
      setLoading(true);
      console.log("Fetching counselors for date:", selectedDate);
      
      // First get availability slots
      const { data: availabilityData, error: availabilityError } = await supabase
        .from("availability")
        .select("id, start_time, end_time, counselor_id")
        .eq("date", selectedDate)
        .eq("is_booked", false)
        .order("start_time");

      console.log("Availability data:", availabilityData);

      if (availabilityError) throw availabilityError;

      if (!availabilityData || availabilityData.length === 0) {
        setAvailableCounselors([]);
        return;
      }

      // Get unique counselor IDs
      const counselorIds = [...new Set(availabilityData.map(slot => slot.counselor_id))];
      console.log("Counselor IDs:", counselorIds);

      // Fetch counselor details separately
      const { data: counselorsData, error: counselorsError } = await supabase
        .from("users")
        .select("id, name, email, role")
        .in("id", counselorIds);

      console.log("Counselors query - IDs:", counselorIds);
      console.log("Counselors query - Data:", counselorsData);
      console.log("Counselors query - Error:", counselorsError);

      if (counselorsError) throw counselorsError;

      // Filter to only counselors (in case other roles slipped through)
      const actualCounselors = counselorsData.filter(user => user.role === 'counselor');
      console.log("Filtered counselors:", actualCounselors);

      // Combine data
      const counselorMap = {};
      actualCounselors.forEach(counselor => {
        counselorMap[counselor.id] = {
          counselor: counselor,
          slots: []
        };
      });

      // Add slots to respective counselors
      availabilityData.forEach(slot => {
        if (counselorMap[slot.counselor_id]) {
          counselorMap[slot.counselor_id].slots.push(slot);
        }
      });

      const result = Object.values(counselorMap);
      console.log("Final result:", result);
      setAvailableCounselors(result);

    } catch (err) {
      console.error("Error fetching available counselors:", err);
      setError("Failed to load available counselors for this date");
    } finally {
      setLoading(false);
    }
  };

  // For counselor-first flow: get available slots for selected counselor
  const fetchAvailableSlotsForCounselor = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("availability")
        .select("id, date, start_time, end_time")
        .eq("counselor_id", selectedCounselor)
        .eq("is_booked", false)
        .gte("date", new Date().toISOString().split('T')[0])
        .order("date")
        .order("start_time");

      if (error) throw error;

      // Group slots by date
      const dateMap = {};
      data.forEach(slot => {
        const date = slot.date;
        if (!dateMap[date]) {
          dateMap[date] = [];
        }
        dateMap[date].push(slot);
      });

      setAvailableSlots(dateMap);
    } catch (err) {
      console.error("Error fetching available slots:", err);
      setError("Failed to load available slots for this counselor");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isGuest) {
      alert("Please sign in to book a consultation");
      navigate("/");
      return;
    }

    if (!selectedSlot) {
      setError("Please select a time slot");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Get slot details
      const { data: slotData, error: slotError } = await supabase
        .from("availability")
        .select("date, start_time, counselor_id")
        .eq("id", selectedSlot)
        .single();

      if (slotError) throw slotError;

      // Create consultation
      const { error: consultationError } = await supabase
        .from("consultations")
        .insert({
          student_id: user.id,
          counselor_id: slotData.counselor_id,
          date: slotData.date,
          time: slotData.start_time,
          status: "pending",
          availability_id: selectedSlot
        });

      if (consultationError) throw consultationError;

      // Mark slot as booked
      const { error: updateError } = await supabase
        .from("availability")
        .update({ is_booked: true })
        .eq("id", selectedSlot);

      if (updateError) throw updateError;

      alert("Consultation request submitted successfully! You will receive a notification once the counselor responds.");
      navigate("/landing");
    } catch (err) {
      console.error("Error booking consultation:", err);
      setError("Failed to book consultation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setBookingFlow("");
    setSelectedCounselor("");
    setSelectedDate("");
    setSelectedSlot("");
    setAvailableSlots([]);
    setAvailableCounselors([]);
    setError("");
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

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className="landing-root">
      <header className="landing-header">
        <div className="header-left">
          <div className="logo-top">Hinahon</div>
          <div className="tagline-mini">Book a Consultation</div>
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

      <main style={{ padding: "40px 24px", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ color: "var(--pink)", fontSize: "36px", margin: "0 0 12px 0" }}>
            Book Your Consultation
          </h1>
          {emotion && (
            <p style={{ color: "#666", fontSize: "16px" }}>
              We understand you're feeling <strong>{emotion}</strong>. 
              Let's connect you with a professional counselor.
            </p>
          )}
        </div>

        {isGuest ? (
          <div style={{ 
            textAlign: "center", 
            padding: "40px", 
            backgroundColor: "#f9f9f9", 
            borderRadius: "12px",
            margin: "20px 0"
          }}>
            <h3 style={{ color: "var(--pink)", marginBottom: "16px" }}>
              Sign In Required
            </h3>
            <p style={{ marginBottom: "20px", color: "#666" }}>
              You need to sign in to book a consultation with our counselors.
            </p>
            <button 
              onClick={() => navigate("/")}
              className="btn-action primary"
              style={{ padding: "12px 24px" }}
            >
              Sign In Now
            </button>
          </div>
        ) : (
          <div style={{ 
            backgroundColor: "white", 
            padding: "32px", 
            borderRadius: "12px", 
            boxShadow: "var(--card-shadow)" 
          }}>
            {/* Flow Selection */}
            {!bookingFlow && (
              <div>
                <h3 style={{ marginBottom: "24px", textAlign: "center" }}>
                  How would you like to book your consultation?
                </h3>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <button
                    onClick={() => setBookingFlow("date-first")}
                    style={{
                      padding: "32px 24px",
                      border: "2px solid #e0e0e0",
                      borderRadius: "12px",
                      backgroundColor: "white",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = "var(--teal)";
                      e.target.style.backgroundColor = "rgba(0,191,165,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = "#e0e0e0";
                      e.target.style.backgroundColor = "white";
                    }}
                  >
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>📅</div>
                    <h4 style={{ margin: "0 0 12px 0", color: "var(--text)" }}>
                      Choose Date & Time First
                    </h4>
                    <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>
                      Pick your preferred date and time, then see which counselors are available
                    </p>
                  </button>

                  <button
                    onClick={() => setBookingFlow("counselor-first")}
                    style={{
                      padding: "32px 24px",
                      border: "2px solid #e0e0e0",
                      borderRadius: "12px",
                      backgroundColor: "white",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = "var(--teal)";
                      e.target.style.backgroundColor = "rgba(0,191,165,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = "#e0e0e0";
                      e.target.style.backgroundColor = "white";
                    }}
                  >
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>👨‍⚕️</div>
                    <h4 style={{ margin: "0 0 12px 0", color: "var(--text)" }}>
                      Choose Counselor First
                    </h4>
                    <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>
                      Pick your preferred counselor, then see their available times
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Date-First Flow */}
            {bookingFlow === "date-first" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
                  <button 
                    onClick={resetFlow}
                    style={{ 
                      background: "none", 
                      border: "none", 
                      color: "var(--teal)", 
                      cursor: "pointer",
                      marginRight: "16px"
                    }}
                  >
                    ← Change Booking Method
                  </button>
                  <h3 style={{ margin: "0" }}>Step 1: Choose Your Preferred Date</h3>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={getMinDate()}
                    max={getMaxDate()}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #e0e0e0",
                      fontSize: "16px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                {selectedDate && (
                  <div>
                    <h3>Available Counselors for {formatDate(selectedDate)}</h3>
                    {loading ? (
                      <p>Loading available counselors...</p>
                    ) : availableCounselors.length === 0 ? (
                      <div>
                        <p style={{ color: "#666", fontStyle: "italic" }}>
                          No counselors available on this date. Please try another date.
                        </p>
                        <details style={{ marginTop: "16px", padding: "12px", backgroundColor: "#f0f0f0", borderRadius: "8px" }}>
                          <summary style={{ cursor: "pointer", fontWeight: "600" }}>Debug Info</summary>
                          <div style={{ marginTop: "8px", fontSize: "14px" }}>
                            <p>Selected date: {selectedDate}</p>
                            <p>Available counselors count: {availableCounselors.length}</p>
                            <p>Check if:</p>
                            <ul>
                              <li>The counselor has set availability for this date</li>
                              <li>The availability slots are not already booked</li>
                              <li>The date is in the future</li>
                            </ul>
                          </div>
                        </details>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: "16px" }}>
                        {availableCounselors.map(({ counselor, slots }) => {
                          // Safety check for null counselor
                          if (!counselor) {
                            console.warn("Null counselor found, skipping");
                            return null;
                          }
                          
                          return (
                            <div
                              key={counselor.id}
                              style={{
                                border: "1px solid #e0e0e0",
                                borderRadius: "8px",
                                padding: "20px",
                                backgroundColor: "#f8f9fa"
                              }}
                            >
                              <h4 style={{ margin: "0 0 16px 0" }}>
                                {counselor.name || counselor.email || "Unknown Counselor"}
                              </h4>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {slots && slots.map((slot) => (
                                  <button
                                    key={slot.id}
                                    onClick={() => setSelectedSlot(slot.id)}
                                    style={{
                                      padding: "8px 16px",
                                      border: selectedSlot === slot.id ? "2px solid var(--teal)" : "1px solid #ccc",
                                      borderRadius: "6px",
                                      backgroundColor: selectedSlot === slot.id ? "var(--teal)" : "white",
                                      color: selectedSlot === slot.id ? "white" : "#333",
                                      cursor: "pointer",
                                      fontSize: "14px"
                                    }}
                                  >
                                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        }).filter(Boolean)} {/* Remove null entries */}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Counselor-First Flow */}
            {bookingFlow === "counselor-first" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
                  <button 
                    onClick={resetFlow}
                    style={{ 
                      background: "none", 
                      border: "none", 
                      color: "var(--teal)", 
                      cursor: "pointer",
                      marginRight: "16px"
                    }}
                  >
                    ← Change Booking Method
                  </button>
                  <h3 style={{ margin: "0" }}>Step 1: Choose Your Preferred Counselor</h3>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <select
                    value={selectedCounselor}
                    onChange={(e) => setSelectedCounselor(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #e0e0e0",
                      fontSize: "16px"
                    }}
                  >
                    <option value="">Choose a counselor...</option>
                    {counselors.map((counselor) => (
                      <option key={counselor.id} value={counselor.id}>
                        {counselor.name || counselor.email}
                      </option>
                    ))}
                  </select>
                  {counselors.length === 0 && (
                    <p style={{ color: "#666", fontSize: "14px", marginTop: "8px" }}>
                      No counselors found. Please check if any counselors are registered.
                    </p>
                  )}
                </div>

                {selectedCounselor && (
                  <div>
                    <h3>Available Times</h3>
                    {loading ? (
                      <p>Loading available times...</p>
                    ) : Object.keys(availableSlots).length === 0 ? (
                      <p style={{ color: "#666", fontStyle: "italic" }}>
                        This counselor has no available slots. Please try another counselor.
                      </p>
                    ) : (
                      <div style={{ display: "grid", gap: "16px" }}>
                        {Object.entries(availableSlots).map(([date, slots]) => (
                          <div
                            key={date}
                            style={{
                              border: "1px solid #e0e0e0",
                              borderRadius: "8px",
                              padding: "20px",
                              backgroundColor: "#f8f9fa"
                            }}
                          >
                            <h4 style={{ margin: "0 0 16px 0" }}>
                              {formatDate(date)}
                            </h4>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                              {slots.map((slot) => (
                                <button
                                  key={slot.id}
                                  onClick={() => setSelectedSlot(slot.id)}
                                  style={{
                                    padding: "8px 16px",
                                    border: selectedSlot === slot.id ? "2px solid var(--teal)" : "1px solid #ccc",
                                    borderRadius: "6px",
                                    backgroundColor: selectedSlot === slot.id ? "var(--teal)" : "white",
                                    color: selectedSlot === slot.id ? "white" : "#333",
                                    cursor: "pointer",
                                    fontSize: "14px"
                                  }}
                                >
                                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div style={{ 
                color: "#d32f2f", 
                backgroundColor: "#ffebee", 
                padding: "12px", 
                borderRadius: "8px", 
                marginBottom: "20px" 
              }}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            {selectedSlot && (
              <div style={{ marginTop: "32px", textAlign: "center" }}>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    padding: "16px 32px",
                    backgroundColor: loading ? "#ccc" : "var(--teal)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                >
                  {loading ? "Booking..." : "Book Consultation"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}