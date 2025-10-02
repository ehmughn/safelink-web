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
import ImSafeButton from "../components/ImSafeButton";
import FamilyStatusCard from "../components/FamilyStatusCard";
import Header from "../components/Header";
import { FamilyService } from "../services/familyService";
import { SafeStatusService } from "../services/safeStatusService";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyCode, setFamilyCode] = useState(null);
  const [user, setUser] = useState(null);
  const [familyLoading, setFamilyLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Added missing state
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
  }, []); // Fixed dependency array

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
    <>
      <style>
        {`
          .home-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          }
          
          .home-welcome-section {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 3rem 0;
            text-align: center;
            margin-bottom: 2rem;
          }
          
          .home-welcome-title {
            color: #FF5A1F;
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0;
            letter-spacing: 1px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
          }
          
          .dashboard-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            border: none;
          }
          
          .dashboard-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          }
          
          .dashboard-card.clickable {
            cursor: pointer;
          }
          
          .section-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 1rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .alert-message {
            padding: 0.75rem 1rem;
            border-radius: 8px;
            margin-bottom: 0.75rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.875rem;
            transition: all 0.3s ease;
          }
          
          .alert-message.low {
            background-color: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
          }
          
          .alert-message.high {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
          }
          
          .alert-dismiss-btn {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 4px;
            transition: background-color 0.3s ease;
          }
          
          .alert-dismiss-btn:hover {
            background-color: rgba(0, 0, 0, 0.1);
          }
          
          .alert-actions {
            display: flex;
            gap: 0.75rem;
            margin-top: 1rem;
            flex-wrap: wrap;
          }
          
          .action-btn {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 90, 31, 0.3);
            background: linear-gradient(135deg, #E63946 0%, #c82333 100%);
          }
          
          .action-btn-secondary {
            background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
          }
          
          .action-btn-secondary:hover {
            background: linear-gradient(135deg, #5a6268 0%, #495057 100%);
            box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
          }
          
          .loading-text {
            color: #6c757d;
            font-style: italic;
            text-align: center;
            padding: 1rem;
          }
          
          .map-container {
            height: 200px;
            border-radius: 8px;
            overflow: hidden;
            border: 2px solid #e9ecef;
          }
          
          .checklist-form {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .checklist-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.5rem;
            border-radius: 6px;
            transition: background-color 0.3s ease;
            cursor: pointer;
          }
          
          .checklist-item:hover {
            background-color: #f8f9fa;
          }
          
          .checklist-item input[type="checkbox"] {
            width: 1.25rem;
            height: 1.25rem;
            accent-color: #FF5A1F;
          }
          
          .checklist-label {
            font-weight: 500;
            color: #374151;
            text-transform: capitalize;
          }
          
          .latest-alerts-list, .announcements-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .latest-alert-item, .announcement-item {
            padding: 0.75rem;
            background-color: #f8f9fa;
            border-radius: 6px;
            border-left: 4px solid #FF5A1F;
            font-size: 0.875rem;
            transition: background-color 0.3s ease;
          }
          
          .latest-alert-item:hover, .announcement-item:hover {
            background-color: #e9ecef;
          }
          
          .alert-time, .announcement-time {
            font-size: 0.75rem;
            color: #6c757d;
            font-weight: 400;
          }
          
          .actions-section {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            margin-top: 2rem;
          }
          
          .actions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
          }
          
          .action-btn-large {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            color: white;
            border: none;
            padding: 1.25rem;
            border-radius: 12px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            text-align: center;
            min-height: 100px;
            justify-content: center;
          }
          
          .action-btn-large:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(255, 90, 31, 0.3);
            background: linear-gradient(135deg, #E63946 0%, #c82333 100%);
          }
          
          .action-btn-sos {
            background: linear-gradient(135deg, #dc3545 0%, #b02a37 100%);
          }
          
          .action-btn-sos:hover {
            background: linear-gradient(135deg, #b02a37 0%, #8b1f2b 100%);
            box-shadow: 0 8px 25px rgba(220, 53, 69, 0.4);
          }
          
          .action-desc {
            font-size: 1.1rem;
            font-weight: 700;
          }
          
          .error-alert {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: #f8d7da;
            color: #721c24;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            border: 1px solid #f5c6cb;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            max-width: 350px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
          }
          
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @media (max-width: 768px) {
            .dashboard-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
            
            .actions-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            
            .home-welcome-title {
              font-size: 2rem;
            }
            
            .actions-section {
              margin: 1rem;
            }
          }
          
          @media (max-width: 576px) {
            .actions-grid {
              grid-template-columns: 1fr;
            }
            
            .alert-actions {
              flex-direction: column;
            }
          }
        `}
      </style>

      <div className="home-container">
        <Header profileData={profileData} />

        <section
          className="home-welcome-section"
          aria-labelledby="welcome-heading"
        >
          <div className="container">
            <h1 id="welcome-heading" className="home-welcome-title">
              DISASTER PREPAREDNESS
            </h1>
          </div>
        </section>

        <div className="container">
          <div className="dashboard-grid" role="grid">
            {/* Alerts Section */}
            <section className="dashboard-card" aria-labelledby="alerts-title">
              <h2 id="alerts-title" className="section-title">
                ALERTS
              </h2>
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`alert-message ${alert.severity}`}
                  >
                    <span>{alert.text}</span>
                    <button
                      className="alert-dismiss-btn"
                      onClick={() => dismissAlert(alert.id)}
                      aria-label="Dismiss alert"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="alert-message low">
                  No active alerts at this time.
                </div>
              )}
              <div className="alert-actions">
                <ImSafeButton onSafeUpdate={handleSafeUpdate} size="normal" />
                <button
                  className="action-btn action-btn-secondary"
                  onClick={() => navigate("/alerts")}
                  aria-label="View all alerts"
                >
                  View All Alerts
                </button>
              </div>
            </section>
            {/* Family Status Section */}
            <section
              className="dashboard-card clickable"
              aria-labelledby="family-title"
              onClick={() => navigate("/family")}
            >
              <h2 id="family-title" className="section-title">
                FAMILY STATUS
              </h2>
              {familyLoading ? (
                <div className="loading-text">Loading family data...</div>
              ) : (
                <FamilyStatusCard
                  familyMembers={familyMembers}
                  onRequestCheckIn={handleFamilyCheckIn}
                  isLoading={familyLoading}
                  showCheckInButton={true}
                />
              )}
            </section>
            {/* Evacuation Center Section */}
            <section
              className="dashboard-card"
              aria-labelledby="evacuation-title"
            >
              <h2 id="evacuation-title" className="section-title">
                Nearest Evacuation Center
              </h2>
              <MapContainer
                center={[14.5547, 121.0244]}
                zoom={13}
                className="map-container"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </MapContainer>
            </section>
            {/* Go-Bag Checklist Section */}
            <section className="dashboard-card" aria-labelledby="gobag-title">
              <h2 id="gobag-title" className="section-title">
                Go-Bag Checklist
              </h2>
              <form className="checklist-form">
                {["food", "water", "clothes", "flashlight"].map((item) => (
                  <label key={item} className="checklist-item">
                    <input
                      type="checkbox"
                      checked={checklist[item]}
                      onChange={() => handleChecklistChange(item)}
                    />
                    <span className="checklist-label">
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </span>
                  </label>
                ))}
                <button
                  type="button"
                  className="action-btn mt-3"
                  onClick={handleSaveChecklist}
                  aria-label="Save go-bag checklist"
                >
                  Save Checklist
                </button>
              </form>
            </section>
            {/* Latest Alerts Section */}
            <section
              className="dashboard-card"
              aria-labelledby="latest-alerts-title"
            >
              <h2 id="latest-alerts-title" className="section-title">
                Latest Alerts
              </h2>
              <div className="latest-alerts-list">
                {alerts.map((alert) => (
                  <div key={alert.id} className="latest-alert-item">
                    {alert.text}{" "}
                    <span className="alert-time">
                      {alert.severity === "high"
                        ? "1 hour ago"
                        : "PAGASA-PHIVOLCS"}
                    </span>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <div className="latest-alert-item">
                    No recent alerts{" "}
                    <span className="alert-time">All clear</span>
                  </div>
                )}
              </div>
            </section>
            {/* Official Announcements Section */}
            <section
              className="dashboard-card"
              aria-labelledby="announcements-title"
            >
              <h2 id="announcements-title" className="section-title">
                Official Announcements
              </h2>
              <div className="announcements-list">
                <div className="announcement-item">
                  Emergency shelters are now open{" "}
                  <span className="announcement-time">1 hour ago</span>
                </div>
              </div>
            </section>
          </div>

          {/* Action Buttons Section */}
          <section className="actions-section" aria-label="Action buttons">
            <div className="actions-grid">
              <button
                className="action-btn-large action-btn-sos"
                aria-label="Send SOS Notification"
                onClick={handleSOSAlert}
              >
                <span className="action-desc">SOS</span>
                Notify All
              </button>
              <button
                className="action-btn-large"
                aria-label="Initiate Family Check-In"
                onClick={handleFamilyCheckIn}
              >
                <Users size={24} color="white" />
                Family Check-In
              </button>
              <button
                className="action-btn-large"
                aria-label="Find Current Location"
              >
                <MapPin size={24} color="white" />
                Find Location
              </button>
              <button
                className="action-btn-large"
                aria-label="Edit Go-Bag Checklist"
              >
                <CheckCircle size={24} color="white" />
                Edit Go-Bag
              </button>
            </div>
          </section>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="error-alert" role="alert">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
