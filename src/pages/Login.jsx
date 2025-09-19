import { auth, googleProvider } from "../config/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import BrandLogo from "../components/BrandLogo";
import AlertIcon from "../assets/alert-icon.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const logIn = async () => {
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const authInfo = {
        userId: result.user.uid,
        name: result.user.displayName,
        email: result.user.email,
        profilePhoto: result.user.photoURL,
        isAuth: true,
      };
      localStorage.setItem("auth", JSON.stringify(authInfo));
      navigate("/home");
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (error.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError("Failed to log in. Please try again.");
      }
      console.log(error);
    }
  };

  const logInWithGoogle = async () => {
    setError("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const authInfo = {
        userId: result.user.uid,
        name: result.user.displayName,
        profilePhoto: result.user.photoURL,
        isAuth: true,
      };
      localStorage.setItem("auth", JSON.stringify(authInfo));
      navigate("/home");
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user") {
        setError("Google login was cancelled.");
      } else {
        setError("Failed to log in with Google. Please try again.");
      }
    } finally {
    }
  };

  const createAccount = () => {
    navigate("../create-account");
  };

  const goBack = () => {
    navigate("../");
  };

  return (
    <div className="login-root">
      <header className="login-header">
        <BrandLogo safe="#1A1A1A" link="#FF5A1F" />
        <p className="login-tagline">Your Family Safety Dashboard</p>
      </header>
      <div className="login-div">
        <button
          className="login-back-btn"
          onClick={goBack}
          aria-label="Back to Home"
        >
          ←
        </button>
        <p className="login-title">Sign In</p>
        <form
          className="login-form"
          onSubmit={(e) => {
            e.preventDefault();
            logIn();
          }}
        >
          <div className="login-input-div">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setError("")}
              aria-required="true"
            />
          </div>
          <div className="login-input-div">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setError("")}
              aria-required="true"
            />
          </div>
          <div className="login-options-row">
            <label className="login-remember">
              <input type="checkbox" aria-label="Remember me" /> Remember me
            </label>
            <a className="login-forgot" href="#" aria-label="Forgot password">
              Forgot password?
            </a>
          </div>
          {error && (
            <div className="login-error" role="alert">
              <img src={AlertIcon} alt="" className="login-error-icon" />
              {error}
            </div>
          )}
          <button className="login-btn" type="submit" aria-label="Sign In">
            Sign In
          </button>
        </form>
        <div className="login-divider">
          <span>or Sign in with</span>
        </div>
        <button
          className="login-google-btn"
          onClick={logInWithGoogle}
          aria-label="Sign in with Google"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt=""
            className="login-google-icon"
          />
          Google Account
        </button>
        <div className="login-bottom">
          Don't have an account?{" "}
          <span
            className="login-create-link"
            onClick={createAccount}
            role="button"
            tabIndex="0"
          >
            Create Account
          </span>
        </div>
      </div>
      <footer className="login-footer">
        <a href="#">Need Help?</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
      </footer>
    </div>
  );
};

export default Login;
