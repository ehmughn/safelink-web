import { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  X,
  AlertCircle,
  Shield,
  Radio,
  Clock,
  MapPin,
  TrendingUp,
  Activity,
} from "lucide-react";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";

// Mock data for demonstration
const mockAlerts = [
  {
    id: 1,
    text: "Typhoon Warning: Strong winds expected in Metro Manila",
    severity: "high",
    timestamp: Date.now() - 1000 * 60 * 30,
    source: "PAGASA",
    category: "Weather",
  },
  {
    id: 2,
    text: "Flood Alert: Rising water levels in Pasig River",
    severity: "medium",
    timestamp: Date.now() - 1000 * 60 * 120,
    source: "MMDA",
    category: "Flood",
  },
  {
    id: 3,
    text: "All clear: Weather conditions improving",
    severity: "low",
    timestamp: Date.now() - 1000 * 60 * 180,
    source: "Local Authority",
    category: "Update",
  },
];

const Alerts = () => {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [showSuccess, setShowSuccess] = useState(false);

  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    profile: { firstName: "", lastName: "", address: "" },
    email: "",
    phoneNumber: "",
  });

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
        await setupFamilyListener(firebaseUser.uid);
        await loadUserLocationAndEvacCenters();
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

  const handleImSafe = async () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    const newAlert = {
      id: Date.now(),
      text: "You marked yourself as safe!",
      severity: "low",
      timestamp: Date.now(),
      source: "Self Check-in",
      category: "Status",
    };

    setAlerts((prev) => [newAlert, ...prev]);
  };

  const dismissAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "high":
        return <AlertTriangle size={20} />;
      case "medium":
        return <AlertCircle size={20} />;
      case "low":
        return <CheckCircle size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return { bg: "#fef2f2", border: "#ef4444", text: "#991b1b" };
      case "medium":
        return { bg: "#fffbeb", border: "#f59e0b", text: "#92400e" };
      case "low":
        return { bg: "#f0fdf4", border: "#22c55e", text: "#166534" };
      default:
        return { bg: "#f8fafc", border: "#94a3b8", text: "#475569" };
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filteredAlerts =
    filterSeverity === "all"
      ? alerts
      : alerts.filter((alert) => alert.severity === filterSeverity);

  const alertCounts = {
    high: alerts.filter((a) => a.severity === "high").length,
    medium: alerts.filter((a) => a.severity === "medium").length,
    low: alerts.filter((a) => a.severity === "low").length,
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

          * {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }

          body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }

          .alerts-container {
            background: #f8f9fc;
            min-height: 100vh;
          }

          .hero-gradient {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            position: relative;
            overflow: hidden;
          }

          .hero-gradient::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            opacity: 0.3;
          }

          .hero-title {
            font-size: 3.5rem;
            font-weight: 800;
            letter-spacing: -1px;
            text-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: fadeInUp 0.6s ease-out;
          }

          .hero-subtitle {
            font-size: 1.25rem;
            font-weight: 400;
            opacity: 0.95;
            animation: fadeInUp 0.8s ease-out;
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .dashboard-card {
            background: white;
            border-radius: 20px;
            border: none;
            box-shadow: 0 8px 30px rgba(0,0,0,0.08);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            overflow: hidden;
            position: relative;
          }

          .dashboard-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #FF5A1F, #E63946);
            transform: scaleX(0);
            transition: transform 0.3s ease;
          }

          .dashboard-card:hover::before {
            transform: scaleX(1);
          }

          .dashboard-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          }

          .stat-card {
            background: linear-gradient(135deg, #f6f8fb 0%, #ffffff 100%);
            border-radius: 16px;
            padding: 1.5rem;
            border: 2px solid #e2e8f0;
            transition: all 0.3s ease;
            cursor: pointer;
          }

          .stat-card:hover {
            border-color: #FF5A1F;
            transform: scale(1.02);
            box-shadow: 0 8px 25px rgba(255, 90, 31, 0.15);
          }

          .stat-card.active {
            border-color: #FF5A1F;
            background: linear-gradient(135deg, #fff5f1 0%, #ffe8e1 100%);
          }

          .stat-number {
            font-size: 2.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .stat-card.high .stat-number {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .stat-card.medium .stat-number {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .stat-card.low .stat-number {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .stat-label {
            font-size: 0.95rem;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .alert-card {
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            border-left: 4px solid;
            transition: all 0.3s ease;
            animation: slideInRight 0.4s ease-out;
          }

          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .alert-card:hover {
            transform: translateX(8px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          }

          .alert-icon-wrapper {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .alert-content {
            flex: 1;
          }

          .alert-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 0.5rem;
            line-height: 1.4;
          }

          .alert-meta {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
          }

          .alert-meta-item {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.875rem;
            color: #64748b;
          }

          .alert-category-badge {
            display: inline-flex;
            align-items: center;
            padding: 0.375rem 0.875rem;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 600;
            background: linear-gradient(135deg, #f6f8fb 0%, #e2e8f0 100%);
            color: #475569;
          }

          .btn-close-custom {
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            color: #94a3b8;
          }

          .btn-close-custom:hover {
            border-color: #ef4444;
            color: #ef4444;
            transform: rotate(90deg);
          }

          .action-button {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            border: none;
            border-radius: 16px;
            padding: 1.25rem 2rem;
            color: white;
            font-weight: 700;
            font-size: 1.1rem;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 8px 20px rgba(255, 90, 31, 0.3);
            position: relative;
            overflow: hidden;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
          }

          .action-button::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
          }

          .action-button:hover::before {
            width: 300px;
            height: 300px;
          }

          .action-button:hover {
            transform: translateY(-4px) scale(1.02);
            box-shadow: 0 12px 35px rgba(255, 90, 31, 0.4);
          }

          .empty-state {
            text-align: center;
            padding: 4rem 2rem;
          }

          .empty-state-icon {
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, #f6f8fb 0%, #e2e8f0 100%);
            border-radius: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            color: #94a3b8;
          }

          .empty-state h3 {
            font-size: 1.75rem;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 1rem;
          }

          .empty-state p {
            font-size: 1.1rem;
            color: #64748b;
          }

          .filter-chips {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
            margin-bottom: 2rem;
          }

          .filter-chip {
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            border: 2px solid #e2e8f0;
            background: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 0.95rem;
            color: #64748b;
          }

          .filter-chip:hover {
            border-color: #FF5A1F;
            color: #FF5A1F;
            transform: translateY(-2px);
          }

          .filter-chip.active {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            border-color: #FF5A1F;
            color: white;
            box-shadow: 0 4px 14px rgba(255, 90, 31, 0.3);
          }

          .success-toast {
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            border-left: 4px solid #22c55e;
            animation: slideInRight 0.4s ease-out;
            z-index: 1000;
            max-width: 400px;
          }

          .loading-spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #f3f4f6;
            border-top-color: #FF5A1F;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          @media (max-width: 768px) {
            .hero-title {
              font-size: 2.5rem;
            }
            
            .stat-number {
              font-size: 2rem;
            }

            .action-button {
              width: 100%;
              justify-content: center;
            }

            .filter-chips {
              justify-content: center;
            }

            .success-toast {
              right: 1rem;
              left: 1rem;
              max-width: none;
            }
          }
        `}
      </style>

      <div className="alerts-container">
        <Header profileData={profileData} />

        {/* Hero Section */}
        <section className="hero-gradient text-white py-5 position-relative">
          <div className="container py-4">
            <div className="text-center position-relative">
              <h1 className="hero-title mb-3">Alert Center</h1>
              <p className="hero-subtitle mb-4">
                Stay informed about emergency situations in your area
              </p>
              <div className="d-flex justify-content-center gap-3 flex-wrap">
                <div
                  className={`stat-card text-dark high ${
                    filterSeverity === "high" ? "active" : ""
                  }`}
                  onClick={() =>
                    setFilterSeverity(
                      filterSeverity === "high" ? "all" : "high"
                    )
                  }
                >
                  <div className="stat-number">{alertCounts.high}</div>
                  <div className="stat-label">Critical</div>
                </div>
                <div
                  className={`stat-card text-dark medium ${
                    filterSeverity === "medium" ? "active" : ""
                  }`}
                  onClick={() =>
                    setFilterSeverity(
                      filterSeverity === "medium" ? "all" : "medium"
                    )
                  }
                >
                  <div className="stat-number">{alertCounts.medium}</div>
                  <div className="stat-label">Warning</div>
                </div>
                <div
                  className={`stat-card text-dark low ${
                    filterSeverity === "low" ? "active" : ""
                  }`}
                  onClick={() =>
                    setFilterSeverity(filterSeverity === "low" ? "all" : "low")
                  }
                >
                  <div className="stat-number">{alertCounts.low}</div>
                  <div className="stat-label">Info</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container py-5 px-4" style={{ maxWidth: "900px" }}>
          {/* Quick Actions */}
          <div className="dashboard-card mb-4 p-4">
            <h3 className="h5 fw-bold mb-4 d-flex align-items-center gap-2">
              <Shield size={24} style={{ color: "#FF5A1F" }} />
              Quick Actions
            </h3>
            <div className="d-flex gap-3 flex-wrap">
              <button className="action-button" onClick={handleImSafe}>
                <CheckCircle size={24} />
                I'm Safe
              </button>
              <button
                className="action-button"
                style={{
                  background:
                    "linear-gradient(135deg, #f6f8fb 0%, #e2e8f0 100%)",
                  color: "#475569",
                  boxShadow: "none",
                }}
              >
                <Radio size={24} />
                Report Incident
              </button>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="filter-chips">
            <button
              className={`filter-chip ${
                filterSeverity === "all" ? "active" : ""
              }`}
              onClick={() => setFilterSeverity("all")}
            >
              All Alerts ({alerts.length})
            </button>
            <button
              className={`filter-chip ${
                filterSeverity === "high" ? "active" : ""
              }`}
              onClick={() => setFilterSeverity("high")}
            >
              Critical ({alertCounts.high})
            </button>
            <button
              className={`filter-chip ${
                filterSeverity === "medium" ? "active" : ""
              }`}
              onClick={() => setFilterSeverity("medium")}
            >
              Warning ({alertCounts.medium})
            </button>
            <button
              className={`filter-chip ${
                filterSeverity === "low" ? "active" : ""
              }`}
              onClick={() => setFilterSeverity("low")}
            >
              Info ({alertCounts.low})
            </button>
          </div>

          {/* Alerts List */}
          <div className="dashboard-card p-4">
            <h3 className="h5 fw-bold mb-4 d-flex align-items-center gap-2">
              <Bell size={24} style={{ color: "#FF5A1F" }} />
              Active Alerts
            </h3>

            {loading ? (
              <div className="empty-state">
                <div className="loading-spinner"></div>
                <p className="text-muted mt-3 mb-0">Loading alerts...</p>
              </div>
            ) : filteredAlerts.length > 0 ? (
              <div>
                {filteredAlerts.map((alert) => {
                  const colors = getSeverityColor(alert.severity);
                  return (
                    <div
                      key={alert.id}
                      className="alert-card"
                      style={{ borderLeftColor: colors.border }}
                    >
                      <div className="d-flex align-items-start gap-3">
                        <div
                          className="alert-icon-wrapper"
                          style={{
                            background: colors.bg,
                            color: colors.border,
                          }}
                        >
                          {getSeverityIcon(alert.severity)}
                        </div>

                        <div className="alert-content">
                          <div className="alert-title">{alert.text}</div>
                          <div className="alert-meta">
                            <div className="alert-meta-item">
                              <Clock size={16} />
                              <span>{formatTimestamp(alert.timestamp)}</span>
                            </div>
                            <div className="alert-meta-item">
                              <Radio size={16} />
                              <span>{alert.source}</span>
                            </div>
                            <span className="alert-category-badge">
                              {alert.category}
                            </span>
                          </div>
                        </div>

                        <button
                          className="btn-close-custom"
                          onClick={() => dismissAlert(alert.id)}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <CheckCircle size={50} className="text-success" />
                </div>
                <h3>All Clear</h3>
                <p>
                  No {filterSeverity !== "all" ? filterSeverity : ""} alerts at
                  this time
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Success Toast */}
        {showSuccess && (
          <div className="success-toast">
            <div className="d-flex align-items-center gap-3">
              <CheckCircle size={24} style={{ color: "#22c55e" }} />
              <div className="flex-grow-1">
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    color: "#1a202c",
                  }}
                >
                  Status Updated
                </div>
                <div style={{ color: "#64748b", fontSize: "0.95rem" }}>
                  Your family has been notified that you're safe
                </div>
              </div>
              <button
                className="btn-close-custom"
                onClick={() => setShowSuccess(false)}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="success-toast" style={{ borderLeftColor: "#ef4444" }}>
            <div className="d-flex align-items-center gap-3">
              <AlertTriangle size={24} style={{ color: "#ef4444" }} />
              <div className="flex-grow-1">
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    color: "#1a202c",
                  }}
                >
                  Error
                </div>
                <div style={{ color: "#64748b", fontSize: "0.95rem" }}>
                  {error}
                </div>
              </div>
              <button
                className="btn-close-custom"
                onClick={() => setError(null)}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Alerts;
