import { useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";
import "../styles/VerifyEmail.css";
import BrandLogo from "../components/BrandLogo";

const VerifyEmail = () => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate("/login");
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleKeyDown = (e, action) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="verify-root">
      <a href="#main-content" className="verify-skip-link">
        Skip to content
      </a>
      <header className="verify-header">
        <BrandLogo safe="#1A1A1A" link="#E63946" />
        <p className="verify-tagline">Your Family Safety Dashboard</p>
      </header>
      <main id="main-content" className="verify-div">
        <button
          className="verify-back-btn"
          onClick={() => navigate("/")}
          aria-label="Back to Home"
        >
          ←
        </button>
        <h1 className="verify-title">Verify Your Email</h1>
        <p className="verify-desc">
          A verification email has been sent to your email address. Please check
          your inbox (and spam/junk folder) and click the verification link to
          activate your account.
        </p>
        <div className="verify-success" role="alert">
          <span className="verify-success-icon">✔</span>
          Please verify your email to continue.
        </div>
        <button
          className="verify-btn"
          onClick={handleSignIn}
          aria-label="Go to Log in"
        >
          Sign In
        </button>
        <div className="verify-bottom">
          Not seeing the email?{" "}
          <span
            className="verify-signout-link"
            onClick={handleSignOut}
            onKeyDown={(e) => handleKeyDown(e, handleSignOut)}
            role="button"
            tabIndex={0}
            aria-label="Sign Out"
          >
            Sign Out and Try Again
          </span>
        </div>
      </main>
      <footer className="verify-footer">
        <a href="/help">Need Help?</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
      </footer>
    </div>
  );
};

export default VerifyEmail;
