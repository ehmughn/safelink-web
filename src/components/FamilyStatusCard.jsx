import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  Shield,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  MoreVertical,
  CheckCircle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import "../styles/FamilyStatusCard.css";

const FamilyStatusCard = React.memo(
  ({
    familyMembers = [],
    onRequestCheckIn,
    onMemberClick,
    isLoading = false,
    showCheckInButton = true,
  }) => {
    const [isRequestingCheckIn, setIsRequestingCheckIn] = useState(false);
    const [isListExpanded, setIsListExpanded] = useState(false);
    const [expandedMember, setExpandedMember] = useState(null);

    const getStatusIcon = (status) => {
      switch (status) {
        case "SAFE":
          return <CheckCircle className="text-success" size={20} />;
        case "DANGER":
          return <XCircle className="text-danger" size={20} />;
        case "NO RESPONSE":
          return <HelpCircle className="text-warning" size={20} />;
        default:
          return <Clock className="text-muted" size={20} />;
      }
    };

    const getStatusBadge = (status) => {
      switch (status) {
        case "SAFE":
          return "badge bg-success";
        case "DANGER":
          return "badge bg-danger";
        case "NO RESPONSE":
          return "badge bg-warning text-dark";
        default:
          return "badge bg-secondary";
      }
    };

    const formatLastSeen = (timestamp) => {
      if (!timestamp) return "Never";
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));

      if (diffInMinutes < 1) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return date.toLocaleDateString();
    };

    const getTotalMembersByStatus = (status) => {
      return familyMembers.filter((member) => member.status === status).length;
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

    const getOverallStatusText = useMemo(() => {
      const memberCount = familyMembers.length;
      const overallStatus = getOverallStatus(familyMembers);

      switch (overallStatus) {
        case "safe":
          return `All ${memberCount} members are safe`;
        case "danger":
          return "Emergency: Family member in danger";
        case "warning":
          return "Some members have not responded";
        case "mixed":
          return "Mixed status - check individual members";
        default:
          return "No family members";
      }
    }, [familyMembers]);

    const getProgressPercentage = useMemo(() => {
      const safeCount = familyMembers.filter(
        (m) => m.status?.toUpperCase() === "SAFE"
      ).length;
      return familyMembers.length
        ? (safeCount / familyMembers.length) * 100
        : 0;
    }, [familyMembers]);

    const toggleListExpand = useCallback(() => {
      setIsListExpanded((prev) => !prev);
    }, []);

    if (familyMembers.length === 0) {
      return (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <Users className="text-muted mb-3" size={48} />
            <h5 className="card-title text-muted">No Family Members</h5>
            <p className="card-text text-muted">
              Invite family members to start monitoring their safety status.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="family-status-container">
        {/* Status Summary Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3 col-sm-6">
            <div className="card border-0 bg-success bg-opacity-10 h-100">
              <div className="card-body text-center">
                <CheckCircle className="text-success mb-2" size={32} />
                <h4 className="text-success mb-1">
                  {getTotalMembersByStatus("SAFE")}
                </h4>
                <small className="text-success fw-semibold">Safe</small>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="card border-0 bg-warning bg-opacity-10 h-100">
              <div className="card-body text-center">
                <HelpCircle className="text-warning mb-2" size={32} />
                <h4 className="text-warning mb-1">
                  {getTotalMembersByStatus("NO RESPONSE")}
                </h4>
                <small className="text-warning fw-semibold">No Response</small>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="card border-0 bg-danger bg-opacity-10 h-100">
              <div className="card-body text-center">
                <XCircle className="text-danger mb-2" size={32} />
                <h4 className="text-danger mb-1">
                  {getTotalMembersByStatus("DANGER")}
                </h4>
                <small className="text-danger fw-semibold">In Danger</small>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="card border-0 bg-primary bg-opacity-10 h-100">
              <div className="card-body text-center">
                <Users className="text-primary mb-2" size={32} />
                <h4 className="text-primary mb-1">{familyMembers.length}</h4>
                <small className="text-primary fw-semibold">
                  Total Members
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Family Members List */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-bottom">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0 d-flex align-items-center gap-2">
                <Shield className="text-primary" size={20} />
                Family Safety Status
              </h5>
              {showCheckInButton && (
                <button
                  className="btn btn-safelink btn-sm"
                  onClick={handleCheckInRequest}
                  disabled={isRequestingCheckIn || !familyMembers.length}
                  aria-label="Request status update from all family members"
                  title="Request status update from all family members"
                >
                  {isRequestingCheckIn ? "Requesting..." : "Check-In"}
                </button>
              )}
            </div>
          </div>
          <div className="card-body p-0">
            <div className="list-group list-group-flush">
              {familyMembers.map((member, index) => (
                <div
                  key={member.id || index}
                  className="list-group-item border-0"
                >
                  <div className="d-flex align-items-center">
                    {/* Member Avatar */}
                    <div className="flex-shrink-0 me-3">
                      <div
                        className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "48px", height: "48px" }}
                      >
                        {member.name
                          ? member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : "U"}
                      </div>
                    </div>

                    {/* Member Info */}
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1 fw-semibold">
                            {member.name || "Unknown"}
                          </h6>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            {getStatusIcon(member.status)}
                            <span className={getStatusBadge(member.status)}>
                              {member.status || "Unknown"}
                            </span>
                          </div>
                          <small className="text-muted d-flex align-items-center gap-1">
                            <Clock size={12} />
                            Last seen: {formatLastSeen(member.lastSeen)}
                          </small>
                        </div>

                        {/* Action Menu */}
                        <div className="dropdown">
                          <button
                            className="btn btn-sm btn-outline-secondary dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <MoreVertical size={16} />
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end">
                            <li>
                              <button
                                className="dropdown-item d-flex align-items-center gap-2"
                                onClick={() => onMemberClick?.(member)}
                              >
                                <Phone size={16} />
                                Call
                              </button>
                            </li>
                            <li>
                              <button
                                className="dropdown-item d-flex align-items-center gap-2"
                                onClick={() => onMemberClick?.(member)}
                              >
                                <MessageCircle size={16} />
                                Message
                              </button>
                            </li>
                            <li>
                              <button
                                className="dropdown-item d-flex align-items-center gap-2"
                                onClick={() => onMemberClick?.(member)}
                              >
                                <MapPin size={16} />
                                View Location
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Expandable Details */}
                      {expandedMember === member.id && (
                        <div className="mt-3 p-3 bg-light rounded">
                          <div className="row g-2">
                            <div className="col-md-6">
                              <small className="text-muted d-block">
                                Email
                              </small>
                              <span className="fw-medium">
                                {member.email || "Not provided"}
                              </span>
                            </div>
                            <div className="col-md-6">
                              <small className="text-muted d-block">
                                Phone
                              </small>
                              <span className="fw-medium">
                                {member.phone || "Not provided"}
                              </span>
                            </div>
                            <div className="col-md-6">
                              <small className="text-muted d-block">
                                Location
                              </small>
                              <span className="fw-medium">
                                {member.location || "Unknown"}
                              </span>
                            </div>
                            <div className="col-md-6">
                              <small className="text-muted d-block">
                                Battery
                              </small>
                              <span className="fw-medium">
                                {member.battery
                                  ? `${member.battery}%`
                                  : "Unknown"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Toggle Details Button */}
                      <button
                        className="btn btn-link btn-sm text-decoration-none p-0 mt-2"
                        onClick={() =>
                          setExpandedMember(
                            expandedMember === member.id ? null : member.id
                          )
                        }
                      >
                        {expandedMember === member.id
                          ? "Hide Details"
                          : "Show Details"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card Footer */}
          <div className="card-footer bg-light border-top-0">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Last updated: {new Date().toLocaleTimeString()}
              </small>
              <button
                className="btn btn-link btn-sm p-0 text-decoration-none"
                onClick={() => window.location.reload()}
              >
                Refresh Status
              </button>
            </div>
          </div>
        </div>

        <style jsx>{`
          .bg-primary {
            background-color: #ff5a1f !important;
          }

          .text-primary {
            color: #ff5a1f !important;
          }

          .btn-safelink {
            background: linear-gradient(135deg, #ff5a1f 0%, #e63946 100%);
            border: 2px solid #ff5a1f;
            color: white;
            font-weight: 600;
            transition: all 0.3s ease;
          }

          .btn-safelink:hover:not(:disabled) {
            background: linear-gradient(135deg, #e63946 0%, #c82333 100%);
            border-color: #e63946;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 90, 31, 0.3);
          }

          .list-group-item {
            transition: background-color 0.3s ease;
          }

          .list-group-item:hover {
            background-color: #f8f9fa;
          }

          .dropdown-menu {
            border: 0;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            border-radius: 8px;
          }
        `}</style>
      </div>
    );
  }
);

export default FamilyStatusCard;
