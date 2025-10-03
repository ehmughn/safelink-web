import React, { useState, useCallback, useMemo } from "react";
import {
  Users,
  Shield,
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
        {/* Status Summary Cards - 2x2 grid */}
        <div className="status-summary-grid mb-4">
          <div className="status-card safe">
            <CheckCircle className="icon" size={28} />
            <div className="count">{getTotalMembersByStatus("SAFE")}</div>
            <div className="label">Safe</div>
          </div>
          <div className="status-card noresponse">
            <HelpCircle className="icon" size={28} />
            <div className="count">
              {getTotalMembersByStatus("NO RESPONSE")}
            </div>
            <div className="label">No Response</div>
          </div>
          <div className="status-card danger">
            <XCircle className="icon" size={28} />
            <div className="count">{getTotalMembersByStatus("DANGER")}</div>
            <div className="label">In Danger</div>
          </div>
          <div className="status-card total">
            <Users className="icon" size={28} />
            <div className="count">{familyMembers.length}</div>
            <div className="label">Total Members</div>
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
          .status-summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
          }
          @media (max-width: 500px) {
            .status-summary-grid {
              gap: 0.5rem;
            }
          }
          .status-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #fff;
            border-radius: 18px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            padding: 1.1rem 0.5rem 1.1rem 0.5rem;
            min-width: 70px;
            min-height: 100px;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            transition: box-shadow 0.2s;
          }
          .status-card .icon {
            margin-bottom: 0.2rem;
          }
          .status-card .count {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.1rem;
          }
          .status-card .label {
            font-size: 1.05rem;
            font-weight: 600;
            letter-spacing: 0.02em;
            text-align: center;
            white-space: pre-line;
          }
          .status-card.safe {
            border-left-color: #22c55e;
            background: linear-gradient(90deg, #f0fdf4 60%, #fff 100%);
            color: #22c55e;
          }
          .status-card.noresponse {
            border-left-color: #f59e0b;
            background: linear-gradient(90deg, #fefce8 60%, #fff 100%);
            color: #f59e0b;
          }
          .status-card.danger {
            border-left-color: #ef4444;
            background: linear-gradient(90deg, #fef2f2 60%, #fff 100%);
            color: #ef4444;
          }
          .status-card.total {
            border-left-color: #ff5a1f;
            background: linear-gradient(90deg, #fff7f3 60%, #fff 100%);
            color: #ff5a1f;
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
