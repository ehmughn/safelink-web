import { useState } from "react";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";
import {
  Bell,
  Users,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Volume2,
} from "lucide-react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/Home.css";
import BrandLogo from "../components/BrandLogo";

// TEMPORARY
const familyMembers = [
  { name: "Thomas", status: "SAFE", avatar: null },
  { name: "Kari", status: "NO RESPONSE", avatar: null },
  { name: "Martha", status: "UNKNOWN", avatar: null },
  { name: "Maine", status: "DANGER", avatar: null },
];

const Home = () => {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      text: "A typhoon warning has been issued for your area.",
      severity: "high",
    },
    { id: 2, text: "Earthquake alert", severity: "medium" },
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
          <span className="home-language-toggle">EN | FIL</span>
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
          <span>Maria</span>
        </div>
      </header>

      {/* Welcome */}
      <section className="home-welcome-block" aria-labelledby="welcome-heading">
        <h1 id="welcome-heading" className="home-welcome">
          DISASTER PREPAREDNESS
        </h1>
      </section>

      {/* Dashboard Grid */}
      <div className="home-dashboard" role="grid">
        {/* Alerts Section */}
        <section className="home-alerts" aria-labelledby="alerts-title">
          <h2 id="alerts-title" className="home-section-title">
            ALERTS
          </h2>
          <div className="home-alert-message">{alerts[0].text}</div>
          <button
            className="home-action-btn home-im-safe"
            aria-label="I'm Safe Check-In"
          >
            I'M SAFE
          </button>
        </section>

        {/* Family Status */}
        <section className="home-family" aria-labelledby="family-title">
          <h2 id="family-title" className="home-section-title">
            Family Status
          </h2>
          <div className="home-family-list">
            {familyMembers.map((member) => (
              <div
                key={member.name}
                className={`home-family-member home-status-${member.status
                  .toLowerCase()
                  .replace(" ", "-")}`}
                role="listitem"
              >
                <span>{member.name}</span>
                <span>{member.status}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Evacuation Map */}
        <section className="home-evacuation" aria-labelledby="evacuation-title">
          <h2 id="evacuation-title" className="home-section-title">
            Nearest Evacuation Center
          </h2>
          <MapContainer center={[14.5547, 121.0244]} zoom={13}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </MapContainer>
        </section>

        {/* Go-Bag Checklist */}
        <section className="home-gobag" aria-labelledby="gobag-title">
          <h2 id="gobag-title" className="home-section-title">
            Go-Bag Checklist
          </h2>
          <div className="home-gobag-progress">
            <CheckCircle
              className="home-gobag-icon"
              aria-label="Check Icon"
              size={24}
              color="#1A1A1A"
            />
            <span>Water</span>
            <span className="home-gobag-check">✔</span>
            <span>Food</span>
            <span className="home-gobag-progress-value">75%</span>
          </div>
        </section>

        {/* Latest Alerts */}
        <section
          className="home-latest-alerts"
          aria-labelledby="latest-alerts-title"
        >
          <h2 id="latest-alerts-title" className="home-section-title">
            Latest Alerts
          </h2>
          <div className="home-latest-alerts-list">
            {alerts.map((alert) => (
              <div key={alert.id} className="home-latest-alert-item">
                {alert.text}{" "}
                <span className="home-alert-time">
                  {alert.severity === "high" ? "1 hour ago" : "RHI/VOLCS ago"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Official Announcements */}
        <section
          className="home-announcements"
          aria-labelledby="announcements-title"
        >
          <h2 id="announcements-title" className="home-section-title">
            Official Announcements
          </h2>
          <div className="home-announcements-list">
            <div className="home-announcement-item">
              Emergency shelters are now open{" "}
              <span className="home-announcement-time">1 hour ago</span>
            </div>
          </div>
        </section>
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
            <Users
              className="home-action-icon"
              aria-label="Family Icon"
              size={24}
              color="white"
            />
            Family Check-In
          </button>
          <button
            className="home-action-btn"
            aria-label="Find Current Location"
          >
            <MapPin
              className="home-action-icon"
              aria-label="Location Icon"
              size={24}
              color="white"
            />
            Find Location
          </button>
          <button
            className="home-action-btn"
            aria-label="Edit Go-Bag Checklist"
          >
            <CheckCircle
              className="home-action-icon"
              aria-label="Go-Bag Icon"
              size={24}
              color="white"
            />
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
