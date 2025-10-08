import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  onSnapshot,
  updateDoc,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../config/firebase";
import CodeVerification from "../components/CodeVerification";
import {
  Users,
  Copy,
  Share,
  LogOut,
  AlertTriangle,
  X,
  CheckCircle,
  XCircle,
  HelpCircle,
  Clock,
  Trash2,
  UserPlus,
  Shield,
  Activity,
  MapPin,
  Phone,
  Mail,
  Battery,
} from "lucide-react";
import Header from "../components/Header";
import { FamilyService } from "../services/familyService";

const Family = () => {
  const navigate = useNavigate();
  const [familyData, setFamilyData] = useState({
    family: [],
    familyCode: "",
    familyName: "",
    isAdmin: false,
    userStatus: "Not Yet Responded",
  });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("loading");
  const [generatedCode, setGeneratedCode] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({
    profile: { firstName: "", lastName: "", address: "" },
    email: "",
    phoneNumber: "",
  });
  const [isConfirmPopupOpen, setIsConfirmPopupOpen] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
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
      } else {
        setUser(null);
        setFamilyData({
          family: [],
          familyCode: "",
          familyName: "",
          isAdmin: false,
          userStatus: "Not Yet Responded",
        });
        setLoading(false);
        navigate("/login");
      }
    });
    return () => unsubscribeAuth();
  }, [navigate]);

  const setupFamilyListener = useCallback(async () => {
    if (!user?.uid) {
      setFamilyData({
        family: [],
        familyCode: "",
        familyName: "",
        isAdmin: false,
        userStatus: "Not Yet Responded",
      });
      setLoading(false);
      setView("start");
      return () => {};
    }

    setLoading(true);
    try {
      const familiesRef = collection(db, "families");
      const querySnapshot = await getDocs(familiesRef);

      let userFamily = null;

      for (const familyDoc of querySnapshot.docs) {
        const familyDocData = familyDoc.data();
        if (familyDocData.isArchived) continue;

        const memberFound = familyDocData.members?.find(
          (member) => member.userId === user.uid
        );

        if (memberFound) {
          userFamily = {
            id: familyDoc.id,
            ...familyDocData,
          };
          break;
        }
      }

      if (userFamily) {
        const familyDocRef = doc(db, "families", userFamily.id);
        const unsubscribeFamily = onSnapshot(
          familyDocRef,
          async (docSnapshot) => {
            if (docSnapshot.exists()) {
              const familyDocData = docSnapshot.data();
              const currentUserMember = familyDocData.members?.find(
                (member) => member.userId === user.uid
              );

              if (!currentUserMember) {
                setFamilyData({
                  family: [],
                  familyCode: "",
                  familyName: "",
                  isAdmin: false,
                  userStatus: "Not Yet Responded",
                });
                setView("start");
                setLoading(false);
                return;
              }

              const enrichedMembers = await Promise.all(
                (familyDocData.members || []).map(async (member) => {
                  try {
                    const userDocRef = doc(db, "users", member.userId);
                    const userDoc = await getDoc(userDocRef);
                    let phoneNumber = member.phoneNumber;
                    let emergencyLocation = null;
                    let locationData = null;
                    let updatedName = member.name;

                    if (userDoc.exists()) {
                      const userData = userDoc.data();
                      if (
                        userData.displayName &&
                        userData.displayName !== member.name
                      ) {
                        updatedName = userData.displayName;
                      } else if (
                        userData.profile?.firstName &&
                        userData.profile?.lastName
                      ) {
                        const profileName = `${userData.profile.firstName} ${userData.profile.lastName}`;
                        if (profileName !== member.name) {
                          updatedName = profileName;
                        }
                      }
                      if (!phoneNumber && userData.profile?.phoneNumber) {
                        phoneNumber = userData.profile.phoneNumber;
                      }
                      if (userData.profile?.coordinates) {
                        locationData = userData.profile.coordinates;
                      }
                    }

                    try {
                      const emergencyLocationRef = doc(
                        db,
                        "users",
                        member.userId,
                        "emergencyLocation",
                        "current"
                      );
                      const emergencyLocationDoc = await getDoc(
                        emergencyLocationRef
                      );
                      if (emergencyLocationDoc.exists()) {
                        emergencyLocation = emergencyLocationDoc.data();
                        locationData = emergencyLocation;
                      }
                    } catch (locationError) {}

                    return {
                      ...member,
                      name: updatedName,
                      phoneNumber,
                      emergencyLocation,
                      locationData,
                    };
                  } catch (error) {
                    console.error("Error enriching member data:", error);
                    return member;
                  }
                })
              );

              const sortedMembers = enrichedMembers.sort((a, b) => {
                if (a.userId === user.uid) return -1;
                if (b.userId === user.uid) return 1;
                return 0;
              });

              setFamilyData({
                family: sortedMembers,
                familyCode:
                  familyDocData.code || familyDocData.familyCode || "",
                familyName: familyDocData.familyName || "",
                isAdmin: currentUserMember?.isAdmin || false,
                userStatus: currentUserMember?.status || "Not Yet Responded",
              });
              setView("family");
            } else {
              setFamilyData({
                family: [],
                familyCode: "",
                familyName: "",
                isAdmin: false,
                userStatus: "Not Yet Responded",
              });
              setView("start");
            }
            setLoading(false);
          },
          (error) => {
            console.error("Snapshot error:", error);
            setError("Failed to load family information");
            setView("start");
            setLoading(false);
          }
        );

        return unsubscribeFamily;
      } else {
        setFamilyData({
          family: [],
          familyCode: "",
          familyName: "",
          isAdmin: false,
          userStatus: "Not Yet Responded",
        });
        setView("start");
        setLoading(false);
        return () => {};
      }
    } catch (error) {
      console.error("Error setting up family listener:", error);
      setError("Failed to load family information");
      setView("start");
      setLoading(false);
      return () => {};
    }
  }, [user?.uid]);

  useEffect(() => {
    let unsubscribe = () => {};
    if (user?.uid) {
      unsubscribe = setupFamilyListener();
    }
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [user?.uid, setupFamilyListener]);

  useEffect(() => {
    let timer;
    if (showLeaveConfirm && isConfirmPopupOpen) {
      timer = setTimeout(() => {
        setIsConfirmPopupOpen(false);
        setShowLeaveConfirm(false);
      }, 30000);

      const handleEsc = (event) => {
        if (event.key === "Escape") {
          setIsConfirmPopupOpen(false);
          setShowLeaveConfirm(false);
        }
      };

      document.addEventListener("keydown", handleEsc);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("keydown", handleEsc);
      };
    }
  }, [showLeaveConfirm, isConfirmPopupOpen]);

  const updateUserStatus = async (newStatus) => {
    if (!familyData.familyCode || !user?.uid) {
      console.error("Cannot update status: missing familyCode or userId");
      setError("Cannot update status: missing family information");
      return false;
    }

    try {
      const familyDocRef = doc(db, "families", familyData.familyCode);
      const familyDocSnap = await getDoc(familyDocRef);

      if (!familyDocSnap.exists()) {
        console.error("Family document not found:", familyData.familyCode);
        setError("Family not found");
        return false;
      }

      const currentFamilyData = familyDocSnap.data();
      const updatedMembers = currentFamilyData.members.map((member) => {
        if (member.userId === user.uid) {
          return {
            ...member,
            status: newStatus,
            lastUpdate: new Date().toISOString(),
          };
        }
        return member;
      });

      await updateDoc(familyDocRef, { members: updatedMembers });
      console.log("User status updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating user status:", error);
      setError("Failed to update status");
      return false;
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!user || !familyData.familyCode || !familyData.isAdmin) {
      setError("Only the creator can remove members");
      return;
    }

    try {
      const familyDocRef = doc(db, "families", familyData.familyCode);
      const familyDocSnap = await getDoc(familyDocRef);

      if (!familyDocSnap.exists()) {
        setError("Family not found");
        return;
      }

      const currentFamilyData = familyDocSnap.data();
      const memberToRemove = currentFamilyData.members.find(
        (member) => member.userId === memberId
      );

      if (!memberToRemove) {
        setError("Member not found in family");
        return;
      }

      await updateDoc(familyDocRef, {
        members: arrayRemove(memberToRemove),
      });
      console.log("Member removed successfully");
      setError("Member removed successfully");
      setTimeout(() => setError(null), 3000);
    } catch (error) {
      console.error("Error removing member:", error);
      setError("Failed to remove member");
    }
  };

  const handleCreateFamily = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    setProgress(0);
    setView("loading");

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
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await setupFamilyListener();
      } else {
        setError(result.error || "Failed to create family");
        setView("start");
      }
    } catch (error) {
      console.error("Error creating family:", error);
      setError("Failed to create family. Please try again.");
      setView("start");
    } finally {
      clearInterval(interval);
      setProgress(100);
      setIsLoading(false);
    }
  }, [user, setupFamilyListener]);

  const handleJoinFamily = useCallback(
    async (code) => {
      if (!user || !code) return;

      setIsLoading(true);
      setError(null);
      setProgress(0);
      setView("loading");

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
          await new Promise((resolve) => setTimeout(resolve, 1500));
          await setupFamilyListener();
        } else {
          setError(result.error || "Invalid family code or failed to join");
          setView("join");
        }
      } catch (error) {
        console.error("Error joining family:", error);
        setError("Failed to join family. Please check the code and try again.");
        setView("join");
      } finally {
        clearInterval(interval);
        setProgress(100);
        setIsLoading(false);
      }
    },
    [user, setupFamilyListener]
  );

  const copyCodeToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(
        generatedCode || familyData.familyCode
      );
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      setError("Failed to copy family code");
    }
  };

  const shareCode = async () => {
    const shareData = {
      title: "SafeLink Family Code",
      text: `Join my SafeLink family using this code: ${
        generatedCode || familyData.familyCode
      }`,
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
      setError("Failed to share family code");
    }
  };

  const handleLeaveFamily = () => {
    if (!user || !familyData.familyCode) return;

    setShowLeaveConfirm(true);
    setIsConfirmPopupOpen(true);
  };

  const handleCancelLeave = () => {
    setIsConfirmPopupOpen(false);
    setShowLeaveConfirm(false);
  };

  const confirmLeaveFamily = async () => {
    setShowLeaveConfirm(false);
    setIsConfirmPopupOpen(false);
    setIsLoading(true);

    try {
      const result = await FamilyService.leaveFamily(
        familyData.familyCode,
        user.uid
      );

      if (result.success) {
        setFamilyData({
          family: [],
          familyCode: "",
          familyName: "",
          isAdmin: false,
          userStatus: "Not Yet Responded",
        });
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
    if (!user || !familyData.familyCode) return;

    setIsLoading(true);
    try {
      const result = await FamilyService.sendFamilyCheckIn(
        familyData.familyCode,
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

  const handleStatusUpdate = async (status) => {
    const success = await updateUserStatus(status);
    if (success) {
      setError(`Status updated to ${status}!`);
      setTimeout(() => setError(null), 3000);
    } else {
      setError("Failed to update status");
    }
  };

  const FamilyStatusCard = React.memo(
    ({
      familyMembers = [],
      onRequestCheckIn,
      onMemberClick,
      isLoading = false,
      showCheckInButton = true,
    }) => {
      const [isRequestingCheckIn, setIsRequestingCheckIn] = useState(false);
      const [expandedMember, setExpandedMember] = useState(null);

      const getStatusIcon = (status) => {
        switch (status) {
          case "SAFE":
            return <CheckCircle size={20} />;
          case "DANGER":
            return <XCircle size={20} />;
          case "NO RESPONSE":
          case "Not Yet Responded":
            return <HelpCircle size={20} />;
          default:
            return <Clock size={20} />;
        }
      };

      const getStatusColor = (status) => {
        switch (status) {
          case "SAFE":
            return "#22c55e";
          case "DANGER":
            return "#ef4444";
          case "NO RESPONSE":
          case "Not Yet Responded":
            return "#f59e0b";
          default:
            return "#94a3b8";
        }
      };

      const formatLastSeen = (timestamp) => {
        if (!timestamp) return "Never";
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return "Just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440)
          return `${Math.floor(diffInMinutes / 60)}h ago`;
        return date.toLocaleDateString();
      };

      const getTotalMembersByStatus = (status) => {
        return familyMembers.filter((member) => member.status === status)
          .length;
      };

      const handleCheckInRequest = async () => {
        if (isRequestingCheckIn || !onRequestCheckIn) return;

        setIsRequestingCheckIn(true);
        try {
          await onRequestCheckIn();
        } catch (error) {
          console.error("Error requesting check-in:", error);
        } finally {
          setIsRequestingCheckIn(false);
        }
      };

      const getProgressPercentage = React.useMemo(() => {
        const safeCount = familyMembers.filter(
          (m) => m.status?.toUpperCase() === "SAFE"
        ).length;
        return familyMembers.length
          ? (safeCount / familyMembers.length) * 100
          : 0;
      }, [familyMembers]);

      if (familyMembers.length === 0) {
        return (
          <div className="dashboard-card empty-state-card">
            <div className="empty-state-icon-wrapper">
              <Users size={60} />
            </div>
            <h3>No Family Members Yet</h3>
            <p>
              Share your family code with loved ones to start monitoring their
              safety status.
            </p>
          </div>
        );
      }

      return (
        <div className="family-status-container">
          {/* Status Summary Grid */}
          <div className="status-grid">
            <div className="status-stat-card safe">
              <div className="status-stat-icon">
                <CheckCircle size={32} />
              </div>
              <div className="status-stat-number">
                {getTotalMembersByStatus("SAFE")}
              </div>
              <div className="status-stat-label">Safe</div>
            </div>

            <div className="status-stat-card warning">
              <div className="status-stat-icon">
                <HelpCircle size={32} />
              </div>
              <div className="status-stat-number">
                {getTotalMembersByStatus("NO RESPONSE") +
                  getTotalMembersByStatus("Not Yet Responded")}
              </div>
              <div className="status-stat-label">No Response</div>
            </div>

            <div className="status-stat-card danger">
              <div className="status-stat-icon">
                <XCircle size={32} />
              </div>
              <div className="status-stat-number">
                {getTotalMembersByStatus("DANGER")}
              </div>
              <div className="status-stat-label">In Danger</div>
            </div>

            <div className="status-stat-card total">
              <div className="status-stat-icon">
                <Users size={32} />
              </div>
              <div className="status-stat-number">{familyMembers.length}</div>
              <div className="status-stat-label">Total</div>
            </div>
          </div>

          {/* Members List */}
          <div className="dashboard-card members-card">
            {familyMembers.map((member, index) => (
              <div key={member.userId || index} className="member-card">
                <div className="member-card-header">
                  <div className="member-avatar">
                    {member.name
                      ? member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : "U"}
                  </div>
                  <div className="member-info">
                    <div className="member-name-row">
                      <h4>{member.name || "Unknown"}</h4>
                      {member.isAdmin && (
                        <span className="creator-badge">
                          <Shield size={14} />
                          Creator
                        </span>
                      )}
                    </div>
                    <div
                      className="member-status-badge"
                      style={{ color: getStatusColor(member.status) }}
                    >
                      {getStatusIcon(member.status)}
                      <span>{member.status || "Not Yet Responded"}</span>
                    </div>
                    <div className="member-last-seen">
                      <Clock size={14} />
                      <span>{formatLastSeen(member.lastUpdate)}</span>
                    </div>
                  </div>
                  <div className="member-actions">
                    {familyData.isAdmin &&
                      !member.isAdmin &&
                      member.userId !== user.uid && (
                        <button
                          className="btn-icon-danger"
                          onClick={() => handleRemoveMember(member.userId)}
                          title="Remove member"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                  </div>
                </div>

                {/* Expandable Details */}
                <div
                  className="member-details"
                  style={{
                    maxHeight: expandedMember === member.userId ? "500px" : "0",
                    opacity: expandedMember === member.userId ? 1 : 0,
                  }}
                >
                  <div className="member-details-grid">
                    <div className="detail-item">
                      <Mail size={18} />
                      <div>
                        <div className="detail-label">Email</div>
                        <div className="detail-value">
                          {member.email || "Not provided"}
                        </div>
                      </div>
                    </div>

                    <div className="detail-item">
                      <Phone size={18} />
                      <div>
                        <div className="detail-label">Phone</div>
                        <div className="detail-value">
                          {member.phoneNumber || "Not provided"}
                        </div>
                      </div>
                    </div>

                    <div className="detail-item">
                      <MapPin size={18} />
                      <div>
                        <div className="detail-label">Location</div>
                        <div className="detail-value">
                          {member.locationData
                            ? `${member.locationData.latitude.toFixed(
                                4
                              )}, ${member.locationData.longitude.toFixed(4)}`
                            : "Unknown"}
                        </div>
                      </div>
                    </div>

                    <div className="detail-item">
                      <Battery size={18} />
                      <div>
                        <div className="detail-label">Battery</div>
                        <div className="detail-value">
                          {member.battery ? `${member.battery}%` : "Unknown"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  className="btn-expand"
                  onClick={() =>
                    setExpandedMember(
                      expandedMember === member.userId ? null : member.userId
                    )
                  }
                >
                  {expandedMember === member.userId
                    ? "Hide Details"
                    : "Show Details"}
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }
  );

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

          * {
            font-family: 'Inter', sans-serif;
          }

          .family-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #f8f9fc 0%, #e9ecef 100%);
          }

          .family-hero {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            padding: 4rem 0 3rem;
            position: relative;
            overflow: hidden;
          }

          .family-hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            opacity: 0.3;
          }

          .hero-content {
            position: relative;
            z-index: 1;
            text-align: center;
            color: white;
          }

          .hero-title {
            font-size: 3rem;
            font-weight: 800;
            margin-bottom: 1rem;
            text-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: fadeInUp 0.6s ease-out;
          }

          .hero-subtitle {
            font-size: 1.25rem;
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
            border-radius: 24px;
            padding: 2rem;
            box-shadow: 0 8px 30px rgba(0,0,0,0.08);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            overflow: hidden;
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

          .empty-state-card {
            text-align: center;
            padding: 4rem 2rem;
          }

          .empty-state-icon-wrapper {
            width: 120px;
            height: 120px;
            background: linear-gradient(135deg, #f6f8fb 0%, #e2e8f0 100%);
            border-radius: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 2rem;
            color: #94a3b8;
          }

          .empty-state-card h3 {
            font-size: 1.75rem;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 1rem;
          }

          .empty-state-card p {
            font-size: 1.1rem;
            color: #64748b;
            max-width: 500px;
            margin: 0 auto;
          }

          .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
          }

          .status-stat-card {
            background: white;
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
            overflow: hidden;
          }

          .status-stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            transition: transform 0.3s ease;
            transform: scaleX(0);
          }

          .status-stat-card.safe::before {
            background: #22c55e;
          }

          .status-stat-card.warning::before {
            background: #f59e0b;
          }

          .status-stat-card.danger::before {
            background: #ef4444;
          }

          .status-stat-card.total::before {
            background: linear-gradient(90deg, #FF5A1F, #E63946);
          }

          .status-stat-card:hover::before {
            transform: scaleX(1);
          }

          .status-stat-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 12px 40px rgba(0,0,0,0.15);
          }

          .status-stat-icon {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1rem;
          }

          .status-stat-card.safe .status-stat-icon {
            background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
            color: #22c55e;
          }

          .status-stat-card.warning .status-stat-icon {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            color: #f59e0b;
          }

          .status-stat-card.danger .status-stat-icon {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            color: #ef4444;
          }

          .status-stat-card.total .status-stat-icon {
            background: linear-gradient(135deg, #fff5f1 0%, #ffe8e1 100%);
            color: #FF5A1F;
          }

          .status-stat-number {
            font-size: 3rem;
            font-weight: 800;
            line-height: 1;
            margin-bottom: 0.5rem;
          }

          .status-stat-card.safe .status-stat-number {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .status-stat-card.warning .status-stat-number {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .status-stat-card.danger .status-stat-number {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .status-stat-card.total .status-stat-number {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .status-stat-label {
            font-size: 1rem;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .members-card {
            padding: 0;
          }

          .member-card {
            padding: 2rem;
            border-bottom: 1px solid #f1f5f9;
            transition: all 0.3s ease;
          }

          .member-card:last-child {
            border-bottom: none;
          }

          .member-card:hover {
            background: #f8fafc;
          }

          .member-card-header {
            display: flex;
            align-items: flex-start;
            gap: 1.5rem;
          }

          .member-avatar {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 1.5rem;
            box-shadow: 0 4px 14px rgba(255, 90, 31, 0.3);
            flex-shrink: 0;
          }

          .member-info {
            flex: 1;
          }

          .member-name-row {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
          }

          .member-name-row h4 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 700;
            color: #1a202c;
          }

          .creator-badge {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.375rem 0.875rem;
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            color: #1e40af;
            border-radius: 10px;
            font-size: 0.85rem;
            font-weight: 600;
          }

          .member-status-badge {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
            font-size: 1rem;
            margin-bottom: 0.5rem;
          }

          .member-last-seen {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            color: #94a3b8;
            font-size: 0.9rem;
          }

          .member-actions {
            display: flex;
            gap: 0.5rem;
          }

          .btn-icon-danger {
            background: white;
            border: 2px solid #fee2e2;
            color: #ef4444;
            width: 44px;
            height: 44px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .btn-icon-danger:hover {
            background: #ef4444;
            border-color: #ef4444;
            color: white;
            transform: scale(1.1);
          }

          .member-details {
            overflow: hidden;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            margin-top: 0;
          }

          .member-details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 1.5rem;
            border-radius: 16px;
            margin-top: 1.5rem;
          }

          .detail-item {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            color: #64748b;
          }

          .detail-label {
            font-size: 0.85rem;
            font-weight: 600;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.25rem;
          }

          .detail-value {
            font-size: 1rem;
            font-weight: 600;
            color: #1a202c;
          }

          .btn-expand {
            background: none;
            border: none;
            color: #FF5A1F;
            font-weight: 600;
            font-size: 0.95rem;
            cursor: pointer;
            padding: 0.75rem 0;
            margin-top: 1rem;
            transition: all 0.3s ease;
          }

          .btn-expand:hover {
            color: #E63946;
            transform: translateX(4px);
          }

          .action-button {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            border: none;
            color: white;
            padding: 1rem 2.5rem;
            border-radius: 16px;
            font-weight: 700;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 8px 20px rgba(255, 90, 31, 0.3);
            position: relative;
            overflow: hidden;
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

          .action-button:disabled {
            background: #94a3b8;
            cursor: not-allowed;
            transform: none;
          }

          .action-button-secondary {
            background: white;
            border: 2px solid #FF5A1F;
            color: #FF5A1F;
          }

          .action-button-secondary:hover {
            background: #FF5A1F;
            color: white;
          }

          .status-buttons {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            margin-bottom: 2rem;
          }

          .status-button {
            flex: 1;
            min-width: 200px;
            padding: 1.25rem 2rem;
            border: none;
            border-radius: 16px;
            font-weight: 700;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 14px rgba(0,0,0,0.1);
          }

          .status-button.safe {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
          }

          .status-button.danger {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
          }

          .status-button:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          }

          .family-code-display {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 20px;
            padding: 2rem;
            text-align: center;
            margin-bottom: 2rem;
            border: 2px solid #e2e8f0;
          }

          .family-code-label {
            font-size: 0.95rem;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 1rem;
          }

          .family-code-value {
            font-size: 3rem;
            font-weight: 800;
            letter-spacing: 0.5rem;
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 1.5rem;
          }

          .code-actions {
            display: flex;
            justify-content: center;
            gap: 1rem;
          }

          .code-action-btn {
            background: white;
            border: 2px solid #e2e8f0;
            color: #64748b;
            padding: 0.875rem 1.75rem;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .code-action-btn:hover {
            border-color: #FF5A1F;
            color: #FF5A1F;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 90, 31, 0.2);
          }

          .loading-spinner {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 5rem 2rem;
          }

          .spinner {
            width: 60px;
            height: 60px;
            border: 4px solid #e2e8f0;
            border-top-color: #FF5A1F;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .loading-text {
            margin-top: 1.5rem;
            font-size: 1.1rem;
            color: #64748b;
            font-weight: 500;
          }

          .leave-confirm-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease-out;
          }

          .modal-content {
            background: white;
            border-radius: 24px;
            padding: 2.5rem;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .modal-title {
            font-size: 1.75rem;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 1rem;
          }

          .modal-text {
            font-size: 1.1rem;
            color: #64748b;
            margin-bottom: 2rem;
          }

          .modal-buttons {
            display: flex;
            gap: 1rem;
          }

          .notification-toast {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            max-width: 400px;
            animation: slideInRight 0.4s ease-out;
            z-index: 1001;
          }

          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(100px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .toast-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.5rem;
          }

          .toast-title {
            font-weight: 700;
            font-size: 1.1rem;
            color: #1a202c;
          }

          .toast-body {
            color: #64748b;
            font-size: 1rem;
          }

          .toast-close {
            background: none;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            padding: 0;
            margin-left: auto;
          }

          .toast-close:hover {
            color: #64748b;
          }

          @media (max-width: 768px) {
            .hero-title {
              font-size: 2rem;
            }

            .status-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 1rem;
            }

            .status-stat-number {
              font-size: 2rem;
            }

            .member-card-header {
              flex-direction: column;
              gap: 1rem;
            }

            .member-avatar {
              width: 56px;
              height: 56px;
              font-size: 1.25rem;
            }

            .member-details-grid {
              grid-template-columns: 1fr;
            }

            .status-buttons {
              flex-direction: column;
            }

            .status-button {
              min-width: 100%;
            }

            .family-code-value {
              font-size: 2rem;
            }

            .notification-toast {
              right: 1rem;
              left: 1rem;
              max-width: none;
            }
          }
        `}
      </style>

      <div className="family-container">
        <Header profileData={profileData} />

        {view === "loading" && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <div className="loading-text">Loading family data...</div>
          </div>
        )}

        {view === "start" && (
          <>
            <div className="family-hero">
              <div className="container">
                <div className="hero-content">
                  <h1 className="hero-title">Family Safety Network</h1>
                  <p className="hero-subtitle">
                    Stay connected with your loved ones during emergencies
                  </p>
                </div>
              </div>
            </div>

            <div
              className="container"
              style={{
                maxWidth: "600px",
                margin: "0 auto",
                padding: "3rem 1rem",
              }}
            >
              <div className="dashboard-card" style={{ textAlign: "center" }}>
                <div className="empty-state-icon-wrapper">
                  <Users size={60} />
                </div>
                <h3
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 700,
                    color: "#1a202c",
                    marginBottom: "1rem",
                  }}
                >
                  Get Started
                </h3>
                <p
                  style={{
                    fontSize: "1.1rem",
                    color: "#64748b",
                    marginBottom: "2.5rem",
                  }}
                >
                  Create a new family group or join an existing one to begin
                  monitoring safety status.
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <button
                    className="action-button"
                    onClick={handleCreateFamily}
                    disabled={isLoading}
                  >
                    <UserPlus size={20} style={{ marginRight: "0.5rem" }} />
                    Create Family Group
                  </button>
                  <button
                    className="action-button action-button-secondary"
                    onClick={() => setView("join")}
                    disabled={isLoading}
                  >
                    Join Existing Family
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {view === "join" && (
          <>
            <div className="family-hero">
              <div className="container">
                <div className="hero-content">
                  <h1 className="hero-title">Join Family</h1>
                  <p className="hero-subtitle">
                    Enter the 6-digit code to join your family group
                  </p>
                </div>
              </div>
            </div>

            <div
              className="container"
              style={{
                maxWidth: "600px",
                margin: "0 auto",
                padding: "3rem 1rem",
              }}
            >
              <div className="dashboard-card">
                <CodeVerification
                  onVerify={handleJoinFamily}
                  isLoading={isLoading}
                  progress={progress}
                />
                <button
                  className="action-button action-button-secondary"
                  onClick={() => setView("start")}
                  disabled={isLoading}
                  style={{ marginTop: "1.5rem", width: "100%" }}
                >
                  Back
                </button>
              </div>
            </div>
          </>
        )}

        {view === "family" && (
          <>
            <div className="family-hero">
              <div className="container">
                <div className="hero-content">
                  <h1 className="hero-title">
                    {familyData.familyName || "Family"} Dashboard
                  </h1>
                  <p className="hero-subtitle">
                    Monitor and manage your family's safety status
                  </p>
                </div>
              </div>
            </div>

            <div
              className="container"
              style={{
                maxWidth: "1200px",
                margin: "0 auto",
                padding: "3rem 1rem",
              }}
            >
              {/* Family Code Display */}
              {familyData.familyCode && (
                <div className="family-code-display">
                  <div className="family-code-label">Your Family Code</div>
                  <div className="family-code-value">
                    {familyData.familyCode}
                  </div>
                  <div className="code-actions">
                    <button
                      className="code-action-btn"
                      onClick={copyCodeToClipboard}
                    >
                      <Copy size={18} />
                      {copySuccess ? "Copied!" : "Copy Code"}
                    </button>
                    {familyData.isAdmin && (
                      <button className="code-action-btn" onClick={shareCode}>
                        <Share size={18} />
                        Share
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Status Buttons */}
              <div className="dashboard-card" style={{ marginBottom: "2rem" }}>
                <h3
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#1a202c",
                    marginBottom: "1.5rem",
                  }}
                >
                  <Activity
                    size={24}
                    style={{
                      verticalAlign: "middle",
                      marginRight: "0.5rem",
                      color: "#FF5A1F",
                    }}
                  />
                  Update Your Status
                </h3>
                <div className="status-buttons">
                  <button
                    className="status-button safe"
                    onClick={() => handleStatusUpdate("SAFE")}
                    disabled={isLoading}
                  >
                    <CheckCircle size={24} style={{ marginRight: "0.5rem" }} />
                    I'm Safe
                  </button>
                  <button
                    className="status-button danger"
                    onClick={() => handleStatusUpdate("DANGER")}
                    disabled={isLoading}
                  >
                    <XCircle size={24} style={{ marginRight: "0.5rem" }} />
                    Need Help
                  </button>
                </div>
              </div>

              {/* Family Status Card */}
              <FamilyStatusCard
                familyMembers={familyData.family}
                onRequestCheckIn={handleFamilyCheckIn}
                onMemberClick={handleMemberClick}
                isLoading={loading}
                showCheckInButton={true}
              />

              {/* Leave Family Button */}
              <div style={{ textAlign: "center", marginTop: "3rem" }}>
                <button
                  style={{
                    background: "white",
                    border: "2px solid #fee2e2",
                    color: "#ef4444",
                    padding: "1rem 2rem",
                    borderRadius: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onClick={handleLeaveFamily}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#ef4444";
                    e.target.style.borderColor = "#ef4444";
                    e.target.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "white";
                    e.target.style.borderColor = "#fee2e2";
                    e.target.style.color = "#ef4444";
                  }}
                >
                  <LogOut
                    size={18}
                    style={{ marginRight: "0.5rem", verticalAlign: "middle" }}
                  />
                  Leave Family
                </button>
              </div>
            </div>
          </>
        )}

        {/* Leave Confirmation Modal */}
        {showLeaveConfirm && isConfirmPopupOpen && (
          <div className="leave-confirm-modal" onClick={handleCancelLeave}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">Leave Family?</h3>
              <p className="modal-text">
                Are you sure you want to leave this family group? You'll need a
                new invitation code to rejoin.
              </p>
              <div className="modal-buttons">
                <button
                  className="action-button action-button-secondary"
                  onClick={handleCancelLeave}
                  disabled={isLoading}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  className="action-button"
                  onClick={confirmLeaveFamily}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    background:
                      "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  }}
                >
                  {isLoading ? "Leaving..." : "Leave"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {error && (
          <div className="notification-toast">
            <div className="toast-header">
              {error.includes("successfully") ? (
                <CheckCircle size={24} color="#22c55e" />
              ) : (
                <AlertTriangle size={24} color="#ef4444" />
              )}
              <span className="toast-title">
                {error.includes("successfully") ? "Success" : "Notice"}
              </span>
              <button className="toast-close" onClick={() => setError(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="toast-body">{error}</div>
          </div>
        )}
      </div>
    </>
  );
};

export default Family;
