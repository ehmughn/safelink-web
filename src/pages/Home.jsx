import { useState, useEffect, useRef } from "react";
import { auth } from "../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import {
  Bell,
  Users,
  MapPin,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronDown,
} from "lucide-react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/Home.css";
import ImSafeButton from "../components/ImSafeButton";
import FamilyStatusCard from "../components/FamilyStatusCard";
import Header from "../components/Header";
import { FamilyService } from "../services/familyService";
import { SafeStatusService } from "../services/safeStatusService";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      text: "A typhoon warning has been issued for your area.",
      severity: "high",
    },
    { id: 2, text: "Earthquake alert", severity: "medium" },
  ]);
  const [error, setError] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyCode, setFamilyCode] = useState(null);
  const [user, setUser] = useState(null);
  const [familyLoading, setFamilyLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    profile: { firstName: "", lastName: "", address: "" },
    email: "",
    phoneNumber: "",
  });
  const [checklist, setChecklist] = useState({
    food: false,
    water: false,
    clothes: false,
    flashlight: false,
  });

  const dropdownRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setProfileData({
              profile: {
                firstName: userData.profile?.firstName || "",
                lastName: userData.profile?.lastName || "",
                address: userData.profile?.address || "",
              },
              email: userData.email || "",
              phoneNumber:
                userData.phoneNumber || firebaseUser.phoneNumber || "",
            });
          }
        } catch (error) {
          setError("Failed to fetch user data.");
          console.error("Error fetching user document:", error);
        }
        await loadFamilyData(firebaseUser.uid);
      } else {
        setUser(null);
        setFamilyCode(null);
        setFamilyMembers([]);
        setFamilyLoading(false);
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadFamilyData = async (userId) => {
    setFamilyLoading(true);
    try {
      const familyResult = await FamilyService.getUserFamilyCode(userId);
      if (familyResult.success && familyResult.familyCode) {
        setFamilyCode(familyResult.familyCode);
        const unsubscribe = FamilyService.subscribeFamilyUpdates(
          familyResult.familyCode,
          (result) => {
            if (result.success && result.data) {
              setFamilyMembers(result.data.members || []);
            }
            setFamilyLoading(false);
          }
        );
        return unsubscribe;
      } else {
        setFamilyCode(null);
        setFamilyMembers([]);
        setFamilyLoading(false);
      }
    } catch (error) {
      setError("Failed to load family data.");
      console.error("Error loading family data:", error);
      setFamilyLoading(false);
    }
  };

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
        setAlerts((prev) => [
          ...prev,
          { id: Date.now(), text: "Safe status updated!", severity: "low" },
        ]);
      }
      return result;
    } catch (error) {
      console.error("Error updating safe status:", error);
      setError("Failed to update safe status.");
      return { success: false, error: error.message };
    }
  };

  const handleFamilyCheckIn = async () => {
    if (!user || !familyCode) return;
    try {
      const result = await FamilyService.sendFamilyCheckIn(
        familyCode,
        user.uid,
        user.displayName || user.email
      );
      if (result.success) {
        setAlerts((prev) => [
          ...prev,
          { id: Date.now(), text: "Family check-in sent!", severity: "low" },
        ]);
      }
    } catch (error) {
      console.error("Error sending family check-in:", error);
      setError("Failed to send family check-in.");
    }
  };

  const handleSOSAlert = async () => {
    if (!user) return;
    try {
      const locationResult = await SafeStatusService.getCurrentLocation();
      const location = locationResult.success ? locationResult.location : null;
      const result = await SafeStatusService.sendSOSAlert(
        user.uid,
        location,
        "Emergency SOS alert from home dashboard"
      );
      if (result.success) {
        setAlerts((prev) => [
          ...prev,
          { id: Date.now(), text: "SOS alert sent!", severity: "high" },
        ]);
      }
    } catch (error) {
      console.error("Error sending SOS alert:", error);
      setError("Failed to send SOS alert.");
    }
  };

  const handleChecklistChange = (item) => {
    setChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const handleSaveChecklist = () => {
    setAlerts((prev) => [
      ...prev,
      { id: Date.now(), text: "Go-Bag checklist saved!", severity: "low" },
    ]);
    console.log("Checklist saved:", checklist);
  };

  const dismissAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  return (
    <div className="home-root">
      <Header profileData={profileData} />

      <section className="home-welcome-block" aria-labelledby="welcome-heading">
        <h1 id="welcome-heading" className="home-welcome">
          DISASTER PREPAREDNESS
        </h1>
      </section>

      <div className="home-dashboard" role="grid">
        <section className="home-alerts" aria-labelledby="alerts-title">
          <h2 id="alerts-title" className="home-section-title">
            ALERTS
          </h2>
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`home-alert-message ${alert.severity}`}
              >
                <span>{alert.text}</span>
                <button
                  className="home-alert-dismiss"
                  onClick={() => dismissAlert(alert.id)}
                  aria-label="Dismiss alert"
                >
                  <X size={16} />
                </button>
              </div>
            ))
          ) : (
            <div className="home-alert-message low">
              No active alerts at this time.
            </div>
          )}
          <div className="home-alert-actions">
            <ImSafeButton onSafeUpdate={handleSafeUpdate} size="normal" />
            <button
              className="home-action-btn home-view-alerts"
              onClick={() => navigate("/alerts")}
              aria-label="View all alerts"
            >
              View All Alerts
            </button>
          </div>
        </section>

        <section
          className="home-family"
          aria-labelledby="family-title"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/family")}
        >
          <h2 id="family-title" className="home-section-title">
            FAMILY STATUS
          </h2>
          {familyLoading ? (
            <div className="home-loading">Loading family data...</div>
          ) : (
            <FamilyStatusCard
              familyMembers={familyMembers}
              onRequestCheckIn={handleFamilyCheckIn}
              isLoading={familyLoading}
              showCheckInButton={true}
            />
          )}
        </section>

        <section className="home-evacuation" aria-labelledby="evacuation-title">
          <h2 id="evacuation-title" className="home-section-title">
            Nearest Evacuation Center
          </h2>
          <MapContainer
            center={[14.5547, 121.0244]}
            zoom={13}
            className="home-map-interactive"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </MapContainer>
        </section>

        <section className="home-gobag" aria-labelledby="gobag-title">
          <h2 id="gobag-title" className="home-section-title">
            Go-Bag Checklist
          </h2>
          <form className="home-gobag-checklist">
            {["food", "water", "clothes", "flashlight"].map((item) => (
              <label key={item} className="home-gobag-item">
                <input
                  type="checkbox"
                  checked={checklist[item]}
                  onChange={() => handleChecklistChange(item)}
                />
                <span className="home-gobag-label">
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </span>
              </label>
            ))}
            <button
              type="button"
              className="home-action-btn home-save-checklist"
              onClick={handleSaveChecklist}
              aria-label="Save go-bag checklist"
            >
              Save Checklist
            </button>
          </form>
        </section>

        <section
          className="home-latest-alerts"
          aria-labelledby="latest-alerts-title"
        >
          <h2 id="latest-alerts-title" className="home-section-title">
            Latest Alerts
          </h2>
          <div className="home-latest-alerts-list">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`home-latest-alert-item ${alert.severity}`}
              >
                {alert.text}{" "}
                <span className="home-alert-time">
                  {alert.severity === "high" ? "1 hour ago" : "RHI/VOLCS ago"}
                </span>
              </div>
            ))}
          </div>
        </section>

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
              size={20}
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
              size={20}
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
              size={20}
              color="white"
            />
            Edit Go-Bag
          </button>
        </div>
      </section>

      {error && (
        <div className="home-error" role="alert">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default Home;
