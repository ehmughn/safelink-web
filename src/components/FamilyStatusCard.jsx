import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Shield,
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

    const getStatusIcon = (status) => {
      switch (status?.toUpperCase()) {
        case "SAFE":
          return <CheckCircle className="status-icon safe" size={16} />;
        case "DANGER":
          return <AlertTriangle className="status-icon danger" size={16} />;
        case "NO RESPONSE":
          return <Clock className="status-icon no-response" size={16} />;
        default:
          return <HelpCircle className="status-icon unknown" size={16} />;
      }
    };

    const getStatusClass = (status) => {
      switch (status?.toUpperCase()) {
        case "SAFE":
          return "family-member-safe";
        case "DANGER":
          return "family-member-danger";
        case "NO RESPONSE":
          return "family-member-no-response";
        default:
          return "family-member-unknown";
      }
    };

    // Define getOverallStatus as a regular function
    const getOverallStatus = (members) => {
      if (!members.length) return "unknown";

      const statuses = members.map((member) => member.status?.toUpperCase());

      if (statuses.some((status) => status === "DANGER")) return "danger";
      if (statuses.some((status) => status === "NO RESPONSE")) return "warning";
      if (statuses.every((status) => status === "SAFE")) return "safe";
      return "mixed";
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

    return (
      <div
        className={`family-status-card family-status-${getOverallStatus(
          familyMembers
        )}`}
        role="region"
        aria-label="Family Status Overview"
      >
        <div className="family-status-header">
          <div className="family-status-title">
            <Users size={20} />
            <span>Family Status</span>
            <span className="family-member-count">
              ({familyMembers.length})
            </span>
          </div>

          {showCheckInButton && (
            <button
              className="check-in-button"
              onClick={handleCheckInRequest}
              disabled={isRequestingCheckIn || !familyMembers.length}
              aria-label="Request status update from all family members"
              title="Request status update from all family members"
            >
              {isRequestingCheckIn ? "Requesting..." : "Check-In"}
            </button>
          )}
        </div>

        <div className="family-overall-status">
          <svg className="progress-ring" width="40" height="40">
            <circle
              className="progress-ring-circle"
              stroke={
                getOverallStatus(familyMembers) === "safe"
                  ? "#1aab5a"
                  : getOverallStatus(familyMembers) === "danger"
                  ? "#d32f2f"
                  : getOverallStatus(familyMembers) === "warning"
                  ? "#f57c00"
                  : "var(--primary)"
              }
              strokeWidth="4"
              fill="transparent"
              r="16"
              cx="20"
              cy="20"
              style={{
                strokeDasharray: `${
                  2 * Math.PI * 16 * (getProgressPercentage / 100)
                }, ${2 * Math.PI * 16}`,
              }}
            />
            <Shield
              className={`overall-status-icon ${getOverallStatus(
                familyMembers
              )}`}
              size={18}
            />
          </svg>
          <span className="overall-status-text" role="status">
            {getOverallStatusText}
          </span>
        </div>

        <div
          className="family-members-list"
          role="list"
          aria-expanded={isListExpanded}
        >
          <button
            className="expand-toggle"
            onClick={toggleListExpand}
            aria-label={`Toggle family members list, currently ${
              isListExpanded ? "expanded" : "collapsed"
            }`}
          >
            View {isListExpanded ? "Less" : "More"} Members
          </button>
          <div
            className={`family-members-container ${
              isListExpanded ? "expanded" : ""
            }`}
            role="listbox"
            aria-live="polite"
          >
            {isLoading ? (
              <div className="family-loading" role="alert">
                <div className="loading-spinner"></div>
                <span>Loading family members...</span>
              </div>
            ) : familyMembers.length === 0 ? (
              <div className="no-family-members" role="alert">
                <Users size={24} className="no-members-icon" />
                <span>No family members yet</span>
              </div>
            ) : (
              familyMembers.map((member) => (
                <div
                  key={member.userId || member.name}
                  className={`family-member ${getStatusClass(member.status)}`}
                  onClick={() => onMemberClick && onMemberClick(member)}
                  onMouseEnter={(e) =>
                    e.currentTarget.setAttribute(
                      "data-tooltip",
                      member.status || "UNKNOWN"
                    )
                  }
                  onFocus={(e) =>
                    e.currentTarget.setAttribute(
                      "data-tooltip",
                      member.status || "UNKNOWN"
                    )
                  }
                  onMouseLeave={(e) =>
                    e.currentTarget.removeAttribute("data-tooltip")
                  }
                  onBlur={(e) =>
                    e.currentTarget.removeAttribute("data-tooltip")
                  }
                  tabIndex={onMemberClick ? 0 : -1}
                  role="option"
                  aria-label={`${member.name} - ${member.status || "UNKNOWN"}`}
                >
                  <div className="member-info">
                    <div className="member-avatar">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={`${member.name}'s avatar`}
                          loading="lazy"
                        />
                      ) : (
                        <span className="member-initial">
                          {member.name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      )}
                      {member.isAdmin && (
                        <div className="admin-badge" title="Family Admin">
                          <Shield size={10} />
                        </div>
                      )}
                    </div>
                    <div className="member-details">
                      <span className="member-name">{member.name}</span>
                      {member.lastUpdate && (
                        <span className="member-last-update">
                          {new Date(
                            member.lastUpdate.toDate()
                          ).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="member-status">
                    {getStatusIcon(member.status)}
                    <span className="status-text">
                      {member.status || "UNKNOWN"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default FamilyStatusCard;
