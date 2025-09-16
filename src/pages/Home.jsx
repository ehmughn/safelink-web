import { useState } from "react";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";
import "../styles/Home.css";
import BrandLogo from "../components/BrandLogo";
import BellIcon from "../assets/bell-icon.png";
import FamilyIcon from "../assets/family-icon.png";
import MapIcon from "../assets/map-icon.png";
import CheckIcon from "../assets/check-icon.png";
import LocationIcon from "../assets/location-icon.png";
import GoBagIcon from "../assets/gobag-icon.png";
import AvatarIcon from "../assets/avatar-icon.png";

// TEMPORARY
const familyMembers = [
  { name: "Carl", avatar: AvatarIcon },
  { name: "Kristine", avatar: AvatarIcon },
  { name: "Kevin", avatar: AvatarIcon },
  { name: "Mark", avatar: AvatarIcon },
];

const Home = () => {
  const [alerts, setAlerts] = useState([
    { id: 1, text: "Typhoon Warning", severity: "high" },
    { id: 2, text: "Cavite sgnl #2", severity: "medium" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isNavOpen, setIsNavOpen] = useState(false);

  const logOut = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signOut(auth);
    } catch (error) {
      setError("Failed to log out. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  return (
    <div className="home-root">
      {/* Header */}
      <header className="home-header" role="banner">
        <div className="home-header-left">
          <BrandLogo safe="white" link="white" />
        </div>
        <button
          className="home-nav-toggle"
          onClick={toggleNav}
          aria-label="Toggle navigation menu"
          aria-expanded={isNavOpen}
        >
          ☰
        </button>
        <nav
          className={`home-nav ${isNavOpen ? "open" : ""}`}
          role="navigation"
        >
          <a href="#" aria-current="page">
            Dashboard
          </a>
          <a href="#">Alerts</a>
          <a href="#">Family</a>
          <a href="#">Evacuation</a>
          <a href="#">Go-Bag</a>
          <a href="#">Settings</a>
        </nav>
        <div className="home-avatar" role="img" aria-label="User profile">
          <img src="/assets/avatar-user.png" alt="User profile" />
        </div>
      </header>

      {/* Welcome */}
      <section className="home-welcome-block" aria-labelledby="welcome-heading">
        <h1 id="welcome-heading" className="home-welcome">
          Welcome, Maria
        </h1>
        <p className="home-welcome-sub">Your Family Safety Dashboard</p>
      </section>

      {/* Dashboard Grid */}
      <div className="home-dashboard-grid" role="grid">
        <div className="home-card home-card-alert" role="gridcell" tabIndex="0">
          <div className="home-card-icon-bg">
            <img src={BellIcon} alt="Emergency Broadcast" />
          </div>
          <span>Emergency Broadcast</span>
        </div>
        <div className="home-card" role="gridcell" tabIndex="0">
          <div className="home-card-icon-bg">
            <img src={FamilyIcon} alt="Add Family Member" />
          </div>
          <span>Add Family Member</span>
        </div>
        <div className="home-card" role="gridcell" tabIndex="0">
          <div className="home-card-icon-bg">
            <img src={MapIcon} alt="Nearest Evacuation Center" />
          </div>
          <span>Nearest Evacuation</span>
        </div>
        <div className="home-card home-card-gobag" role="gridcell" tabIndex="0">
          <div className="home-card-icon-bg">
            <img src={CheckIcon} alt="Go-Bag Checklist" />
          </div>
          <span>Go-Bag Checklist</span>
        </div>

        {/* Real Alerts */}
        <section className="home-alerts" aria-labelledby="alerts-title">
          <h2 id="alerts-title" className="home-alerts-title">
            Active Alerts
          </h2>
          <div className="home-alerts-list">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`home-alert-item home-alert-${alert.severity}`}
              >
                {alert.text}
              </div>
            ))}
          </div>
        </section>

        {/* Map Section */}
        <div className="home-map" role="img" aria-label="Location map">
          <img src="/assets/map.png" alt="Location map" />
        </div>

        {/* Family List */}
        <section className="home-family-list" aria-labelledby="family-title">
          <h2 id="family-title" className="home-family-title">
            Family Members
          </h2>
          {familyMembers.map((member) => (
            <div
              key={member.name}
              className="home-family-member"
              role="listitem"
            >
              <div className="home-family-avatar-bg">
                <img src={member.avatar} alt={`${member.name}'s avatar`} />
              </div>
              <span>{member.name}</span>
            </div>
          ))}
        </section>

        {/* Location Card */}
        <div
          className="home-card home-card-location"
          role="gridcell"
          tabIndex="0"
        >
          <div className="home-card-icon-bg">
            <img src="/assets/location-icon.png" alt="Current Location" />
          </div>
          <span>Current Location</span>
        </div>

        {/* Empty Card for spacing */}
        <div className="home-card home-card-empty" role="gridcell"></div>
      </div>

      {/* Action Buttons */}
      <section className="home-actions-group" aria-label="Action buttons">
        <div className="home-actions">
          <button
            className="home-action-btn home-action-sos"
            aria-label="Send SOS Notification"
          >
            <span className="home-action-desc">SOS</span>
            Notify All
          </button>
          <button
            className="home-action-btn"
            aria-label="Initiate Family Check-In"
          >
            <span className="home-action-icon">
              <img src={FamilyIcon} alt="Family Check-In" />
            </span>
            Family Check-In
          </button>
          <button
            className="home-action-btn"
            aria-label="Find Current Location"
          >
            <span className="home-action-icon">
              <img src={LocationIcon} alt="Find Location" />
            </span>
            Find Location
          </button>
          <button
            className="home-action-btn"
            aria-label="Edit Go-Bag Checklist"
          >
            <span className="home-action-icon">
              <img src={GoBagIcon} alt="Edit Go-Bag" />
            </span>
            Edit Go-Bag
          </button>
        </div>
      </section>

      {/* Log out button */}
      <div className="home-logout-row">
        {error && (
          <p className="home-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="home-logout-btn"
          onClick={logOut}
          disabled={isLoading}
          aria-label="Log out"
        >
          {isLoading ? "Logging out..." : "Sign Out"}
        </button>
      </div>
    </div>
  );
};

export default Home;
