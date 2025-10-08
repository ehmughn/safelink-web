import { auth, googleProvider } from "../config/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
      // if (!result.user.emailVerified) {
      //   setError("Please verify your email before logging in.");
      //   setIsLoading(false);
      //   return;
      // }
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
    <>
      {/* Custom CSS for maintaining original design and hover effects */}
      <style>
        {`
          .login-container {
            padding-top: 1rem;
          }
          .login-tagline {
            color: #6c757d;
            font-size: 0.875rem;
            margin: 0.5rem 0 0 0;
          }
          .login-main {
            max-width: 400px;
            margin: 2rem auto;
            padding: 2rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            position: relative;
          }
          .login-back-btn {
            position: absolute;
            top: 1rem;
            left: 1rem;
            background: none;
            border: none;
            font-size: 1.5rem;
            color: #6c757d;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
          }
          .login-back-btn:hover {
            background-color: #f8f9fa;
            color: #E63946;
            transform: translateX(-2px);
          }
          .login-title {
            text-align: center;
            margin: 2rem 0 1.5rem 0;
            font-size: 1.75rem;
            font-weight: 600;
            color: #1a1a1a;
          }
          .login-input-group {
            margin-bottom: 1.25rem;
          }
          .login-label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #374151;
            font-size: 0.875rem;
          }
          .login-input {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.3s ease;
            background-color: #fafafa;
          }
          .login-input:focus {
            outline: none;
            border-color: #E63946;
            background-color: white;
            box-shadow: 0 0 0 3px rgba(230, 57, 70, 0.1);
          }
          .login-input.is-invalid {
            border-color: #dc3545;
            background-color: #fdf2f2;
          }
          .login-password-wrapper {
            position: relative;
          }
          .login-toggle-password {
            position: absolute;
            right: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #6c757d;
            cursor: pointer;
            padding: 0.25rem;
            transition: color 0.3s ease;
          }
          .login-toggle-password:hover {
            color: #E63946;
          }
          .login-error-text {
            color: #dc3545;
            font-size: 0.75rem;
            margin-top: 0.25rem;
            display: block;
          }
          .login-options {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 1rem 0;
            font-size: 0.875rem;
          }
          .login-remember {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #6c757d;
            cursor: pointer;
          }
          .login-forgot {
            color: #E63946;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.3s ease;
          }
          .login-forgot:hover {
            color: #c82333;
            text-decoration: underline;
          }
          .login-error-alert {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 0.75rem;
            border-radius: 6px;
            margin: 1rem 0;
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .login-btn-primary {
            width: 100%;
            background-color: #FF5A1F;
            border: 2px solid #FF5A1F;
            color: white;
            padding: 0.875rem 1.5rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 1rem 0;
          }
          .login-btn-primary:hover:not(:disabled) {
            background-color: #FF5A1F;
            border-color: #FF5A1F;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 90, 31, 0.3);
          }
          .login-btn-primary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          .login-divider {
            text-align: center;
            margin: 1.5rem 0;
            position: relative;
            color: #6c757d;
            font-size: 0.875rem;
          }
          .login-divider::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            background: #e9ecef;
            z-index: 1;
          }
          .login-divider span {
            background: white;
            padding: 0 1rem;
            position: relative;
            z-index: 2;
          }
          .login-google-btn {
            width: 100%;
            background: white;
            border: 2px solid #e5e7eb;
            color: #374151;
            padding: 0.875rem 1.5rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
          }
          .login-google-btn:hover:not(:disabled) {
            background-color: #f8f9fa;
            border-color: #6c757d;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .login-google-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          .login-bottom {
            text-align: center;
            margin-top: 1.5rem;
            color: #6c757d;
            font-size: 0.875rem;
          }
          .login-create-link {
            color: #FF5A1F;
            cursor: pointer;
            font-weight: 500;
            transition: color 0.3s ease;
          }
          .login-create-link:hover {
            color: #FF5A1F;
            text-decoration: underline;
          }
          .login-footer {
            text-align: center;
            padding: 2rem 0;
            background: white;
            border-top: 1px solid #e9ecef;
            margin-top: auto;
          }
          .login-footer a {
            color: #6c757d;
            text-decoration: none;
            margin: 0 1rem;
            font-size: 0.875rem;
            transition: color 0.3s ease;
          }
          .login-footer a:hover {
            color: #FF5A1F;
          }
          .login-skip-link {
            position: absolute;
            top: -40px;
            left: 6px;
            background: #FF5A1F;
            color: white;
            padding: 8px;
            text-decoration: none;
            border-radius: 4px;
            z-index: 1000;
            transition: top 0.3s ease;
          }
          .login-skip-link:focus {
            top: 6px;
          }
        `}
      </style>

      <div className="login-container d-flex flex-column">
        <a href="#main-content" className="login-skip-link">
          Skip to content
        </a>

        <header className="login-container">
          <div className="container text-center">
            <BrandLogo safe="#1A1A1A" link="#E63946" />
            <p className="login-tagline">Your Family Safety Dashboard</p>
          </div>
        </header>

        <main
          id="main-content"
          className="flex-grow-1 d-flex align-items-center"
        >
          <div className="container">
            <div className="login-main mx-auto">
              <button
                className="login-back-btn"
                onClick={goBack}
                aria-label="Back to Home"
                disabled={isLoading}
              >
                ←
              </button>

              <h1 className="login-title">Log in</h1>

              <form onSubmit={logIn}>
                <div className="login-input-group">
                  <label htmlFor="email" className="login-label">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`login-input ${emailError ? "is-invalid" : ""}`}
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onFocus={() => setError("")}
                    aria-required="true"
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "email-error" : undefined}
                  />
                  {emailError && (
                    <span
                      id="email-error"
                      className="login-error-text"
                      role="alert"
                    >
                      {emailError}
                    </span>
                  )}
                </div>

                <div className="login-input-group">
                  <label htmlFor="password" className="login-label">
                    Password
                  </label>
                  <div className="login-password-wrapper">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className={`login-input ${
                        passwordError ? "is-invalid" : ""
                      }`}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      onFocus={() => setError("")}
                      aria-required="true"
                      aria-invalid={!!passwordError}
                      aria-describedby={
                        passwordError ? "password-error" : undefined
                      }
                    />
                    <button
                      type="button"
                      className="login-toggle-password"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      tabIndex={0}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {passwordError && (
                    <span
                      id="password-error"
                      className="login-error-text"
                      role="alert"
                    >
                      {passwordError}
                    </span>
                  )}
                </div>

                <div className="login-options">
                  <label className="login-remember">
                    <input type="checkbox" aria-label="Remember me" />
                    Remember me
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
                  <div className="login-error-alert" role="alert">
                    <img
                      src={AlertIcon}
                      alt="Error icon"
                      width="16"
                      height="16"
                    />
                    {error}
                  </div>
                )}

                <button
                  className="login-btn-primary"
                  type="submit"
                  aria-label="Sign In"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Logging in...
                    </>
                  ) : (
                    "Log in"
                  )}
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
                  width="20"
                  height="20"
                />
                {isLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Loading...
                  </>
                ) : (
                  "Google Account"
                )}
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
            </div>
          </div>
        </main>

        <footer className="login-footer">
          <div className="container">
            <a href="/help">Need Help?</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Login;
