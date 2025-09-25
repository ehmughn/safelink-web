import { auth, googleProvider } from "../config/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import BrandLogo from "../components/BrandLogo";
import AlertIcon from "../assets/alert-icon.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    if (!value) {
      setEmailError("Email is required.");
    } else if (!validateEmail(value)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (!value) {
      setPasswordError("Password is required.");
    } else {
      setPasswordError("");
    }
  };

  const logIn = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email || !password) {
      setError("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }
    if (emailError || passwordError) {
      setError("Please correct the errors in the form.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (!result.user.emailVerified) {
        setError("Please verify your email before logging in.");
        setIsLoading(false);
        return;
      }
      const authInfo = {
        userId: result.user.uid,
        name: result.user.displayName,
        email: result.user.email,
        profilePhoto: result.user.photoURL,
        isAuth: true,
      };
      localStorage.setItem("auth", JSON.stringify(authInfo));
      navigate("/");
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
    } finally {
      setIsLoading(false);
    }
  };

  const logInWithGoogle = async () => {
    setError("");
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      let firstName = "";
      let lastName = "";
      if (user.displayName) {
        const nameParts = user.displayName.split(" ");
        firstName = nameParts[0] || "";
        lastName = nameParts.slice(1).join(" ") || "";
      }
      const authInfo = {
        userId: user.uid,
        email: user.email,
        phoneNumber: user.phoneNumber || "",
        createdAt:
          user.metadata?.creationTime ||
          new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }),
        profile: {
          address: "",
          birthdate: "",
          firstName: firstName,
          lastName: lastName,
          role: "family_member",
        },
        profilePhoto: user.photoURL || "",
        isAuth: true,
      };
      localStorage.setItem("auth", JSON.stringify(authInfo));

      // Only setDoc if user does not exist in Firestore
      try {
        const { doc, getDoc, setDoc } = await import("firebase/firestore");
        const { db } = await import("../config/firebase");
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, authInfo);
        }
      } catch (firestoreError) {
        // Optionally handle Firestore error
        console.error("Firestore error:", firestoreError);
      }

      navigate("/");
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user") {
        setError("Google login was cancelled.");
      } else {
        setError("Failed to log in with Google. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createAccount = () => {
    navigate("/create-account");
  };

  const goBack = () => {
    navigate("/");
  };

  const goToForgotPassword = () => {
    navigate("/forgot-password");
  };

  const handleKeyDown = (e, action) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="login-root">
      <a href="#main-content" className="login-skip-link">
        Skip to content
      </a>
      <header className="login-header">
        <BrandLogo safe="#1A1A1A" link="#E63946" />
        <p className="login-tagline">Your Family Safety Dashboard</p>
      </header>
      <main id="main-content" className="login-div">
        <button
          className="login-back-btn"
          onClick={goBack}
          aria-label="Back to Home"
          disabled={isLoading}
        >
          ←
        </button>
        <h1 className="login-title">Log in</h1>
        <form className="login-form" onSubmit={logIn}>
          <div className="login-input-div">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onFocus={() => setError("")}
              aria-required="true"
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "email-error" : undefined}
            />
            {emailError && (
              <span id="email-error" className="login-input-error" role="alert">
                {emailError}
              </span>
            )}
          </div>
          <div className="login-input-div">
            <label htmlFor="password">Password</label>
            <div className="login-password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onFocus={() => setError("")}
                aria-required="true"
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? "password-error" : undefined}
              />
              <button
                type="button"
                className="login-toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={0}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {passwordError && (
              <span
                id="password-error"
                className="login-input-error"
                role="alert"
              >
                {passwordError}
              </span>
            )}
          </div>
          <div className="login-options-row">
            <label className="login-remember">
              <input type="checkbox" aria-label="Remember me" /> Remember me
            </label>
            <span
              className="login-forgot"
              role="button"
              tabIndex={0}
              onClick={goToForgotPassword}
              onKeyDown={(e) => handleKeyDown(e, goToForgotPassword)}
              aria-label="Forgot password"
            >
              Forgot password?
            </span>
          </div>
          {error && (
            <div className="login-error" role="alert">
              <img
                src={AlertIcon}
                alt="Error icon"
                className="login-error-icon"
                width="16"
                height="16"
              />
              {error}
            </div>
          )}
          <button
            className="login-btn"
            type="submit"
            aria-label="Sign In"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>
        </form>
        <div className="login-divider">
          <span>or Log in with</span>
        </div>
        <button
          className="login-google-btn"
          onClick={logInWithGoogle}
          aria-label="Sign in with Google"
          disabled={isLoading}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google logo"
            className="login-google-icon"
            width="20"
            height="20"
          />
          {isLoading ? "Loading..." : "Google Account"}
        </button>
        <div className="login-bottom">
          Don't have an account?{" "}
          <span
            className="login-create-link"
            onClick={createAccount}
            onKeyDown={(e) => handleKeyDown(e, createAccount)}
            role="button"
            tabIndex={0}
            aria-label="Create Account"
          >
            Create Account
          </span>
        </div>
      </main>
      <footer className="login-footer">
        <a href="/help">Need Help?</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
      </footer>
    </div>
  );
};

export default Login;
