import { useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";
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
    <>
      {/* Custom CSS for maintaining original design and hover effects */}
      <style>
        {`
          .verify-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          }
          
          .verify-header-custom {
            padding: 1.5rem 0;
            background: white;
            border-bottom: 1px solid #e9ecef;
            text-align: center;
          }
          
          .verify-tagline {
            color: #6c757d;
            font-size: 0.875rem;
            margin: 0.5rem 0 0 0;
          }
          
          .verify-main {
            max-width: 450px;
            margin: 2rem auto;
            padding: 2rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            position: relative;
          }
          
          .verify-back-btn {
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
          
          .verify-back-btn:hover {
            background-color: #f8f9fa;
            color: #FF5A1F;
            transform: translateX(-2px);
          }
          
          .verify-title {
            text-align: center;
            margin: 2rem 0 1.5rem 0;
            font-size: 1.75rem;
            font-weight: 600;
            color: #1a1a1a;
          }
          
          .verify-desc {
            text-align: center;
            color: #6c757d;
            line-height: 1.6;
            margin-bottom: 1.5rem;
            font-size: 0.95rem;
          }
          
          .verify-success {
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
          
          .verify-success-icon {
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
          
          /* Custom Bootstrap button styling */
          .btn-safelink {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            border: 2px solid #FF5A1F;
            color: white;
            font-weight: 600;
            transition: all 0.3s ease;
          }
          
          .btn-safelink:hover {
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
          
          .verify-bottom {
            text-align: center;
            color: #6c757d;
            font-size: 0.875rem;
            margin-top: 1.5rem;
          }
          
          .verify-signout-link {
            color: #FF5A1F;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
            text-decoration: none;
          }
          
          .verify-signout-link:hover {
            color: #E63946;
            text-decoration: underline;
          }
          
          .verify-footer {
            text-align: center;
            padding: 2rem 0;
            background: white;
            border-top: 1px solid #e9ecef;
            margin-top: auto;
          }
          
          .verify-footer a {
            color: #6c757d;
            text-decoration: none;
            margin: 0 1rem;
            font-size: 0.875rem;
            transition: color 0.3s ease;
          }
          
          .verify-footer a:hover {
            color: #FF5A1F;
            text-decoration: none;
          }
          
          .verify-skip-link {
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
          
          .verify-skip-link:focus {
            top: 6px;
            color: white;
            text-decoration: none;
          }
          
          @media (max-width: 768px) {
            .verify-main {
              margin: 1rem;
              padding: 1.5rem;
            }
            
            .verify-title {
              font-size: 1.5rem;
            }
            
            .verify-desc {
              font-size: 0.9rem;
            }
          }
          
          @media (max-width: 576px) {
            .verify-main {
              margin: 0.5rem;
              padding: 1rem;
            }
            
            .verify-back-btn {
              top: 0.5rem;
              left: 0.5rem;
            }
            
            .verify-title {
              margin-top: 2.5rem;
            }
          }
        `}
      </style>

      <div className="verify-container d-flex flex-column">
        <a href="#main-content" className="verify-skip-link">
          Skip to content
        </a>

        <header className="verify-header-custom">
          <div className="container">
            <BrandLogo safe="#1A1A1A" link="#FF5A1F" />
            <p className="verify-tagline">Your Family Safety Dashboard</p>
          </div>
        </header>

        <main
          id="main-content"
          className="flex-grow-1 d-flex align-items-center"
        >
          <div className="container">
            <div className="verify-main mx-auto">
              <button
                className="verify-back-btn btn"
                onClick={() => navigate("/")}
                aria-label="Back to Home"
              >
                ←
              </button>

              <h1 className="verify-title">Verify Your Email</h1>

              <p className="verify-desc">
                A verification email has been sent to your email address. Please
                check your inbox (and spam/junk folder) and click the
                verification link to activate your account.
              </p>

              <div className="verify-success alert" role="alert">
                <span className="verify-success-icon">✔</span>
                Please verify your email to continue.
              </div>

              <button
                className="btn btn-safelink btn-lg w-100"
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
            </div>
          </div>
        </main>

        <footer className="verify-footer">
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

export default VerifyEmail;
