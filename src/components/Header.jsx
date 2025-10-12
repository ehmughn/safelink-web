import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Bell,
  ChevronDown,
} from "lucide-react";

const Header = ({ profileData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/family", label: "Family", icon: Users },
  ];

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

          .header-container {
            position: sticky;
            top: 0;
            z-index: 1030;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: 'Inter', sans-serif;
          }

          .header-scrolled {
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95) !important;
          }

          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 0;
            transition: padding 0.3s ease;
          }

          .header-scrolled .header-content {
            padding: 0.75rem 0;
          }

          .brand-button {
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            transition: transform 0.3s ease;
          }

          .brand-button:hover {
            transform: scale(1.05);
          }

          .nav-links {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .nav-link-button {
            background: none;
            border: none;
            padding: 0.75rem 1.25rem;
            border-radius: 12px;
            font-weight: 600;
            font-size: 0.95rem;
            color: #64748b;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            position: relative;
          }

          .nav-link-button::before {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%) scaleX(0);
            width: 80%;
            height: 3px;
            background: linear-gradient(90deg, #FF5A1F, #E63946);
            border-radius: 3px 3px 0 0;
            transition: transform 0.3s ease;
          }

          .nav-link-button:hover {
            color: #FF5A1F;
            background: linear-gradient(135deg, #fff5f1 0%, #ffe8e1 100%);
          }

          .nav-link-button.active {
            color: #FF5A1F;
            background: linear-gradient(135deg, #fff5f1 0%, #ffe8e1 100%);
          }

          .nav-link-button.active::before {
            transform: translateX(-50%) scaleX(1);
          }

          .user-section {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .notification-button {
            position: relative;
            background: linear-gradient(135deg, #f6f8fb 0%, #e2e8f0 100%);
            border: none;
            width: 44px;
            height: 44px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }

          .notification-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 90, 31, 0.2);
            background: linear-gradient(135deg, #fff5f1 0%, #ffe8e1 100%);
          }

          .notification-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            color: white;
            border-radius: 10px;
            padding: 0.15rem 0.4rem;
            font-size: 0.7rem;
            font-weight: 700;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(220, 38, 38, 0.4);
          }

          .user-menu-button {
            background: white;
            border: 2px solid #e2e8f0;
            padding: 0.5rem 1rem;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }

          .user-menu-button:hover {
            border-color: #FF5A1F;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 90, 31, 0.2);
          }

          .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 0.95rem;
            box-shadow: 0 2px 8px rgba(255, 90, 31, 0.3);
          }

          .user-info {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }

          .user-name {
            font-weight: 600;
            font-size: 0.95rem;
            color: #1a202c;
            line-height: 1.2;
          }

          .user-email {
            font-size: 0.75rem;
            color: #94a3b8;
            line-height: 1.2;
          }

          .chevron-icon {
            transition: transform 0.3s ease;
            color: #94a3b8;
          }

          .user-menu-button:hover .chevron-icon {
            color: #FF5A1F;
          }

          .chevron-icon.open {
            transform: rotate(180deg);
          }

          .dropdown-menu-custom {
            position: absolute;
            top: calc(100% + 0.5rem);
            right: 0;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            min-width: 280px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid #e2e8f0;
            overflow: hidden;
          }

          .dropdown-menu-custom.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
          }

          .dropdown-header-custom {
            background: linear-gradient(135deg, #f6f8fb 0%, #e2e8f0 100%);
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid #e2e8f0;
          }

          .dropdown-header-name {
            font-weight: 700;
            font-size: 1.1rem;
            color: #1a202c;
            margin-bottom: 0.25rem;
          }

          .dropdown-header-email {
            font-size: 0.85rem;
            color: #64748b;
          }

          .dropdown-body-custom {
            padding: 0.5rem;
          }

          .dropdown-item-custom {
            background: none;
            border: none;
            width: 100%;
            padding: 0.875rem 1rem;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 500;
            color: #475569;
            font-size: 0.95rem;
          }

          .dropdown-item-custom:hover {
            background: linear-gradient(135deg, #fff5f1 0%, #ffe8e1 100%);
            color: #FF5A1F;
            transform: translateX(4px);
          }

          .dropdown-item-custom.danger {
            color: #dc2626;
          }

          .dropdown-item-custom.danger:hover {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            color: #991b1b;
          }

          .dropdown-divider-custom {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
            margin: 0.5rem 0;
          }

          .mobile-toggle {
            display: none;
            background: linear-gradient(135deg, #f6f8fb 0%, #e2e8f0 100%);
            border: none;
            width: 44px;
            height: 44px;
            border-radius: 12px;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }

          .mobile-toggle:hover {
            background: linear-gradient(135deg, #fff5f1 0%, #ffe8e1 100%);
            transform: scale(1.05);
          }

          .mobile-menu {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            z-index: 1040;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
          }

          .mobile-menu.show {
            opacity: 1;
            visibility: visible;
          }

          .mobile-menu-content {
            position: absolute;
            top: 0;
            right: 0;
            width: 85%;
            max-width: 350px;
            height: 100%;
            background: white;
            box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow-y: auto;
          }

          .mobile-menu.show .mobile-menu-content {
            transform: translateX(0);
          }

          .mobile-menu-header {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            padding: 2rem 1.5rem;
            color: white;
          }

          .mobile-menu-user {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
          }

          .mobile-menu-body {
            padding: 1.5rem 1rem;
          }

          .mobile-nav-link {
            background: none;
            border: none;
            width: 100%;
            padding: 1rem;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 600;
            color: #475569;
            font-size: 1rem;
            margin-bottom: 0.5rem;
          }

          .mobile-nav-link:hover,
          .mobile-nav-link.active {
            background: linear-gradient(135deg, #fff5f1 0%, #ffe8e1 100%);
            color: #FF5A1F;
          }

          @media (max-width: 991.98px) {
            .nav-links {
              display: none;
            }

            .mobile-toggle {
              display: flex;
            }

            .user-info {
              display: none;
            }

            .user-section {
              gap: 0.5rem;
            }
          }

          @media (max-width: 576px) {
            .notification-button {
              width: 40px;
              height: 40px;
            }

            .user-avatar {
              width: 36px;
              height: 36px;
              font-size: 0.85rem;
            }

            .user-menu-button {
              padding: 0.4rem 0.6rem;
            }
          }
        `}
      </style>

      <header
        className={`header-container bg-white ${
          scrolled ? "header-scrolled" : ""
        }`}
      >
        <div className="container">
          <div className="header-content">
            {/* Brand */}
            <button
              className="brand-button"
              onClick={() => navigate("/")}
              aria-label="Go to home"
            >
              <BrandLogo safe="#1A1A1A" link="#FF5A1F" />
            </button>

            {/* Desktop Navigation */}
            <nav className="nav-links">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  className={`nav-link-button ${
                    isActivePath(item.path) ? "active" : ""
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            {/* User Section */}
            <div className="user-section">
              {/* User Menu */}
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button
                  className="user-menu-button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  aria-expanded={showDropdown}
                >
                  <div className="user-avatar">{getInitials()}</div>
                  <div className="user-info">
                    <div className="user-name">{getDisplayName()}</div>
                    <div className="user-email">{profileData?.email}</div>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`chevron-icon ${showDropdown ? "open" : ""}`}
                  />
                </button>

                <div
                  className={`dropdown-menu-custom ${
                    showDropdown ? "show" : ""
                  }`}
                >
                  <div className="dropdown-header-custom">
                    <div className="dropdown-header-name">
                      {getDisplayName()}
                    </div>
                    <div className="dropdown-header-email">
                      {profileData?.email}
                    </div>
                  </div>

                  <div className="dropdown-body-custom">
                    <button
                      className="dropdown-item-custom"
                      onClick={() => {
                        navigate("/account");
                        setShowDropdown(false);
                      }}
                    >
                      <Settings size={18} />
                      <span>Account Settings</span>
                    </button>

                    <button
                      className="dropdown-item-custom"
                      onClick={() => {
                        navigate("/");
                        setShowDropdown(false);
                      }}
                    >
                      <Shield size={18} />
                      <span>Safety Dashboard</span>
                    </button>

                    <div className="dropdown-divider-custom"></div>

                    <button
                      className="dropdown-item-custom danger"
                      onClick={handleSignOut}
                    >
                      <LogOut size={18} />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Toggle */}
              <button
                className="mobile-toggle"
                onClick={() => setShowMobileMenu(true)}
                aria-label="Open menu"
              >
                <Menu size={20} color="#64748b" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${showMobileMenu ? "show" : ""}`}>
        <div
          className="mobile-menu-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mobile-menu-header">
            <button
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              onClick={() => setShowMobileMenu(false)}
              aria-label="Close menu"
            >
              <X size={20} color="white" />
            </button>

            <div className="mobile-menu-user">
              <div
                className="user-avatar"
                style={{ width: "56px", height: "56px", fontSize: "1.25rem" }}
              >
                {getInitials()}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  {getDisplayName()}
                </div>
                <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                  {profileData?.email}
                </div>
              </div>
            </div>
          </div>

          <div className="mobile-menu-body">
            {navItems.map((item) => (
              <button
                key={item.path}
                className={`mobile-nav-link ${
                  isActivePath(item.path) ? "active" : ""
                }`}
                onClick={() => {
                  navigate(item.path);
                  setShowMobileMenu(false);
                }}
              >
                <item.icon size={22} />
                <span>{item.label}</span>
              </button>
            ))}

            <div
              style={{ height: "1px", background: "#e2e8f0", margin: "1rem 0" }}
            ></div>

            <button
              className="mobile-nav-link"
              onClick={() => {
                navigate("/account");
                setShowMobileMenu(false);
              }}
            >
              <Settings size={22} />
              <span>Account Settings</span>
            </button>

            <button
              className="mobile-nav-link"
              onClick={() => {
                navigate("/");
                setShowMobileMenu(false);
              }}
            >
              <Shield size={22} />
              <span>Safety Dashboard</span>
            </button>

            <div
              style={{ height: "1px", background: "#e2e8f0", margin: "1rem 0" }}
            ></div>

            <button
              className="mobile-nav-link"
              style={{ color: "#dc2626" }}
              onClick={handleSignOut}
            >
              <LogOut size={22} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
        <div
          style={{ position: "absolute", inset: 0 }}
          onClick={() => setShowMobileMenu(false)}
        ></div>
      </div>
    </>
  );
};

export default Header;
