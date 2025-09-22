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
import "../styles/Family.css";

// Simplified inline modal components (replace with actual components if needed)
const SettingsModal = ({ onClose }) => (
  <div className="modal">
    <div className="modal-content">
      <h3>Family Settings</h3>
      <button onClick={onClose}>Close</button>
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
      className="modal"
      role="dialog"
      aria-labelledby="modal-title"
      onClick={handleOverlayClick}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h3 id="modal-title" className="modal-title">
            Confirmation
          </h3>
          <button
            className="modal-close"
            onClick={() => {
              setIsOpen(false);
              onCancel?.();
            }}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>
        <p>{message}</p>
        <div className="modal-actions">
          <button
            onClick={() => {
              setIsOpen(false);
              onConfirm();
            }}
            disabled={isLoading}
            aria-label="Confirm action"
          >
            {isLoading ? "Processing..." : "Confirm"}
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              onCancel?.();
            }}
            disabled={isLoading}
            aria-label="Cancel action"
          >
            Cancel
          </button>
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
      <div className="family-root">
        <div className="family-loading">
          <div className="loading-spinner"></div>
          <p>Loading family information...</p>
          {progress > 0 && (
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="family-root">
      <div className="family-header">
        <button className="back-button" onClick={() => navigate("/")}>
          ← Back to Home
        </button>
        <h1 className="family-title">Family</h1>
      </div>

      {error && (
        <div className="family-error" role="alert">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {view === "start" && (
        <div className="family-start">
          <div className="family-welcome">
            <Users size={48} className="welcome-icon" />
            <h2>Connect with Your Family</h2>
            <p>
              Stay connected and safe during emergencies by creating or joining
              a family group.
            </p>
          </div>

          <div className="family-actions">
            <button
              className="family-btn primary"
              onClick={handleCreateFamily}
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create New Family"}
            </button>
            <button
              className="family-btn secondary"
              onClick={() => setView("join")}
              disabled={isLoading}
            >
              Join Existing Family
            </button>
          </div>
        </div>
      )}

      {view === "create" && (
        <div className="family-create-block">
          <div className="create-success">
            <div className="success-icon">✓</div>
            <h2>Family Created Successfully!</h2>
            <p>Share this code with your family members so they can join:</p>
          </div>

          <div className="family-code-display">
            <div className="family-code">{generatedCode}</div>
            <div className="code-actions">
              <button
                className="action-btn"
                onClick={copyCodeToClipboard}
                title="Copy to clipboard"
              >
                <Copy size={16} />
                {copySuccess ? "Copied!" : "Copy"}
              </button>
              <button
                className="action-btn"
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
              Keep this code safe and only share it with trusted family members.
            </p>
          </div>

          <button
            className="family-btn primary"
            onClick={() => {
              setView("family");
              loadFamilyData(generatedCode);
            }}
          >
            Continue to Family Dashboard
          </button>
        </div>
      )}

      {view === "join" && (
        <div className="family-join-block">
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

          <button
            className="family-btn secondary"
            onClick={() => {
              setView("start");
              setError(null);
            }}
          >
            Back
          </button>
        </div>
      )}

      {view === "family" && familyData && (
        <div className="family-dashboard">
          <div className="dashboard-header">
            <div className="family-info">
              <h2>Family Dashboard</h2>
              <div className="family-code-info">
                <span>
                  Family Code: <strong>{familyCode}</strong>
                </span>
                <button
                  className="copy-code-btn"
                  onClick={() => navigator.clipboard.writeText(familyCode)}
                  title="Copy family code"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <div className="dashboard-actions">
              <button
                className="settings-btn"
                onClick={() => setShowSettings(true)}
                title="Family settings"
              >
                <Settings size={16} />
              </button>
              <button
                className="leave-btn"
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
                {familyMembers.filter((m) => m.status === "NO RESPONSE").length}
              </div>
            </div>
            <div className="stat-card">
              <h3>In Danger</h3>
              <div className="stat-value danger">
                {familyMembers.filter((m) => m.status === "DANGER").length}
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showLeaveConfirm && (
        <ConfirmationModal
          message="Are you sure you want to leave this family? This action cannot be undone."
          onConfirm={confirmLeaveFamily}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      )}
    </div>
  );
};

export default Family;
