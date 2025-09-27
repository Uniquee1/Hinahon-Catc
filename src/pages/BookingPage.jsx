import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles.css";

export default function BookingPage({ session }) {
  const navigate = useNavigate();
  const { emotion } = useParams();
  const [counselors, setCounselors] = useState([]);
  const [selectedCounselor, setSelectedCounselor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isGuest = session?.isGuest;
  const user = session?.user;

  useEffect(() => {
    fetchCounselors();
  }, []);

  useEffect(() => {
    if (selectedCounselor && selectedDate) {
      fetchAvailableTimes();
    }
  }, [selectedCounselor, selectedDate]);

  const fetchCounselors = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("role", "counselor");

      if (error) throw error;
      setCounselors(data || []);
    } catch (err) {
      console.error("Error fetching counselors:", err);
      setError("Failed to load counselors");
    }
  };

  const fetchAvailableTimes = async () => {
    try {
      const selectedDateObj = new Date(selectedDate);
      const dayName = selectedDateObj.toLocaleLString('en-US', { weekday: 'long' }).toLowerCase();

      const { data, error } = await supabase
        .from("availability")
        .select("start_time, end_time")
        .eq("counselor_id", selectedCounselor)
        .eq("day", dayName);

      if (error) throw error;

      if (data && data.length > 0) {
        const times = generateTimeSlots(data[0].start_time, data[0].end_time);
        setAvailableTimes(times);
      } else {
        setAvailableTimes([]);
      }
    } catch (err) {
      console.error("Error fetching availability:", err);
      setAvailableTimes([]);
    }
  };

  const generateTimeSlots = (startTime, endTime) => {
    const slots = [];
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    while (start < end) {
      slots.push(start.toTimeString().slice(0, 5));
      start.setHours(start.getHours() + 1);
    }
    
    return slots;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isGuest) {
      alert("Please sign in to book a consultation");
      navigate("/");
      return;
    }

    if (!selectedCounselor || !selectedDate || !selectedTime) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error } = await supabase
        .from("consultations")
        .insert({
          student_id: user.id,
          counselor_id: selectedCounselor,
          date: selectedDate,
          time: selectedTime,
          status: "pending"
        });

      if (error) throw error;

      alert("Consultation request submitted successfully! You will receive a notification once the counselor responds.");
      navigate("/landing");
    } catch (err) {
      console.error("Error booking consultation:", err);
      setError("Failed to book consultation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
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

      <main style={{ padding: "40px 24px", maxWidth: "800px", margin: "0 auto" }}>
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
              className="btn-primary"
              style={{ padding: "12px 24px" }}
            >
              Sign In Now
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ 
            backgroundColor: "white", 
            padding: "32px", 
            borderRadius: "12px", 
            boxShadow: "var(--card-shadow)" 
          }}>
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

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                Select Counselor
              </label>
              <select
                value={selectedCounselor}
                onChange={(e) => setSelectedCounselor(e.target.value)}
                required
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
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                Select Date
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
                  fontSize: "16px"
                }}
              />
            </div>

            <div style={{ marginBottom: "32px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                Select Time
              </label>
              {availableTimes.length > 0 ? (
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    fontSize: "16px"
                  }}
                >
                  <option value="">Choose a time...</option>
                  {availableTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              ) : selectedCounselor && selectedDate ? (
                <p style={{ color: "#666", fontStyle: "italic" }}>
                  No available times for selected date
                </p>
              ) : (
                <p style={{ color: "#999", fontStyle: "italic" }}>
                  Select counselor and date to see available times
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !selectedCounselor || !selectedDate || !selectedTime}
              style={{
                width: "100%",
                padding: "16px",
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
          </form>
        )}
      </main>
    </div>
  );
}