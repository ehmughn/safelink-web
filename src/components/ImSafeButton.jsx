import { useState } from 'react';
import { CheckCircle, Loader, AlertTriangle, MapPin } from 'lucide-react';
import '../styles/ImSafeButton.css';

const ImSafeButton = ({ onSafeUpdate, disabled = false, size = 'normal' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [includeLocation, setIncludeLocation] = useState(true);

  const handleSafeClick = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    
    try {
      let location = null;
      
      if (includeLocation) {
        // Get current location if user opted in
        if (navigator.geolocation) {
          try {
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 300000
              });
            });
            
            location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString()
            };
          } catch (error) {
            console.log('Location unavailable:', error.message);
          }
        }
      }

      const result = await onSafeUpdate(location);
      
      if (result.success) {
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error updating safe status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonClass = () => {
    let baseClass = 'im-safe-button';
    if (size === 'large') baseClass += ' im-safe-button-large';
    if (size === 'small') baseClass += ' im-safe-button-small';
    if (disabled) baseClass += ' im-safe-button-disabled';
    if (isLoading) baseClass += ' im-safe-button-loading';
    return baseClass;
  };

  return (
    <div className="im-safe-container">
      <button
        className={getButtonClass()}
        onClick={handleSafeClick}
        disabled={disabled || isLoading}
        aria-label="I'm Safe Check-In"
      >
        {isLoading ? (
          <Loader className="im-safe-icon spinning" size={size === 'small' ? 16 : 20} />
        ) : (
          <CheckCircle className="im-safe-icon" size={size === 'small' ? 16 : 20} />
        )}
        {isLoading ? 'Updating...' : "I'M SAFE"}
      </button>

      {lastUpdate && (
        <div className="im-safe-last-update">
          <CheckCircle size={14} className="update-check-icon" />
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}

      {!showLocationPrompt && (
        <div className="location-preference">
          <label className="location-checkbox">
            <input
              type="checkbox"
              checked={includeLocation}
              onChange={(e) => setIncludeLocation(e.target.checked)}
            />
            <MapPin size={14} />
            Include my location
          </label>
        </div>
      )}
    </div>
  );
};

export default ImSafeButton;
