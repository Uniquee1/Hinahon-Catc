import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles.css";

export default function LoginPage({ setSession }) {
  const navigate = useNavigate();

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }

  // 🔑 Helper: handle redirect depending on role
  async function handleRedirect(session) {
    if (!session?.user) return;

    const { data: profile, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (error) {
      console.error("Error fetching role:", error);
      navigate("/landing"); // fallback
      return;
    }

    if (profile?.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/landing");
    }
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (data?.session) {
        setSession(data.session);
        await handleRedirect(data.session); // ✅ Always check role first
        return;
      }

      if (localStorage.getItem("hinahon_guest") === "true") {
        setSession({ user: { email: "guest" }, isGuest: true });
        navigate("/landing");
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setSession(session);
          localStorage.removeItem("hinahon_guest");
          await handleRedirect(session); // ✅ Always check role first
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, setSession]);

  function continueAsGuest() {
    localStorage.setItem("hinahon_guest", "true");
    setSession({ user: { email: "guest" }, isGuest: true });
    navigate("/landing");
  }

  return (
    <div
      className="auth-hero"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="auth-card" role="region" aria-label="Sign in">
        <div className="card-header">
          <div className="logo-small">Hinahon</div>
          <div className="small-tag">A Mental Health Booking App</div>
        </div>

        <div className="login-form" style={{ marginTop: 6 }}>
          <button
            className="btn-google"
            onClick={signInWithGoogle}
            aria-label="Sign in with Google"
          >
            Continue with Google
          </button>
        </div>

        <div className="divider">or</div>

        <div style={{ textAlign: "center" }}>
          <button
            className="btn-primary"
            onClick={continueAsGuest}
            title="Continue as a guest"
          >
            Continue as Guest
          </button>
        </div>

        <div className="card-footer" style={{ marginTop: 12 }}>
          <a className="link-muted" href="#">
            Forgot Password?
          </a>
          <a className="link-muted" href="#">
            Help
          </a>
        </div>
      </div>
    </div>
  );
}
