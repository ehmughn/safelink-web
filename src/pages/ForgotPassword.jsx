import { useState } from "react";
import { auth } from "../config/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import "../styles/ForgotPassword.css";
import BrandLogo from "../components/BrandLogo";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Please check your inbox.");
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Back navigation
  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="forgot-root">
      <button
        className="forgot-back-btn"
        onClick={goBack}
        aria-label="Back"
        style={{ position: "absolute", top: "2rem", left: "2rem" }}
      >
        ←
      </button>
      <header className="forgot-header">
        <BrandLogo safe="#1A1A1A" link="#FF5A1F" />
        <p className="forgot-title">Forgot Password</p>
      </header>
      <form className="forgot-form" onSubmit={handleSubmit}>
        <label htmlFor="forgot-email">Email Address</label>
        <input
          id="forgot-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {error && (
          <div className="forgot-error" role="alert">
            {error}
          </div>
        )}
        {message && <div className="forgot-success">{message}</div>}
        <button
          className="forgot-btn"
          type="submit"
          disabled={loading || !email}
        >
          {loading ? "Sending..." : "Send Reset Email"}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
