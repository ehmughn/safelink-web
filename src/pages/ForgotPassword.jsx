import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
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
    <>
      {/* Custom CSS for maintaining original design and hover effects */}
      <style>
        {`
          .forgot-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          }
          
          .forgot-header-custom {
            padding: 1.5rem 0;
            background: white;
            border-bottom: 1px solid #e9ecef;
            text-align: center;
          }
          
          .forgot-tagline {
            color: #6c757d;
            font-size: 0.875rem;
            margin: 0.5rem 0 0 0;
          }
          
          .forgot-main {
            max-width: 400px;
            margin: 2rem auto;
            padding: 2rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            position: relative;
          }
          
          .forgot-back-btn {
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
          
          .forgot-back-btn:hover:not(:disabled) {
            background-color: #f8f9fa;
            color: #FF5A1F;
            transform: translateX(-2px);
          }
          
          .forgot-back-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          
          .forgot-title {
            text-align: center;
            margin: 2rem 0 1.5rem 0;
            font-size: 1.75rem;
            font-weight: 600;
            color: #1a1a1a;
          }
          
          .forgot-input-group {
            margin-bottom: 1.25rem;
          }
          
          .forgot-label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #374151;
            font-size: 0.875rem;
          }
          
          .forgot-input {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.3s ease;
            background-color: #fafafa;
          }
          
          .forgot-input:focus {
            outline: none;
            border-color: #FF5A1F;
            background-color: white;
            box-shadow: 0 0 0 3px rgba(255, 90, 31, 0.1);
          }
          
          .forgot-input.is-invalid {
            border-color: #dc3545;
            background-color: #fdf2f2;
          }
          
          .forgot-error-text {
            color: #dc3545;
            font-size: 0.75rem;
            margin-top: 0.25rem;
            display: block;
          }
          
          .forgot-error-alert {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 0.75rem;
            border-radius: 6px;
            margin: 1rem 0;
            font-size: 0.875rem;
          }
          
          .forgot-success-alert {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 0.75rem;
            border-radius: 6px;
            margin: 1rem 0;
            font-size: 0.875rem;
          }
          
          /* Custom Bootstrap button styling */
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
          
          .btn-safelink:active {
            background: linear-gradient(135deg, #c82333 0%, #a71e2a 100%);
            border-color: #c82333;
            color: white;
          }
          
          .btn-safelink:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
          }
          
          .forgot-spinner {
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          
          .forgot-footer {
            text-align: center;
            padding: 2rem 0;
            background: white;
            border-top: 1px solid #e9ecef;
            margin-top: auto;
          }
          
          .forgot-footer a {
            color: #6c757d;
            text-decoration: none;
            margin: 0 1rem;
            font-size: 0.875rem;
            transition: color 0.3s ease;
          }
          
          .forgot-footer a:hover {
            color: #FF5A1F;
            text-decoration: none;
          }
          
          .forgot-skip-link {
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
          
          .forgot-skip-link:focus {
            top: 6px;
            color: white;
            text-decoration: none;
          }
          
          @media (max-width: 768px) {
            .forgot-main {
              margin: 1rem;
              padding: 1.5rem;
            }
            
            .forgot-title {
              font-size: 1.5rem;
            }
          }
          
          @media (max-width: 576px) {
            .forgot-main {
              margin: 0.5rem;
              padding: 1rem;
            }
            
            .forgot-back-btn {
              top: 0.5rem;
              left: 0.5rem;
            }
            
            .forgot-title {
              margin-top: 2.5rem;
            }
          }
        `}
      </style>

      <div className="forgot-container d-flex flex-column">
        <a href="#main-content" className="forgot-skip-link">
          Skip to content
        </a>

        <header className="forgot-header-custom">
          <div className="container text-center">
            <BrandLogo safe="#1A1A1A" link="#FF5A1F" />
            <p className="forgot-tagline">Your Family Safety Dashboard</p>
          </div>
        </header>

        <main
          id="main-content"
          className="flex-grow-1 d-flex align-items-center"
        >
          <div className="container">
            <div className="forgot-main mx-auto">
              <button
                className="forgot-back-btn btn"
                onClick={goBack}
                aria-label="Back to Login"
                disabled={loading}
              >
                ←
              </button>

              <h1 className="forgot-title">Forgot Password</h1>

              <form onSubmit={handleSubmit}>
                <div className="forgot-input-group">
                  <label htmlFor="forgot-email" className="forgot-label">
                    Email Address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    className={`forgot-input form-control ${
                      emailError ? "is-invalid" : ""
                    }`}
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
                      className="forgot-error-text"
                      role="alert"
                    >
                      {emailError}
                    </span>
                  )}
                </div>

                {error && (
                  <div className="forgot-error-alert alert" role="alert">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="forgot-success-alert alert" role="status">
                    {message}
                  </div>
                )}

                <button
                  className="btn btn-safelink btn-lg w-100"
                  type="submit"
                  aria-label="Send Reset Email"
                  disabled={loading || !email || !!emailError}
                >
                  {loading ? (
                    <>
                      <Loader2 className="forgot-spinner me-2" size={20} />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Email"
                  )}
                </button>
              </form>
            </div>
          </div>
        </main>

        <footer className="forgot-footer">
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

export default ForgotPassword;
