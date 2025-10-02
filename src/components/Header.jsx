import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import BrandLogo from "./BrandLogo";
import {
  User,
  LogOut,
  Settings,
  Shield,
  Menu,
  X,
  Home,
  Users,
  UserCircle,
} from "lucide-react";

const Header = ({ profileData }) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("auth");
      navigate("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const getDisplayName = () => {
    if (profileData?.profile?.firstName && profileData?.profile?.lastName) {
      return `${profileData.profile.firstName} ${profileData.profile.lastName}`;
    }
    return profileData?.email?.split("@")[0] || "User";
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top">
      <div className="container">
        {/* Brand */}
        <button
          className="navbar-brand btn btn-link p-0 border-0"
          onClick={() => navigate("/")}
          style={{ textDecoration: "none" }}
        >
          <BrandLogo safe="#1A1A1A" link="#FF5A1F" />
        </button>

        {/* Mobile menu toggle */}
        <button
          className="navbar-toggler border-0"
          type="button"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          aria-label="Toggle navigation"
        >
          {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Navigation items */}
        <div
          className={`collapse navbar-collapse ${showMobileMenu ? "show" : ""}`}
        >
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <button
                className="nav-link btn btn-link border-0 d-flex align-items-center gap-2"
                onClick={() => navigate("/")}
              >
                <Home size={18} />
                <span>Home</span>
              </button>
            </li>
            <li className="nav-item">
              <button
                className="nav-link btn btn-link border-0 d-flex align-items-center gap-2"
                onClick={() => navigate("/family")}
              >
                <Users size={18} />
                <span>Family</span>
              </button>
            </li>
          </ul>

          {/* User menu */}
          <div className="navbar-nav">
            <div className="nav-item dropdown">
              <button
                className="nav-link dropdown-toggle btn btn-link border-0 d-flex align-items-center gap-2"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-expanded={showDropdown}
              >
                <div
                  className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "32px",
                    height: "32px",
                    fontSize: "0.875rem",
                  }}
                >
                  {getInitials()}
                </div>
                <span className="d-none d-md-inline">{getDisplayName()}</span>
              </button>

              <ul
                className={`dropdown-menu dropdown-menu-end ${
                  showDropdown ? "show" : ""
                }`}
              >
                <li>
                  <h6 className="dropdown-header d-flex align-items-center gap-2">
                    <UserCircle size={16} />
                    {getDisplayName()}
                  </h6>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item d-flex align-items-center gap-2"
                    onClick={() => {
                      navigate("/account");
                      setShowDropdown(false);
                    }}
                  >
                    <Settings size={16} />
                    Account Settings
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item d-flex align-items-center gap-2"
                    onClick={() => {
                      navigate("/");
                      setShowDropdown(false);
                    }}
                  >
                    <Shield size={16} />
                    Safety Dashboard
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item text-danger d-flex align-items-center gap-2"
                    onClick={handleSignOut}
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dropdown-menu {
          min-width: 200px;
          border: 0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          border-radius: 8px;
        }

        .dropdown-item {
          padding: 0.75rem 1rem;
          transition: background-color 0.3s ease;
        }

        .dropdown-item:hover {
          background-color: #f8f9fa;
        }

        .nav-link {
          padding: 0.5rem 1rem;
          color: #6c757d;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .nav-link:hover {
          color: #ff5a1f;
        }

        .navbar-toggler:focus {
          box-shadow: none;
        }

        @media (max-width: 991.98px) {
          .navbar-collapse {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border-top: 1px solid #e9ecef;
            padding: 1rem;
            z-index: 1000;
          }
        }
      `}</style>
    </nav>
  );
};

export default Header;
