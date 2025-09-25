import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import "../styles/ForgotPassword.css";
import BrandLogo from "../components/BrandLogo";
import { Loader2 } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailChange = (value) => {
    setEmail(value);
    if (!value) {
      setEmailError("Email is required.");
    } else if (!validateEmail(value)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
    setError("");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    if (!email) {
      setEmailError("Email is required.");
      setError("Please fill in the email field.");
      setLoading(false);
      return;
    }
    if (emailError) {
      setError("Please correct the email error.");
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Please check your inbox.");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
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

  const goBack = () => {
    navigate("/login");
  };

  return (
    <div className="forgot-root">
      <a href="#main-content" className="forgot-skip-link">
        Skip to content
      </a>
      <header className="forgot-header">
        <BrandLogo safe="#1A1A1A" link="#E63946" />
        <p className="forgot-tagline">Your Family Safety Dashboard</p>
      </header>
      <main id="main-content" className="forgot-form-container">
        <button
          className="forgot-back-btn"
          onClick={goBack}
          aria-label="Back to Login"
          disabled={loading}
        >
          ←
        </button>
        <form className="forgot-form" onSubmit={handleSubmit}>
          <h1 className="forgot-title">Forgot Password</h1>
          <div className="forgot-input-div">
            <label htmlFor="forgot-email">Email Address</label>
            <input
              id="forgot-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              aria-required="true"
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "email-error" : undefined}
            />
            {emailError && (
              <span
                id="email-error"
                className="forgot-input-error"
                role="alert"
              >
                {emailError}
              </span>
            )}
          </div>
          {error && (
            <div className="forgot-error" role="alert">
              {error}
            </div>
          )}
          {message && (
            <div className="forgot-success" role="status">
              {message}
            </div>
          )}
          <button
            className="forgot-btn"
            type="submit"
            aria-label="Send Reset Email"
            disabled={loading || !email || !!emailError}
          >
            {loading ? (
              <>
                <Loader2 className="forgot-spinner" size={20} />
                Sending...
              </>
            ) : (
              "Send Reset Email"
            )}
          </button>
        </form>
      </main>
      <footer className="forgot-footer">
        <a href="/help">Need Help?</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
      </footer>
    </div>
  );
};

export default ForgotPassword;
