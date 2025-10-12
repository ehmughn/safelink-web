import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider, db } from "../config/firebase";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import BrandLogo from "../components/BrandLogo";
import AlertIcon from "../assets/alert-icon.png";
import { Eye, EyeOff } from "lucide-react";

const CreateAccount = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePasswordComplexity = (password) => {
    return (
      /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password)
    );
  };

  const validateForm = () => {
    const errors = {};
    if (!email) errors.email = "Email is required.";
    else if (!validateEmail(email))
      errors.email = "Please enter a valid email address.";
    if (!password) errors.password = "Password is required.";
    else if (password.length < 6)
      errors.password = "Password must be at least 6 characters.";
    else if (!validatePasswordComplexity(password))
      errors.password =
        "Password must contain at least 1 lowercase letter, 1 uppercase letter, and 1 number.";
    if (!confirmPassword)
      errors.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword)
      errors.confirmPassword = "Passwords do not match.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value, setter) => {
    setter(value);
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    setError("");
    setSuccessMessage("");
  };

  const createAccount = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    if (!validateForm()) {
      setError("Please correct the errors in the form.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const authInfo = {
        userId: result.user.uid,
        email: email,
        phoneNumber: "",
        createdAt: new Date().toLocaleString("en-US", {
          timeZone: "Asia/Manila",
        }),
        displayName: "",
        profile: {
          administrativeLocation: {
            region: "",
            province: "",
            municipality: "",
            barangay: "",
          },
          birthdate: "",
          firstName: "",
          lastName: "",
          isVerifiedOfficial: false,
          isAdmin: false,
        },
        profilePhoto: "",
        isAuth: true,
        emailVerified: true,
      };

      await setDoc(doc(db, "users", result.user.uid), authInfo);

      setSuccessMessage(
        "Account created successfully! Redirecting to complete your profile..."
      );
      setTimeout(() => {
        navigate("/complete-profile");
      }, 1500);
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak.");
      } else {
        setError("Failed to create account. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const createAccountWithGoogle = async () => {
    setError("");
    setSuccessMessage("");
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
        phoneNumber: "",
        createdAt:
          user.metadata?.creationTime ||
          new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }),
        displayName: user.displayName || "",
        profile: {
          administrativeLocation: {
            region: "",
            province: "",
            municipality: "",
            barangay: "",
          },
          birthdate: "",
          firstName: firstName,
          lastName: lastName,
          isVerifiedOfficial: false,
          isAdmin: false,
        },
        profilePhoto: user.photoURL || "",
        isAuth: true,
        emailVerified: true,
      };

      try {
        const { doc, getDoc, setDoc } = await import("firebase/firestore");
        const { db } = await import("../config/firebase");
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, authInfo);
        }
      } catch (firestoreError) {
        console.error("Firestore error:", firestoreError);
      }

      setSuccessMessage(
        "Account created successfully! Redirecting to complete your profile..."
      );
      setTimeout(() => {
        navigate("/complete-profile");
      }, 1500);
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user") {
        setError("Google sign-up was cancelled.");
      } else if (error.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else {
        setError("Failed to sign up with Google. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const logIn = () => {
    navigate("/login");
  };

  const goBack = () => {
    navigate("/");
  };

  const handleKeyDown = (e, action) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  return (
    <>
      <style>
        {`
          .create-root {
            min-height: 100vh;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            display: flex;
            flex-direction: column;
          }
          
          .create-header {
            padding: 1.5rem 0;
            background: white;
            border-bottom: 1px solid #e9ecef;
            text-align: center;
          }
          
          .create-tagline {
            color: #6c757d;
            font-size: 0.875rem;
            margin: 0.5rem 0 0 0;
          }
          
          .create-div {
            max-width: 500px;
            margin: 2rem auto;
            padding: 2rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            position: relative;
            flex: 1;
          }
          
          .create-back-btn {
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
          
          .create-back-btn:hover:not(:disabled) {
            background-color: #f8f9fa;
            color: #FF5A1F;
            transform: translateX(-2px);
          }
          
          .create-back-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          
          .create-title {
            text-align: center;
            margin: 2rem 0 0.5rem 0;
            font-size: 1.75rem;
            font-weight: 600;
            color: #1a1a1a;
          }
          
          .create-desc {
            text-align: center;
            color: #6c757d;
            margin-bottom: 2rem;
            font-size: 0.95rem;
          }
          
          .create-success {
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 1rem;
            border-radius: 8px;
            margin: 1.5rem 0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: 500;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          
          .create-success-icon {
            background: #28a745;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: bold;
            flex-shrink: 0;
          }
          
          .create-form-grid {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
            margin-bottom: 1.5rem;
          }
          
          .create-input-div {
            display: flex;
            flex-direction: column;
          }
          
          .create-input-div label {
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #374151;
            font-size: 0.875rem;
          }
          
          .create-input-div input {
            padding: 0.75rem 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.3s ease;
            background-color: #fafafa;
            width: 100%;
          }
          
          .create-input-div input:focus {
            outline: none;
            border-color: #FF5A1F;
            background-color: white;
            box-shadow: 0 0 0 3px rgba(255, 90, 31, 0.1);
          }
          
          .create-input-div input.is-invalid {
            border-color: #dc3545;
            background-color: #fdf2f2;
          }
          
          .create-password-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }
          
          .create-toggle-password {
            position: absolute;
            right: 0.75rem;
            background: none;
            border: none;
            color: #6c757d;
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 4px;
            transition: color 0.3s ease;
            display: flex;
            align-items: center;
          }
          
          .create-toggle-password:hover {
            color: #FF5A1F;
          }
          
          .create-input-error {
            color: #dc3545;
            font-size: 0.75rem;
            margin-top: 0.25rem;
            display: block;
          }
          
          .create-error {
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
          
          .create-error-icon {
            flex-shrink: 0;
          }
          
          .btn-safelink {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            border: 2px solid #FF5A1F;
            color: white;
            font-weight: 600;
            transition: all 0.3s ease;
          }
          
          .btn-safelink:hover:not(:disabled) {
            background: linear-gradient(135deg, #E63946 0%, #c82333 100%);
            border-color: #E63946;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 90, 31, 0.3);
          }
          
          .btn-safelink:focus {
            background: linear-gradient(135deg, #E63946 0%, #c82333 100%);
            border-color: #E63946;
            color: white;
            box-shadow: 0 0 0 0.25rem rgba(255, 90, 31, 0.25);
          }
          
          .btn-safelink:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
          }
          
          .create-divider {
            text-align: center;
            margin: 1.5rem 0;
            position: relative;
            color: #6c757d;
            font-size: 0.875rem;
          }
          
          .create-divider::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            background: #e9ecef;
            z-index: 1;
          }
          
          .create-divider span {
            background: white;
            padding: 0 1rem;
            position: relative;
            z-index: 2;
          }
          
          .create-google-btn {
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
            margin-bottom: 1.5rem;
          }
          
          .create-google-btn:hover:not(:disabled) {
            border-color: #d1d5db;
            background-color: #f9fafb;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
          .create-google-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          
          .create-google-icon {
            flex-shrink: 0;
          }
          
          .create-bottom {
            text-align: center;
            color: #6c757d;
            font-size: 0.875rem;
            margin-top: 1.5rem;
          }
          
          .create-login-link {
            color: #FF5A1F;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
            text-decoration: none;
          }
          
          .create-login-link:hover {
            color: #E63946;
            text-decoration: underline;
          }
          
          .create-footer {
            text-align: center;
            padding: 2rem 0;
            background: white;
            border-top: 1px solid #e9ecef;
            margin-top: auto;
          }
          
          .create-footer a {
            color: #6c757d;
            text-decoration: none;
            margin: 0 1rem;
            font-size: 0.875rem;
            transition: color 0.3s ease;
          }
          
          .create-footer a:hover {
            color: #FF5A1F;
            text-decoration: none;
          }
          
          .create-skip-link {
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
          
          .create-skip-link:focus {
            top: 6px;
            color: white;
            text-decoration: none;
          }
          
          @media (max-width: 768px) {
            .create-div {
              margin: 1rem;
              padding: 1.5rem;
            }
            
            .create-title {
              font-size: 1.5rem;
            }
          }
          
          @media (max-width: 576px) {
            .create-div {
              margin: 0.5rem;
              padding: 1rem;
            }
            
            .create-back-btn {
              top: 0.5rem;
              left: 0.5rem;
            }
            
            .create-title {
              margin-top: 2.5rem;
            }
          }
        `}
      </style>

      <div className="create-root">
        <a href="#main-content" className="create-skip-link">
          Skip to content
        </a>

        <header className="create-header">
          <div className="container text-center">
            <BrandLogo safe="#1A1A1A" link="#FF5A1F" />
            <p className="create-tagline">Your Family Safety Dashboard</p>
          </div>
        </header>

        <main
          id="main-content"
          className="flex-grow-1 d-flex align-items-center"
        >
          <div className="container">
            <div className="create-div mx-auto">
              <button
                className="create-back-btn btn"
                onClick={goBack}
                aria-label="Back to Home"
                disabled={isLoading}
              >
                ←
              </button>

              <h1 className="create-title">Create Account</h1>
              <p className="create-desc">
                Join SafeLink to protect your family
              </p>

              {successMessage && (
                <div className="create-success alert" role="alert">
                  <span className="create-success-icon">✔</span>
                  {successMessage}
                </div>
              )}

              {!successMessage && (
                <>
                  <form className="create-form" onSubmit={createAccount}>
                    <div className="create-form-grid">
                      <div className="create-input-div">
                        <label htmlFor="email" className="form-label">
                          Email Address
                        </label>
                        <input
                          id="email"
                          type="email"
                          className={`form-control ${
                            fieldErrors.email ? "is-invalid" : ""
                          }`}
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value, setEmail)
                          }
                          onFocus={() => {
                            setError("");
                            setSuccessMessage("");
                          }}
                          aria-required="true"
                          aria-invalid={!!fieldErrors.email}
                          aria-describedby={
                            fieldErrors.email ? "email-error" : undefined
                          }
                        />
                        {fieldErrors.email && (
                          <span
                            id="email-error"
                            className="create-input-error"
                            role="alert"
                          >
                            {fieldErrors.email}
                          </span>
                        )}
                      </div>

                      <div className="create-input-div">
                        <label htmlFor="password" className="form-label">
                          Password
                        </label>
                        <div className="create-password-wrapper">
                          <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            className={`form-control ${
                              fieldErrors.password ? "is-invalid" : ""
                            }`}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) =>
                              handleInputChange(
                                "password",
                                e.target.value,
                                setPassword
                              )
                            }
                            onFocus={() => {
                              setError("");
                              setSuccessMessage("");
                            }}
                            aria-required="true"
                            aria-invalid={!!fieldErrors.password}
                            aria-describedby={
                              fieldErrors.password
                                ? "password-error"
                                : undefined
                            }
                          />
                          <button
                            type="button"
                            className="create-toggle-password btn"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        </div>
                        {fieldErrors.password && (
                          <span
                            id="password-error"
                            className="create-input-error"
                            role="alert"
                          >
                            {fieldErrors.password}
                          </span>
                        )}
                      </div>

                      <div className="create-input-div">
                        <label
                          htmlFor="confirm-password"
                          className="form-label"
                        >
                          Confirm Password
                        </label>
                        <div className="create-password-wrapper">
                          <input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            className={`form-control ${
                              fieldErrors.confirmPassword ? "is-invalid" : ""
                            }`}
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) =>
                              handleInputChange(
                                "confirmPassword",
                                e.target.value,
                                setConfirmPassword
                              )
                            }
                            onFocus={() => {
                              setError("");
                              setSuccessMessage("");
                            }}
                            aria-required="true"
                            aria-invalid={!!fieldErrors.confirmPassword}
                            aria-describedby={
                              fieldErrors.confirmPassword
                                ? "confirm-password-error"
                                : undefined
                            }
                          />
                          <button
                            type="button"
                            className="create-toggle-password btn"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            aria-label={
                              showConfirmPassword
                                ? "Hide confirm password"
                                : "Show confirm password"
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        </div>
                        {fieldErrors.confirmPassword && (
                          <span
                            id="confirm-password-error"
                            className="create-input-error"
                            role="alert"
                          >
                            {fieldErrors.confirmPassword}
                          </span>
                        )}
                      </div>
                    </div>

                    {error && (
                      <div className="create-error alert" role="alert">
                        <img
                          src={AlertIcon}
                          alt="Error icon"
                          className="create-error-icon"
                          width="16"
                          height="16"
                        />
                        {error}
                      </div>
                    )}

                    <button
                      className="btn btn-safelink btn-lg w-100"
                      type="submit"
                      aria-label="Create Account"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Creating Account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </button>
                  </form>

                  <div className="create-divider">
                    <span>or Create Account with</span>
                  </div>

                  <button
                    className="create-google-btn btn"
                    onClick={createAccountWithGoogle}
                    aria-label="Sign up with Google"
                    disabled={isLoading}
                  >
                    <img
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      alt="Google logo"
                      className="create-google-icon"
                      width="24"
                      height="24"
                    />
                    {isLoading ? "Loading..." : "Google Account"}
                  </button>
                </>
              )}

              <div className="create-bottom">
                Already have an account?{" "}
                <span
                  className="create-login-link"
                  onClick={logIn}
                  onKeyDown={(e) => handleKeyDown(e, logIn)}
                  role="button"
                  tabIndex={0}
                  aria-label="Sign In"
                >
                  Log in
                </span>
              </div>
            </div>
          </div>
        </main>

        <footer className="create-footer">
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

export default CreateAccount;
