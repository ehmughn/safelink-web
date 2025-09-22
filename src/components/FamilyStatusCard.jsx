import { useState, useEffect } from 'react';
import { Users, Clock, CheckCircle, AlertTriangle, HelpCircle, Shield } from 'lucide-react';
import '../styles/FamilyStatusCard.css';

const FamilyStatusCard = ({ 
  familyMembers = [], 
  onRequestCheckIn, 
  onMemberClick, 
  isLoading = false,
  showCheckInButton = true 
}) => {
  const [isRequestingCheckIn, setIsRequestingCheckIn] = useState(false);

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'SAFE':
        return <CheckCircle className="status-icon safe" size={16} />;
      case 'DANGER':
        return <AlertTriangle className="status-icon danger" size={16} />;
      case 'NO RESPONSE':
        return <Clock className="status-icon no-response" size={16} />;
      default:
        return <HelpCircle className="status-icon unknown" size={16} />;
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'SAFE':
        return 'family-member-safe';
      case 'DANGER':
        return 'family-member-danger';
      case 'NO RESPONSE':
        return 'family-member-no-response';
      default:
        return 'family-member-unknown';
    }
  };

  const handleCheckInRequest = async () => {
    if (isRequestingCheckIn || !onRequestCheckIn) return;
    
    setIsRequestingCheckIn(true);
    try {
      await onRequestCheckIn();
    } catch (error) {
      console.error('Error requesting check-in:', error);
    } finally {
      setIsRequestingCheckIn(false);
    }
  };

  const getOverallStatus = () => {
    if (!familyMembers.length) return 'unknown';
    
    const statuses = familyMembers.map(member => member.status?.toUpperCase());
    
    if (statuses.some(status => status === 'DANGER')) return 'danger';
    if (statuses.some(status => status === 'NO RESPONSE')) return 'warning';
    if (statuses.every(status => status === 'SAFE')) return 'safe';
    return 'mixed';
  };

  const getOverallStatusText = () => {
    const overallStatus = getOverallStatus();
    const memberCount = familyMembers.length;
    
    switch (overallStatus) {
      case 'safe':
        return `All ${memberCount} members are safe`;
      case 'danger':
        return 'Emergency: Family member in danger';
      case 'warning':
        return 'Some members have not responded';
      case 'mixed':
        return 'Mixed status - check individual members';
      default:
        return 'No family members';
    }
  };

  return (
    <div className={`family-status-card family-status-${getOverallStatus()}`}>
      <div className="family-status-header">
        <div className="family-status-title">
          <Users size={20} />
          <span>Family Status</span>
          <span className="family-member-count">({familyMembers.length})</span>
        </div>
        
        {showCheckInButton && (
          <button
            className="check-in-button"
            onClick={handleCheckInRequest}
            disabled={isRequestingCheckIn || !familyMembers.length}
            title="Request status update from all family members"
          >
            {isRequestingCheckIn ? 'Requesting...' : 'Check-In'}
          </button>
        )}
      </div>

      <div className="family-overall-status">
        <Shield className={`overall-status-icon ${getOverallStatus()}`} size={18} />
        <span className="overall-status-text">{getOverallStatusText()}</span>
      </div>

      <div className="family-members-list">
        {isLoading ? (
          <div className="family-loading">
            <div className="loading-spinner"></div>
            <span>Loading family members...</span>
          </div>
        ) : familyMembers.length === 0 ? (
          <div className="no-family-members">
            <Users size={24} className="no-members-icon" />
            <span>No family members yet</span>
          </div>
        ) : (
          familyMembers.map((member) => (
            <div
              key={member.userId || member.name}
              className={`family-member ${getStatusClass(member.status)}`}
              onClick={() => onMemberClick && onMemberClick(member)}
              style={{ cursor: onMemberClick ? 'pointer' : 'default' }}
            >
              <div className="member-info">
                <div className="member-avatar">
                  {member.avatar ? (
                    <img src={member.avatar} alt={`${member.name}'s avatar`} />
                  ) : (
                    <span className="member-initial">
                      {member.name?.charAt(0)?.toUpperCase() || '?'}
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
                      {new Date(member.lastUpdate.toDate()).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="member-status">
                {getStatusIcon(member.status)}
                <span className="status-text">{member.status || 'UNKNOWN'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FamilyStatusCard;
