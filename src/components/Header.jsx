import BrandLogo from "../components/BrandLogo";
import { auth } from "../config/firebase";
import { useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../styles/Header.css";

const Header = (props) => {
  const navigate = useNavigate();

  const [error, setError] = useState(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dropdownRef = useRef(null);

  const logOut = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signOut(auth);
    } catch (error) {
      setError("Failed to log out.");
      console.error("Error logging out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };
  return (
    <header className="home-header" role="banner">
      <div className="home-header-left">
        <BrandLogo safe="white" link="white" />
        <span
          className="home-language-toggle"
          role="button"
          tabIndex={0}
          onClick={() => console.log("Toggle language")}
          onKeyDown={(e) => e.key === "Enter" && console.log("Toggle language")}
        >
          EN | FIL
        </span>
      </div>
      <button
        className="home-nav-toggle"
        onClick={toggleNav}
        aria-label="Toggle navigation menu"
        aria-expanded={isNavOpen}
      >
        ☰
      </button>
      <nav className={`home-nav ${isNavOpen ? "open" : ""}`} role="navigation">
        <a href="../" aria-current="page">
          Dashboard
        </a>
        <a href="/alerts" onClick={() => navigate("/alerts")}>
          Alerts
        </a>
        <a href="/family" onClick={() => navigate("/family")}>
          Family
        </a>
        <a href="#">Evacuation</a>
        <a href="#">Go-Bag</a>
      </nav>
      <div className="home-avatar" ref={dropdownRef}>
        <button
          className="home-avatar-button"
          onClick={toggleDropdown}
          aria-label="Toggle user menu"
          aria-expanded={isDropdownOpen}
        >
          {props.profileData
            ? props.profileData.profile.firstName || "User"
            : "User"}
          <ChevronDown
            size={16}
            className={`home-dropdown-icon ${isDropdownOpen ? "open" : ""}`}
          />
        </button>
        {isDropdownOpen && (
          <ul className="home-dropdown-menu">
            <li>
              <button
                className="home-dropdown-item"
                onClick={() => navigate("/account")}
              >
                Profile
              </button>
            </li>
            <li>
              <button
                className="home-dropdown-item"
                onClick={() => console.log("Settings clicked")}
              >
                Settings
              </button>
            </li>
            <li>
              <button
                className="home-dropdown-item"
                onClick={() => console.log("Notifications clicked")}
              >
                Notifications
              </button>
            </li>
            <li>
              <button
                className="home-dropdown-item"
                onClick={logOut}
                disabled={isLoading}
              >
                {isLoading ? "Logging out..." : "Logout"}
              </button>
            </li>
          </ul>
        )}
      </div>
    </header>
  );
};

export default Header;
