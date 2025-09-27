import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import AdminPage from "./pages/AdminPage";
import CounselorPage from "./pages/CounselorPage";
import BookingPage from "./pages/BookingPage";
import ArticlesPage from "./pages/ArticlesPage";
import { supabase } from "./supabaseClient";

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch role for logged-in user
  const fetchUserRole = async (user) => {
    try {
      console.log("Fetching role for user:", user.id, user.email);

      // Admin emails list (fallback for initial setup)
      const adminEmails = ['uniaccno1@gmail.com'];
      
      if (adminEmails.includes(user.email)) {
        console.log("User found in admin list, setting role to admin");
        setRole("admin");
        setLoading(false);
        return;
      }

      // Query database for user role
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Database error:", error.message);
        // If user doesn't exist in users table, create them
        if (error.code === 'PGRST116') {
          await createUserProfile(user);
          setRole("student"); // Default role
        } else {
          setRole("student"); // Fallback
        }
      } else {
        setRole(data.role);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Unexpected error fetching role:", err.message);
      setRole("student");
      setLoading(false);
    }
  };

  // Create user profile if doesn't exist
  const createUserProfile = async (user) => {
    try {
      const { error } = await supabase
        .from("users")
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email.split('@')[0],
          role: "student"
        });
      
      if (error) {
        console.error("Error creating user profile:", error);
      }
    } catch (err) {
      console.error("Error in createUserProfile:", err);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }

        if (!mounted) return;

        if (data?.session) {
          setSession(data.session);
          await fetchUserRole(data.session.user);
        } else if (localStorage.getItem("hinahon_guest") === "true") {
          setSession({ user: { email: "guest" }, isGuest: true });
          setRole("guest");
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error in initializeAuth:", err);
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        
        console.log("Auth state changed:", event);

        if (event === 'SIGNED_IN' && newSession?.user) {
          setSession(newSession);
          setLoading(true);
          localStorage.removeItem("hinahon_guest");
          await fetchUserRole(newSession.user);
        } else if (event === 'SIGNED_OUT' || !newSession) {
          if (localStorage.getItem("hinahon_guest") === "true") {
            setSession({ user: { email: "guest" }, isGuest: true });
            setRole("guest");
          } else {
            setSession(null);
            setRole(null);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Poppins, sans-serif'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route
          path="/"
          element={
            !session ? (
              <LoginPage setSession={setSession} />
            ) : role === "admin" ? (
              <Navigate to="/admin" replace />
            ) : role === "counselor" ? (
              <Navigate to="/counselor" replace />
            ) : (
              <Navigate to="/landing" replace />
            )
          }
        />

        {/* Landing (students + guests) */}
        <Route
          path="/landing"
          element={
            session && (role === "student" || role === "guest") ? (
              <LandingPage session={session} setSession={setSession} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Admin page */}
        <Route
          path="/admin"
          element={
            session && role === "admin" ? (
              <AdminPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Counselor page */}
        <Route
          path="/counselor"
          element={
            session && role === "counselor" ? (
              <CounselorPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Booking page */}
        <Route
          path="/booking/:emotion?"
          element={
            session && (role === "student" || role === "guest") ? (
              <BookingPage session={session} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Articles page */}
        <Route
          path="/articles/:emotion?"
          element={
            <ArticlesPage session={session} />
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}