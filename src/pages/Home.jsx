import { useState, useEffect } from "react";
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
import ImSafeButton from "../components/ImSafeButton";
import FamilyStatusCard from "../components/FamilyStatusCard";
import { FamilyService } from "../services/familyService";
import { SafeStatusService } from "../services/safeStatusService";

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
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyCode, setFamilyCode] = useState(null);
  const [user, setUser] = useState(null);
  const [familyLoading, setFamilyLoading] = useState(true);

  // Load user and family data on component mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadFamilyData(firebaseUser.uid);
      } else {
        setUser(null);
        setFamilyCode(null);
        setFamilyMembers([]);
        setFamilyLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load family data for current user
  const loadFamilyData = async (userId) => {
    setFamilyLoading(true);
    try {
      const familyResult = await FamilyService.getUserFamilyCode(userId);

      if (familyResult.success && familyResult.familyCode) {
        setFamilyCode(familyResult.familyCode);

        // Subscribe to family updates for real-time data
        const unsubscribe = FamilyService.subscribeFamilyUpdates(
          familyResult.familyCode,
          (result) => {
            if (result.success && result.data) {
              setFamilyMembers(result.data.members || []);
            }
            setFamilyLoading(false);
          }
        );

        // Store unsubscribe function for cleanup
        return unsubscribe;
      } else {
        setFamilyCode(null);
        setFamilyMembers([]);
        setFamilyLoading(false);
      }
    } catch (error) {
      console.error("Error loading family data:", error);
      setFamilyLoading(false);
    }
  };

  // Handle "I'm Safe" button click
  const handleSafeUpdate = async (location = null) => {
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      const result = await SafeStatusService.recordSafeStatus(
        user.uid,
        location,
        "Manual check-in from home dashboard"
      );

      if (result.success) {
        // Show success feedback (you could add a toast notification here)
        console.log("Safe status updated successfully");
      }

      return result;
    } catch (error) {
      console.error("Error updating safe status:", error);
      return { success: false, error: error.message };
    }
  };

  // Handle family check-in request
  const handleFamilyCheckIn = async () => {
    if (!user || !familyCode) return;

    try {
      const result = await FamilyService.sendFamilyCheckIn(
        familyCode,
        user.uid,
        user.displayName || user.email
      );

      if (result.success) {
        // Show success message (you could add a toast notification here)
        console.log("Family check-in request sent successfully");
      }
    } catch (error) {
      console.error("Error sending family check-in:", error);
    }
  };

  // Handle SOS alert
  const handleSOSAlert = async () => {
    if (!user) return;

    try {
      // Get current location if possible
      const locationResult = await SafeStatusService.getCurrentLocation();
      const location = locationResult.success ? locationResult.location : null;

      const result = await SafeStatusService.sendSOSAlert(
        user.uid,
        location,
        "Emergency SOS alert from home dashboard"
      );

      if (result.success) {
        console.log("SOS alert sent successfully");
      }
    } catch (error) {
      console.error("Error sending SOS alert:", error);
    }
  };

  // Handle family member click
  const handleMemberClick = (member) => {
    // Navigate to member details or show more info
    console.log("Member clicked:", member);
  };

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
          <ImSafeButton onSafeUpdate={handleSafeUpdate} size="normal" />
        </section>

        {/* Family Status */}
        <section
          className="home-family"
          aria-labelledby="family-title"
          style={{ cursor: "pointer" }}
          onClick={() => window.location.assign("/family")}
        >
          <FamilyStatusCard
            familyMembers={familyMembers}
            onRequestCheckIn={handleFamilyCheckIn}
            onMemberClick={handleMemberClick}
            isLoading={familyLoading}
            showCheckInButton={true}
          />
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
          <form className="home-gobag-checklist">
            <label className="home-gobag-item">
              <input type="checkbox" />
              <span className="home-gobag-label">Food</span>
            </label>
            <label className="home-gobag-item">
              <input type="checkbox" />
              <span className="home-gobag-label">Water</span>
            </label>
            <label className="home-gobag-item">
              <input type="checkbox" />
              <span className="home-gobag-label">Clothes</span>
            </label>
            <label className="home-gobag-item">
              <input type="checkbox" />
              <span className="home-gobag-label">Flashlight</span>
            </label>
          </form>
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
            onClick={handleSOSAlert}
          >
            <span className="home-action-desc">SOS</span>
            Notify All
          </button>
          <button
            className="home-action-btn"
            aria-label="Initiate Family Check-In"
            onClick={handleFamilyCheckIn}
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
