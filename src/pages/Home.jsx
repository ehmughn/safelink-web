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
  AlertCircle,
  Package,
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

  const getSeverityClass = (severity) => {
    switch (severity) {
      case "high":
        return "alert-danger";
      case "medium":
        return "alert-warning";
      case "low":
        return "alert-success";
      default:
        return "alert-info";
    }
  };

  return (
    <>
      <style>
        {`
          .hover-lift {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .hover-lift:hover {
            transform: translateY(-4px);
            box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.15) !important;
          }
          .cursor-pointer {
            cursor: pointer;
          }
          .letter-spacing-1 {
            letter-spacing: 1px;
          }
          .form-check-input:checked {
            background-color: #dc3545;
            border-color: #dc3545;
          }
          .sos-pulse {
            animation: sosPulse 2s infinite;
          }
          @keyframes sosPulse {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.5);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 0 0 15px rgba(220, 53, 69, 0);
            }
          }
          .action-btn-hover {
            transition: all 0.3s ease;
          }
          .action-btn-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 0.25rem 1rem rgba(220, 53, 69, 0.3);
          }
          .border-start-4 {
            border-left-width: 4px !important;
          }
          .leaflet-container {
            z-index: 1;
          }
        `}
      </style>

      <div className="min-vh-100 bg-light">
        <Header profileData={profileData} />

        {/* Hero Section */}
        <section
          className="text-center py-5 mb-4"
          style={{
            background: "linear-gradient(135deg, #FF5A1F 0%, #E63946 100%)",
          }}
        >
          <div className="container">
            <h1 className="display-4 fw-bold text-white mb-0 text-uppercase letter-spacing-1">
              Disaster Preparedness
            </h1>
          </div>
        </section>

        <div className="container px-3 px-md-4 pb-5">
          {/* Dashboard Grid */}
          <div className="row g-4 mb-4">
            {/* Alerts Card */}
            <div className="col-12">
              <div className="card border-0 shadow-sm h-100 hover-lift">
                <div className="card-body p-4">
                  <h2 className="card-title h5 text-uppercase fw-bold text-danger mb-3 d-flex align-items-center">
                    <Bell size={20} className="me-2" />
                    Alerts
                  </h2>

                  {alerts.length > 0 ? (
                    <div className="mb-3">
                      {alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`alert ${getSeverityClass(
                            alert.severity
                          )} d-flex justify-content-between align-items-center mb-2`}
                          role="alert"
                        >
                          <span>{alert.text}</span>
                          <button
                            type="button"
                            className="btn-close"
                            onClick={() => dismissAlert(alert.id)}
                            aria-label="Close"
                          ></button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="alert alert-info mb-3" role="alert">
                      <AlertCircle size={18} className="me-2" />
                      No active alerts at this time.
                    </div>
                  )}

                  <div className="d-flex gap-2 flex-wrap">
                    <ImSafeButton
                      onSafeUpdate={handleSafeUpdate}
                      size="normal"
                    />
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => navigate("/alerts")}
                    >
                      View All Alerts
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Family Status Card */}
            <div className="col-12 col-lg-6">
              <div
                className="card border-0 shadow-sm h-100 hover-lift cursor-pointer"
                onClick={() => navigate("/family")}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === "Enter" && navigate("/family")}
              >
                <div className="card-body p-4">
                  <h2 className="card-title h5 text-uppercase fw-bold text-danger mb-3 d-flex align-items-center">
                    <Users size={20} className="me-2" />
                    Family Status
                  </h2>

                  {familyLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-danger" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="text-muted mt-2 mb-0">
                        Loading family data...
                      </p>
                    </div>
                  ) : (
                    <FamilyStatusCard
                      familyMembers={familyMembers}
                      onRequestCheckIn={handleFamilyCheckIn}
                      isLoading={familyLoading}
                      showCheckInButton={true}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Evacuation Center Card */}
            <div className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm h-100 hover-lift">
                <div className="card-body p-4">
                  <h2 className="card-title h5 text-uppercase fw-bold text-danger mb-3 d-flex align-items-center">
                    <MapPin size={20} className="me-2" />
                    Nearest Evacuation Center
                  </h2>

                  <div
                    className="rounded overflow-hidden border"
                    style={{ height: "250px" }}
                  >
                    <MapContainer
                      center={[14.5547, 121.0244]}
                      zoom={13}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                    </MapContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Go-Bag Checklist Card */}
            <div className="col-12 col-md-6">
              <div className="card border-0 shadow-sm h-100 hover-lift">
                <div className="card-body p-4">
                  <h2 className="card-title h5 text-uppercase fw-bold text-danger mb-3 d-flex align-items-center">
                    <Package size={20} className="me-2" />
                    Go-Bag Checklist
                  </h2>

                  <div className="list-group list-group-flush mb-3">
                    {["food", "water", "clothes", "flashlight"].map((item) => (
                      <label
                        key={item}
                        className="list-group-item list-group-item-action d-flex align-items-center gap-3 border-0 px-0 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="form-check-input m-0 flex-shrink-0"
                          checked={checklist[item]}
                          onChange={() => handleChecklistChange(item)}
                          style={{ width: "1.25rem", height: "1.25rem" }}
                        />
                        <span className="fw-medium text-capitalize">
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-danger w-100"
                    onClick={handleSaveChecklist}
                  >
                    <CheckCircle size={18} className="me-2" />
                    Save Checklist
                  </button>
                </div>
              </div>
            </div>

            {/* Latest Alerts Card */}
            <div className="col-12 col-md-6">
              <div className="card border-0 shadow-sm h-100 hover-lift">
                <div className="card-body p-4">
                  <h2 className="card-title h5 text-uppercase fw-bold text-danger mb-3">
                    Latest Alerts
                  </h2>

                  <div className="list-group list-group-flush">
                    {alerts.length > 0 ? (
                      alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="list-group-item border-0 border-start border-danger border-start-4 px-3 py-2 mb-2 bg-light"
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <span className="fw-medium">{alert.text}</span>
                            <small className="text-muted ms-2 flex-shrink-0">
                              {alert.severity === "high"
                                ? "1 hour ago"
                                : "PAGASA-PHIVOLCS"}
                            </small>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="list-group-item border-0 border-start border-success border-start-4 px-3 py-2 bg-light">
                        <div className="d-flex justify-content-between align-items-start">
                          <span className="fw-medium">No recent alerts</span>
                          <small className="text-muted">All clear</small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Official Announcements Card */}
            <div className="col-12">
              <div className="card border-0 shadow-sm hover-lift">
                <div className="card-body p-4">
                  <h2 className="card-title h5 text-uppercase fw-bold text-danger mb-3">
                    Official Announcements
                  </h2>

                  <div className="list-group list-group-flush">
                    <div className="list-group-item border-0 border-start border-primary border-start-4 px-3 py-2 bg-light">
                      <div className="d-flex justify-content-between align-items-start">
                        <span className="fw-medium">
                          Emergency shelters are now open
                        </span>
                        <small className="text-muted ms-2">1 hour ago</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Section */}
          <section className="mb-4">
            <div className="card border-0 shadow">
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-12 col-sm-6 col-lg-3">
                    <button
                      className="btn btn-danger w-100 py-3 d-flex flex-column align-items-center justify-content-center gap-2 position-relative overflow-hidden sos-pulse action-btn-hover"
                      onClick={handleSOSAlert}
                      style={{ minHeight: "120px" }}
                    >
                      <span className="display-6 fw-bold">SOS</span>
                      <span className="small">Notify All</span>
                    </button>
                  </div>

                  <div className="col-12 col-sm-6 col-lg-3">
                    <button
                      className="btn btn-danger w-100 py-3 d-flex flex-column align-items-center justify-content-center gap-2 action-btn-hover"
                      onClick={handleFamilyCheckIn}
                      style={{ minHeight: "120px" }}
                    >
                      <Users size={32} />
                      <span className="fw-semibold">Family Check-In</span>
                    </button>
                  </div>

                  <div className="col-12 col-sm-6 col-lg-3">
                    <button
                      className="btn btn-danger w-100 py-3 d-flex flex-column align-items-center justify-content-center gap-2 action-btn-hover"
                      style={{ minHeight: "120px" }}
                    >
                      <MapPin size={32} />
                      <span className="fw-semibold">Find Location</span>
                    </button>
                  </div>

                  <div className="col-12 col-sm-6 col-lg-3">
                    <button
                      className="btn btn-danger w-100 py-3 d-flex flex-column align-items-center justify-content-center gap-2 action-btn-hover"
                      style={{ minHeight: "120px" }}
                    >
                      <CheckCircle size={32} />
                      <span className="fw-semibold">Edit Go-Bag</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Error Toast */}
        {error && (
          <div
            className="position-fixed bottom-0 end-0 p-3"
            style={{ zIndex: 1050 }}
          >
            <div className="toast show" role="alert">
              <div className="toast-header bg-danger text-white">
                <AlertTriangle size={18} className="me-2" />
                <strong className="me-auto">Error</strong>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setError(null)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="toast-body">{error}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
