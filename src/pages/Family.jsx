import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import { FamilyService } from "../services/familyService";
import CodeVerification from "../components/CodeVerification";
import FamilyStatusCard from "../components/FamilyStatusCard";
import {
  Users,
  Copy,
  Share,
  Settings,
  LogOut,
  AlertTriangle,
  X,
} from "lucide-react";

// Simplified inline modal components (replace with actual components if needed)
const SettingsModal = ({ onClose }) => (
  <div
    className="modal d-block"
    role="dialog"
    aria-labelledby="settings-modal-title"
  >
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title" id="settings-modal-title">
            Family Settings
          </h5>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Close"
          ></button>
        </div>
        <div className="modal-body">
          <p>Family settings content goes here...</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
);

const ConfirmationModal = ({ message, onConfirm, onCancel, isLoading }) => {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(false);
      onCancel?.();
    }, 30000); // Auto-close after 30 seconds

    const handleEsc = (event) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        onCancel?.();
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onCancel, isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
      onCancel?.();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal d-block"
      role="dialog"
      aria-labelledby="confirm-modal-title"
      onClick={handleOverlayClick}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="confirm-modal-title">
              Confirmation
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => {
                setIsOpen(false);
                onCancel?.();
              }}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <p>{message}</p>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-safelink"
              onClick={() => {
                setIsOpen(false);
                onConfirm();
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsOpen(false);
                onCancel?.();
              }}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Family = () => {
  const navigate = useNavigate();
  const [view, setView] = useState("loading"); // loading | start | create | join | family
  const [familyCode, setFamilyCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [user, setUser] = useState(null);
  const [familyData, setFamilyData] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        navigate("/login");
        return;
      }

      setUser(firebaseUser);
      await checkUserFamilyStatus(firebaseUser.uid);
    });

    return () => unsubscribe();
  }, [navigate]);

  const checkUserFamilyStatus = async (userId) => {
    try {
      const result = await FamilyService.getUserFamilyCode(userId);

      if (result.success && result.familyCode) {
        await loadFamilyData(result.familyCode);
        setView("family");
      } else {
        setView("start");
      }
    } catch (error) {
      console.error("Error checking family status:", error);
      setError("Failed to load family information");
      setView("start");
    }
  };

  const loadFamilyData = async (code) => {
    try {
      const result = await FamilyService.getFamilyData(code);

      if (result.success) {
        setFamilyData(result.data);
        setFamilyMembers(result.data.members || []);
        setFamilyCode(code);

        const unsubscribe = FamilyService.subscribeFamilyUpdates(
          code,
          (updateResult) => {
            if (updateResult.success && updateResult.data) {
              setFamilyData(updateResult.data);
              setFamilyMembers(updateResult.data.members || []);
            }
          }
        );

        return unsubscribe;
      } else {
        setError(result.error || "Failed to load family data");
      }
    } catch (error) {
      console.error("Error loading family data:", error);
      setError("Failed to load family data");
    }
  };

  const handleCreateFamily = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
    }, 500);

    try {
      const result = await FamilyService.createFamily(
        user.uid,
        user.displayName || user.email.split("@")[0],
        user.email
      );

      if (result.success) {
        setGeneratedCode(result.familyCode);
        setView("create");
      } else {
        setError(result.error || "Failed to create family");
      }
    } catch (error) {
      console.error("Error creating family:", error);
      setError("Failed to create family. Please try again.");
    } finally {
      clearInterval(interval);
      setProgress(100);
      setIsLoading(false);
    }
  };

  const handleJoinFamily = async (code) => {
    if (!user || !code) return;

    setIsLoading(true);
    setError(null);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
    }, 500);

    try {
      const result = await FamilyService.joinFamily(
        code,
        user.uid,
        user.displayName || user.email.split("@")[0],
        user.email
      );

      if (result.success) {
        await loadFamilyData(code);
        setView("family");
      } else {
        setError(result.error || "Invalid family code or failed to join");
      }
    } catch (error) {
      console.error("Error joining family:", error);
      setError("Failed to join family. Please check the code and try again.");
    } finally {
      clearInterval(interval);
      setProgress(100);
      setIsLoading(false);
    }
  };

  const copyCodeToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const shareCode = async () => {
    const shareData = {
      title: "SafeLink Family Code",
      text: `Join my SafeLink family using this code: ${generatedCode}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyCodeToClipboard();
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleLeaveFamily = async () => {
    if (!user || !familyCode) return;

    setShowLeaveConfirm(true);
  };

  const confirmLeaveFamily = async () => {
    setShowLeaveConfirm(false);
    setIsLoading(true);

    try {
      const result = await FamilyService.leaveFamily(familyCode, user.uid);

      if (result.success) {
        setFamilyData(null);
        setFamilyMembers([]);
        setFamilyCode("");
        setView("start");
      } else {
        setError(result.error || "Failed to leave family");
      }
    } catch (error) {
      console.error("Error leaving family:", error);
      setError("Failed to leave family");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFamilyCheckIn = async () => {
    if (!user || !familyCode) return;

    setIsLoading(true);
    try {
      const result = await FamilyService.sendFamilyCheckIn(
        familyCode,
        user.uid,
        user.displayName || user.email
      );

      if (result.success) {
        setError("Check-in request sent successfully!");
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error("Error sending check-in request:", error);
      setError("Failed to send check-in request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberClick = (member) => {
    console.log("Member details:", member);
  };

  if (view === "loading") {
    return (
      <>
        <style>
          {`
            .family-loading {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              text-align: center;
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            }
            .loading-spinner {
              width: 50px;
              height: 50px;
              border: 4px solid #e9ecef;
              border-top: 4px solid #FF5A1F;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin-bottom: 1rem;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .progress-bar {
              width: 300px;
              height: 8px;
              background-color: #e9ecef;
              border-radius: 4px;
              overflow: hidden;
              margin-top: 1rem;
            }
            .progress-fill {
              height: 100%;
              background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
              transition: width 0.3s ease;
            }
          `}
        </style>
        <div className="family-loading">
          <div className="loading-spinner"></div>
          <p className="text-muted">Loading family information...</p>
          {progress > 0 && (
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Custom CSS for maintaining original design and hover effects */}
      <style>
        {`
          .family-root {
            min-height: 100vh;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          }
          
          .family-header {
            background: white;
            border-bottom: 1px solid #e9ecef;
            padding: 1.5rem 0;
          }
          
          .family-title {
            font-size: 1.75rem;
            font-weight: 600;
            color: #1a1a1a;
            margin: 0;
          }
          
          .back-button {
            background: none;
            border: none;
            color: #6c757d;
            font-size: 0.95rem;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 6px;
            transition: all 0.3s ease;
            margin-bottom: 1rem;
          }
          
          .back-button:hover {
            background-color: #f8f9fa;
            color: #FF5A1F;
          }
          
          .family-error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          
          .family-error button {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            font-size: 1.25rem;
            margin-left: auto;
          }
          
          .family-welcome {
            text-align: center;
            margin-bottom: 2rem;
          }
          
          .welcome-icon {
            color: #FF5A1F;
            margin-bottom: 1rem;
          }
          
          .family-welcome h2 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 1rem;
          }
          
          .family-welcome p {
            color: #6c757d;
            line-height: 1.6;
            max-width: 500px;
            margin: 0 auto;
          }
          
          .family-actions {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            max-width: 300px;
            margin: 0 auto;
          }
          
          .btn-safelink {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            border: 2px solid #FF5A1F;
            color: white;
            font-weight: 600;
            transition: all 0.3s ease;
            padding: 0.875rem 1.5rem;
            border-radius: 8px;
          }
          
          .btn-safelink:hover:not(:disabled) {
            background: linear-gradient(135deg, #E63946 0%, #c82333 100%);
            border-color: #E63946;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 90, 31, 0.3);
          }
          
          .btn-safelink:focus {
            background: linear-gradient(135deg, #E63946 0%, #c82333 100%);
            border-color: #E63946;
            color: white;
            box-shadow: 0 0 0 0.25rem rgba(255, 90, 31, 0.25);
          }
          
          .btn-safelink:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          
          .create-success {
            text-align: center;
            margin-bottom: 2rem;
          }
          
          .success-icon {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: bold;
            margin: 0 auto 1rem;
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
          }
          
          .family-code-display {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            text-align: center;
            margin-bottom: 2rem;
          }
          
          .family-code {
            font-size: 2rem;
            font-weight: 700;
            letter-spacing: 0.25rem;
            color: #FF5A1F;
            background: linear-gradient(135deg, #fff5f1 0%, #ffe8e1 100%);
            padding: 1rem 2rem;
            border-radius: 8px;
            margin-bottom: 1.5rem;
            border: 2px solid #FF5A1F;
          }
          
          .code-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
          }
          
          .action-btn {
            background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
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
            background: linear-gradient(135deg, #5a6268 0%, #495057 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
          }
          
          .create-help {
            background: #e7f3ff;
            border: 1px solid #bee5eb;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 2rem;
          }
          
          .create-help p {
            color: #0c5460;
            margin: 0 0 0.5rem 0;
            font-size: 0.9rem;
          }
          
          .create-help p:last-child {
            margin-bottom: 0;
          }
          
          .join-header {
            text-align: center;
            margin-bottom: 2rem;
          }
          
          .join-header h2 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 0.5rem;
          }
          
          .join-header p {
            color: #6c757d;
          }
          
          .dashboard-header {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
          }
          
          .family-info h2 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1a1a1a;
            margin: 0 0 0.5rem 0;
          }
          
          .family-code-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #6c757d;
            font-size: 0.9rem;
          }
          
          .copy-code-btn {
            background: none;
            border: none;
            color: #FF5A1F;
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 4px;
            transition: all 0.3s ease;
          }
          
          .copy-code-btn:hover {
            background-color: #fff5f1;
          }
          
          .dashboard-actions {
            display: flex;
            gap: 0.75rem;
          }
          
          .settings-btn, .leave-btn {
            background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .settings-btn:hover, .leave-btn:hover {
            background: linear-gradient(135deg, #5a6268 0%, #495057 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
          }
          
          .leave-btn {
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
          }
          
          .leave-btn:hover {
            background: linear-gradient(135deg, #c82333 0%, #a71e2a 100%);
            box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
          }
          
          .family-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 2rem;
          }
          
          .stat-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            text-align: center;
            transition: transform 0.3s ease;
          }
          
          .stat-card:hover {
            transform: translateY(-4px);
          }
          
          .stat-card h3 {
            font-size: 0.875rem;
            font-weight: 600;
            color: #6c757d;
            margin: 0 0 0.5rem 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: #1a1a1a;
          }
          
          .stat-value.safe {
            color: #28a745;
          }
          
          .stat-value.warning {
            color: #ffc107;
          }
          
          .stat-value.danger {
            color: #dc3545;
          }
          
          @media (max-width: 768px) {
            .family-actions {
              max-width: 100%;
            }
            
            .dashboard-header {
              flex-direction: column;
              align-items: flex-start;
            }
            
            .family-stats {
              grid-template-columns: repeat(2, 1fr);
            }
            
            .code-actions {
              flex-direction: column;
            }
          }
          
          @media (max-width: 576px) {
            .family-stats {
              grid-template-columns: 1fr;
            }
            
            .family-code {
              font-size: 1.5rem;
              padding: 1rem;
            }
          }
        `}
      </style>

      <div className="family-root">
        <div className="family-header">
          <div className="container">
            <button className="back-button btn" onClick={() => navigate("/")}>
              ← Back to Home
            </button>
            <h1 className="family-title">Family</h1>
          </div>
        </div>

        <div className="container py-4">
          {error && (
            <div className="family-error alert" role="alert">
              <AlertTriangle size={20} />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="btn btn-sm">
                ×
              </button>
            </div>
          )}

          {view === "start" && (
            <div className="row justify-content-center">
              <div className="col-lg-6 col-md-8">
                <div className="family-welcome">
                  <Users size={48} className="welcome-icon" />
                  <h2>Connect with Your Family</h2>
                  <p>
                    Stay connected and safe during emergencies by creating or
                    joining a family group.
                  </p>
                </div>

                <div className="family-actions">
                  <button
                    className="btn btn-safelink btn-lg"
                    onClick={handleCreateFamily}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Creating...
                      </>
                    ) : (
                      "Create New Family"
                    )}
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-lg"
                    onClick={() => setView("join")}
                    disabled={isLoading}
                  >
                    Join Existing Family
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === "create" && (
            <div className="row justify-content-center">
              <div className="col-lg-6 col-md-8">
                <div className="create-success">
                  <div className="success-icon">✓</div>
                  <h2>Family Created Successfully!</h2>
                  <p>
                    Share this code with your family members so they can join:
                  </p>
                </div>

                <div className="family-code-display">
                  <div className="family-code">{generatedCode}</div>
                  <div className="code-actions">
                    <button
                      className="action-btn btn"
                      onClick={copyCodeToClipboard}
                      title="Copy to clipboard"
                    >
                      <Copy size={16} />
                      {copySuccess ? "Copied!" : "Copy"}
                    </button>
                    <button
                      className="action-btn btn"
                      onClick={shareCode}
                      title="Share code"
                    >
                      <Share size={16} />
                      Share
                    </button>
                  </div>
                </div>

                <div className="create-help">
                  <p>
                    Family members can use this 6-digit code to join your family
                    group.
                  </p>
                  <p>
                    Keep this code safe and only share it with trusted family
                    members.
                  </p>
                </div>

                <div className="text-center">
                  <button
                    className="btn btn-safelink btn-lg"
                    onClick={() => {
                      setView("family");
                      loadFamilyData(generatedCode);
                    }}
                  >
                    Continue to Family Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === "join" && (
            <div className="row justify-content-center">
              <div className="col-lg-6 col-md-8">
                <div className="join-header">
                  <h2>Join Family</h2>
                  <p>Enter the 6-digit code shared by your family member</p>
                </div>

                <CodeVerification
                  onVerify={handleJoinFamily}
                  isLoading={isLoading}
                  error={error}
                  title="Enter Family Code"
                />

                <div className="text-center mt-3">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setView("start");
                      setError(null);
                    }}
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === "family" && familyData && (
            <>
              <div className="dashboard-header">
                <div className="family-info">
                  <h2>Family Dashboard</h2>
                  <div className="family-code-info">
                    <span>
                      Family Code: <strong>{familyCode}</strong>
                    </span>
                    <button
                      className="copy-code-btn btn btn-sm"
                      onClick={() => navigator.clipboard.writeText(familyCode)}
                      title="Copy family code"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <div className="dashboard-actions">
                  <button
                    className="settings-btn btn"
                    onClick={() => setShowSettings(true)}
                    title="Family settings"
                  >
                    <Settings size={16} />
                  </button>
                  <button
                    className="leave-btn btn"
                    onClick={handleLeaveFamily}
                    title="Leave family"
                  >
                    <LogOut size={16} />
                    Leave
                  </button>
                </div>
              </div>

              <FamilyStatusCard
                familyMembers={familyMembers}
                onRequestCheckIn={handleFamilyCheckIn}
                onMemberClick={handleMemberClick}
                isLoading={isLoading}
                showCheckInButton={true}
              />

              <div className="family-stats">
                <div className="stat-card">
                  <h3>Total Members</h3>
                  <div className="stat-value">{familyMembers.length}</div>
                </div>
                <div className="stat-card">
                  <h3>Safe Members</h3>
                  <div className="stat-value safe">
                    {familyMembers.filter((m) => m.status === "SAFE").length}
                  </div>
                </div>
                <div className="stat-card">
                  <h3>Need Response</h3>
                  <div className="stat-value warning">
                    {
                      familyMembers.filter((m) => m.status === "NO RESPONSE")
                        .length
                    }
                  </div>
                </div>
                <div className="stat-card">
                  <h3>In Danger</h3>
                  <div className="stat-value danger">
                    {familyMembers.filter((m) => m.status === "DANGER").length}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} />
        )}
        {showLeaveConfirm && (
          <ConfirmationModal
            message="Are you sure you want to leave this family? This action cannot be undone."
            onConfirm={confirmLeaveFamily}
            onCancel={() => setShowLeaveConfirm(false)}
            isLoading={isLoading}
          />
        )}
      </div>
    </>
  );
};

export default Family;
