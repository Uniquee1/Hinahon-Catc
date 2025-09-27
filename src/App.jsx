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
  const [isRoleFetched, setIsRoleFetched] = useState(false); // Add this flag

  // Fetch role for logged-in user - CLEAN VERSION
  const fetchUserRole = async (user) => {
    // Prevent duplicate calls
    if (isRoleFetched) {
      console.log("Role already fetched, skipping...");
      return;
    }

    try {
      console.log("Fetching role for user:", user.email);
      setIsRoleFetched(true); // Mark as fetching
      
      const adminEmails = ['uniaccno1@gmail.com'];
      
      // Check if hardcoded admin first
      if (adminEmails.includes(user.email)) {
        console.log("User is hardcoded admin");
        setRole("admin");
        setLoading(false);
        return;
      }

      // For non-hardcoded users, query database
      try {
        console.log("Querying database for role...");
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 4000)
        );

        const queryPromise = supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

        if (error) {
          if (error.code === 'PGRST116') {
            console.log("User not found, creating profile...");
            await createUserProfile(user);
            setRole("student");
          } else {
            throw error;
          }
        } else {
          console.log("Database returned role:", data.role);
          setRole(data.role);
        }

      } catch (queryError) {
        console.log("Database query failed:", queryError.message);
        setRole("student");
      }
      
      setLoading(false);
      
    } catch (err) {
      console.error("Critical error in fetchUserRole:", err);
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
      } else {
        console.log("User profile created successfully");
      }
    } catch (err) {
      console.error("Error in createUserProfile:", err);
    }
  };

  useEffect(() => {
  let mounted = true;
  let authListenerActive = false;

  const initializeAuth = async () => {
    try {
      // Check for guest session first (before Supabase auth)
      if (localStorage.getItem("hinahon_guest") === "true") {
        console.log("Found guest session in localStorage");
        if (mounted) {
          setSession({ user: { email: "guest" }, isGuest: true });
          setRole("guest");
          setLoading(false);
        }
        return; // Exit early for guests
      }

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
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Error in initializeAuth:", err);
      setLoading(false);
    }
  };

  initializeAuth();

  // Only set up auth listener for non-guest sessions
  let authListener = null;
  
  if (localStorage.getItem("hinahon_guest") !== "true") {
    authListenerActive = true;
    
    const { data } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted || !authListenerActive) return;
        
        console.log("Auth state changed:", event);

        // Ignore auth changes if we're in guest mode
        if (localStorage.getItem("hinahon_guest") === "true") {
          console.log("Ignoring auth change - in guest mode");
          return;
        }

        if (event === 'SIGNED_IN' && newSession?.user) {
          setSession(newSession);
          setLoading(true);
          await fetchUserRole(newSession.user);
        } else if (event === 'SIGNED_OUT' || !newSession) {
          setSession(null);
          setRole(null);
          setLoading(false);
        }
      }
    );
    
    authListener = data;
  }

  return () => {
    mounted = false;
    authListenerActive = false;
    authListener?.subscription?.unsubscribe();
  };
}, []); // Remove all dependencies to prevent re-runs

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

        {/* Booking page - ONLY for signed-in students (NOT guests) */}
        <Route
          path="/booking/:emotion?"
          element={
            session && role === "student" ? (
              <BookingPage session={session} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Articles page - Available to everyone including guests */}
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