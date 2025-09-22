import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

export class FamilyService {
  // Generate a unique 6-digit family code
  static generateFamilyCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create a new family with the current user as admin
  static async createFamily(userId, userName, userEmail) {
    try {
      let familyCode;
      let codeExists = true;

      // Keep generating codes until we find a unique one
      while (codeExists) {
        familyCode = this.generateFamilyCode();
        const familyDoc = await getDoc(doc(db, "families", familyCode));
        codeExists = familyDoc.exists();
      }

      const familyData = {
        code: familyCode,
        createdAt: serverTimestamp(),
        createdBy: userId,
        members: [
          {
            userId,
            name: userName,
            email: userEmail,
            status: "SAFE",
            lastUpdate: Timestamp.now(),
            isAdmin: true,
            joinedAt: Timestamp.now(),
          },
        ],
      };

      await setDoc(doc(db, "families", familyCode), familyData);

      // Update user document to reference family
      await setDoc(
        doc(db, "users", userId),
        {
          familyCode,
          joinedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return { success: true, familyCode };
    } catch (error) {
      console.error("Error creating family:", error);
      return { success: false, error: error.message };
    }
  }

  // Join an existing family using a 6-digit code
  static async joinFamily(familyCode, userId, userName, userEmail) {
    try {
      const familyRef = doc(db, "families", familyCode);
      const familyDoc = await getDoc(familyRef);

      if (!familyDoc.exists()) {
        return { success: false, error: "Family code not found" };
      }

      const familyData = familyDoc.data();

      // Check if user is already in this family
      const existingMember = familyData.members.find(
        (member) => member.userId === userId
      );
      if (existingMember) {
        return {
          success: false,
          error: "You are already a member of this family",
        };
      }

      // Add user to family members
      const newMember = {
        userId,
        name: userName,
        email: userEmail,
        status: "SAFE",
        lastUpdate: Timestamp.now(),
        isAdmin: false,
        joinedAt: Timestamp.now(),
      };

      await updateDoc(familyRef, {
        members: arrayUnion(newMember),
      });

      // Update user document to reference family
      await setDoc(
        doc(db, "users", userId),
        {
          familyCode,
          joinedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return { success: true, familyCode };
    } catch (error) {
      console.error("Error joining family:", error);
      return { success: false, error: error.message };
    }
  }

  // Get family data by code
  static async getFamilyData(familyCode) {
    try {
      const familyDoc = await getDoc(doc(db, "families", familyCode));

      if (!familyDoc.exists()) {
        return { success: false, error: "Family not found" };
      }

      return { success: true, data: familyDoc.data() };
    } catch (error) {
      console.error("Error fetching family data:", error);
      return { success: false, error: error.message };
    }
  }

  // Get user's family code
  static async getUserFamilyCode(userId) {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));

      if (!userDoc.exists()) {
        return { success: false, error: "User not found" };
      }

      const userData = userDoc.data();
      return {
        success: true,
        familyCode: userData.familyCode || null,
      };
    } catch (error) {
      console.error("Error fetching user family code:", error);
      return { success: false, error: error.message };
    }
  }

  // Update user status (SAFE, DANGER, NO RESPONSE, UNKNOWN)
  static async updateUserStatus(familyCode, userId, status) {
    try {
      const familyRef = doc(db, "families", familyCode);
      const familyDoc = await getDoc(familyRef);

      if (!familyDoc.exists()) {
        return { success: false, error: "Family not found" };
      }

      const familyData = familyDoc.data();
      const updatedMembers = familyData.members.map((member) => {
        if (member.userId === userId) {
          return {
            ...member,
            status,
            lastUpdate: Timestamp.now(),
          };
        }
        return member;
      });

      await updateDoc(familyRef, {
        members: updatedMembers,
      });

      return { success: true };
    } catch (error) {
      console.error("Error updating user status:", error);
      return { success: false, error: error.message };
    }
  }

  // Listen to family updates in real-time
  static subscribeFamilyUpdates(familyCode, callback) {
    const familyRef = doc(db, "families", familyCode);

    return onSnapshot(
      familyRef,
      (doc) => {
        if (doc.exists()) {
          callback({ success: true, data: doc.data() });
        } else {
          callback({ success: false, error: "Family not found" });
        }
      },
      (error) => {
        console.error("Error listening to family updates:", error);
        callback({ success: false, error: error.message });
      }
    );
  }

  // Send family check-in request to all members
  static async sendFamilyCheckIn(familyCode, requesterId, requesterName) {
    try {
      const checkInRequest = {
        familyCode,
        requesterId,
        requesterName,
        timestamp: serverTimestamp(),
        responses: [],
      };

      const checkInRef = doc(collection(db, "checkInRequests"));
      await setDoc(checkInRef, checkInRequest);

      return { success: true, requestId: checkInRef.id };
    } catch (error) {
      console.error("Error sending family check-in:", error);
      return { success: false, error: error.message };
    }
  }

  // Leave family
  static async leaveFamily(familyCode, userId) {
    try {
      const familyRef = doc(db, "families", familyCode);
      const familyDoc = await getDoc(familyRef);

      if (!familyDoc.exists()) {
        return { success: false, error: "Family not found" };
      }

      const familyData = familyDoc.data();
      const memberToRemove = familyData.members.find(
        (member) => member.userId === userId
      );

      if (!memberToRemove) {
        return { success: false, error: "User not found in family" };
      }

      // Remove user from family members
      await updateDoc(familyRef, {
        members: arrayRemove(memberToRemove),
      });

      // Remove family reference from user document
      await updateDoc(doc(db, "users", userId), {
        familyCode: null,
      });

      return { success: true };
    } catch (error) {
      console.error("Error leaving family:", error);
      return { success: false, error: error.message };
    }
  }
}
