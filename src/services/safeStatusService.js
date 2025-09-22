import { 
  collection, 
  doc, 
  setDoc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { FamilyService } from './familyService';

export class SafeStatusService {
  // Record a "I'm Safe" status update
  static async recordSafeStatus(userId, userLocation = null, message = '') {
    try {
      // Get user's family code
      const familyResult = await FamilyService.getUserFamilyCode(userId);
      
      if (!familyResult.success || !familyResult.familyCode) {
        return { success: false, error: 'User not in a family' };
      }

      const statusUpdate = {
        userId,
        familyCode: familyResult.familyCode,
        status: 'SAFE',
        timestamp: serverTimestamp(),
        location: userLocation,
        message: message.trim(),
        type: 'manual_checkin'
      };

      // Create status update document
      const statusRef = doc(collection(db, 'statusUpdates'));
      await setDoc(statusRef, statusUpdate);

      // Update user status in family
      await FamilyService.updateUserStatus(
        familyResult.familyCode, 
        userId, 
        'SAFE'
      );

      return { success: true, updateId: statusRef.id };
    } catch (error) {
      console.error('Error recording safe status:', error);
      return { success: false, error: error.message };
    }
  }

  // Get latest status updates for a family
  static async getFamilyStatusUpdates(familyCode, limitCount = 10) {
    try {
      const statusQuery = query(
        collection(db, 'statusUpdates'),
        where('familyCode', '==', familyCode),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const statusSnapshot = await getDocs(statusQuery);
      const statusUpdates = [];

      statusSnapshot.forEach((doc) => {
        statusUpdates.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return { success: true, updates: statusUpdates };
    } catch (error) {
      console.error('Error fetching family status updates:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's location (browser geolocation)
  static async getCurrentLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ success: false, error: 'Geolocation not supported' });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            success: true,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString()
            }
          });
        },
        (error) => {
          let errorMessage = 'Unknown error';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          resolve({ success: false, error: errorMessage });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // Send emergency SOS alert
  static async sendSOSAlert(userId, location = null, message = '') {
    try {
      const familyResult = await FamilyService.getUserFamilyCode(userId);
      
      if (!familyResult.success || !familyResult.familyCode) {
        return { success: false, error: 'User not in a family' };
      }

      const sosAlert = {
        userId,
        familyCode: familyResult.familyCode,
        status: 'DANGER',
        timestamp: serverTimestamp(),
        location,
        message: message.trim(),
        type: 'sos_alert',
        severity: 'high'
      };

      // Create SOS alert document
      const sosRef = doc(collection(db, 'sosAlerts'));
      await setDoc(sosRef, sosAlert);

      // Also create a status update
      const statusRef = doc(collection(db, 'statusUpdates'));
      await setDoc(statusRef, {
        ...sosAlert,
        type: 'sos_status'
      });

      // Update user status in family
      await FamilyService.updateUserStatus(
        familyResult.familyCode, 
        userId, 
        'DANGER'
      );

      return { success: true, alertId: sosRef.id };
    } catch (error) {
      console.error('Error sending SOS alert:', error);
      return { success: false, error: error.message };
    }
  }
}
