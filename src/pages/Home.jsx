import { useState, useEffect, useCallback } from "react";
import { auth } from "../config/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import DisasterAlertsService from "../services/DisasterAlertsService";
import {
  Bell,
  Users,
  MapPin,
  CheckCircle,
  AlertTriangle,
  X,
  AlertCircle,
  Package,
  Shield,
  Radio,
  ChevronRight,
  Clock,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Header from "../components/Header";
import { SafeStatusService } from "../services/safeStatusService";
import { FamilyService } from "../services/familyService";
import { useNavigate } from "react-router-dom";

// Custom marker icons
const userIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const evacIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const Home = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyCode, setFamilyCode] = useState(null);
  const [user, setUser] = useState(null);
  const [familyLoading, setFamilyLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    profile: { firstName: "", lastName: "", address: "" },
    email: "",
    phoneNumber: "",
  });
  const [checklist, setChecklist] = useState({
    food: false,
    water: false,
    clothes: false,
    flashlight: false,
  });
  const [expandedMember, setExpandedMember] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [evacCenters, setEvacCenters] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState(null);
  const [isVerifiedOfficial, setIsVerifiedOfficial] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [barangayMembers, setBarangayMembers] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [disasterAlerts, setDisasterAlerts] = useState([]);
  const [disasterAlertsLoading, setDisasterAlertsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
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

            // Check if user is admin or verified official
            setIsAdmin(userData.profile?.isAdmin || false);

            setIsVerifiedOfficial(
              userData.profile?.isVerifiedOfficial || false
            );

            // If admin, redirect to admin dashboard
            if (userData.profile?.isAdmin) {
              navigate("/admin");
              return;
            }

            // Setup broadcast listener for ALL users in the barangay
            const userBarangay =
              userData.profile?.administrativeLocation?.barangay;
            if (userBarangay) {
              await setupBroadcastListener(userBarangay);
            }

            // If verified official, also load barangay members
            if (userData.profile?.isVerifiedOfficial) {
              await loadBarangayMembers(firebaseUser.uid, userBarangay);
            }
          }
        } catch (error) {
          setError("Failed to fetch user data.");
          console.error("Error fetching user document:", error);
        }
        await setupFamilyListener(firebaseUser.uid);
        await loadUserLocationAndEvacCenters();
      } else {
        setUser(null);
        setFamilyCode(null);
        setFamilyMembers([]);
        setFamilyLoading(false);
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const loadBarangayMembers = async (userId, userBarangay) => {
    if (!userBarangay) return;

    try {
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);

      const members = usersSnapshot.docs
        .filter((doc) => {
          const data = doc.data();
          return (
            data?.profile?.administrativeLocation?.barangay === userBarangay &&
            doc.id !== userId
          );
        })
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .slice(0, 10); // Only get first 10 for homepage

      setBarangayMembers(members);
    } catch (error) {
      console.error("Error loading barangay members:", error);
    }
  };

  const setupBroadcastListener = useCallback(async (userBarangay) => {
    if (!userBarangay) return;

    try {
      const broadcastsRef = collection(db, "broadcasts");
      const q = query(
        broadcastsRef,
        where("barangay", "==", userBarangay),
        where("status", "==", "active")
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const broadcastData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          severity: doc.data().emergencyType === "other" ? "medium" : "high",
        }));
        setBroadcasts(broadcastData);
        // Merge broadcasts with alerts
        setAlerts((prev) => [
          ...prev.filter((alert) => !alert.isBroadcast),
          ...broadcastData.map((broadcast) => ({
            id: broadcast.id,
            text: broadcast.alertType,
            severity: broadcast.severity,
            description: broadcast.description,
            image: broadcast.imageUrl,
            isBroadcast: true,
            createdAt: broadcast.createdAt,
          })),
        ]);
      });
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up broadcast listener:", error);
      setError("Failed to load broadcasts");
    }
  }, []);

  const loadDisasterAlerts = useCallback(
    async (lat, lon) => {
      if (!isVerifiedOfficial) return; // Only load for verified officials

      setDisasterAlertsLoading(true);
      try {
        const allAlerts = await DisasterAlertsService.getAllDisasterAlerts(
          lat,
          lon
        );

        // Filter for critical, high, and moderate severity within 50km radius
        const nearbyAlerts = DisasterAlertsService.filterAlertsByRadius(
          allAlerts,
          lat,
          lon,
          50
        );

        const relevantAlerts = nearbyAlerts.filter(
          (alert) =>
            alert.severity === "critical" ||
            alert.severity === "high" ||
            alert.severity === "moderate"
        );

        // Convert to alert format with blue color
        const formattedDisasterAlerts = relevantAlerts.map((alert) => ({
          id: `disaster_${alert.id}`,
          text: alert.title,
          severity: "warning", // Blue color in Bootstrap
          description: alert.description,
          location: alert.location,
          source: alert.source,
          advisory: alert.advisory,
          magnitude: alert.magnitude,
          depth: alert.depth,
          isDiaster: true,
          createdAt: new Date().toISOString(),
        }));

        setDisasterAlerts(formattedDisasterAlerts);

        // Merge disaster alerts with existing alerts
        setAlerts((prev) => {
          const nonDisasterAlerts = prev.filter((alert) => !alert.isDiaster);
          return [...nonDisasterAlerts, ...formattedDisasterAlerts];
        });
      } catch (error) {
        console.error("Error loading disaster alerts:", error);
      } finally {
        setDisasterAlertsLoading(false);
      }
    },
    [isVerifiedOfficial]
  );

  const setupFamilyListener = useCallback(async (userId) => {
    if (!userId) {
      setFamilyMembers([]);
      setFamilyCode(null);
      setFamilyLoading(false);
      return;
    }

    setFamilyLoading(true);
    try {
      const familiesRef = collection(db, "families");
      const querySnapshot = await getDocs(familiesRef);

      let userFamily = null;

      for (const familyDoc of querySnapshot.docs) {
        const familyDocData = familyDoc.data();
        if (familyDocData.isArchived) continue;

        const memberFound = familyDocData.members?.find(
          (member) => member.userId === userId
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
        setFamilyCode(userFamily.id);
        const familyDocRef = doc(db, "families", userFamily.id);
        const unsubscribe = onSnapshot(familyDocRef, async (docSnapshot) => {
          if (docSnapshot.exists()) {
            const familyDocData = docSnapshot.data();
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
              if (a.userId === userId) return -1;
              if (b.userId === userId) return 1;
              return 0;
            });

            setFamilyMembers(sortedMembers);
            setFamilyLoading(false);
          } else {
            setFamilyMembers([]);
            setFamilyCode(null);
            setFamilyLoading(false);
          }
        });
        return unsubscribe;
      } else {
        setFamilyMembers([]);
        setFamilyCode(null);
        setFamilyLoading(false);
      }
    } catch (error) {
      console.error("Error setting up family listener:", error);
      setError("Failed to load family information");
      setFamilyLoading(false);
    }
  }, []);

  const haversineDistance = (coords1, coords2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(coords2.latitude - coords1.latitude);
    const dLon = toRad(coords2.longitude - coords1.longitude);
    const lat1 = toRad(coords1.latitude);
    const lat2 = toRad(coords2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const loadUserLocationAndEvacCenters = async () => {
    setMapLoading(true);
    try {
      const locationResult = await SafeStatusService.getCurrentLocation();
      let userLoc;
      if (locationResult.success) {
        userLoc = locationResult.location;
        setUserLocation(userLoc);
      } else {
        setError("Failed to get your location. Using default location.");
        userLoc = { latitude: 14.5547, longitude: 121.0244 };
        setUserLocation(userLoc);
      }

      // Fetch nearby evacuation centers, schools, and covered courts using Overpass API
      const radius = 5000; // 5km radius
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"="school"](around:${radius},${userLoc.latitude},${userLoc.longitude});
          way["amenity"="school"](around:${radius},${userLoc.latitude},${userLoc.longitude});
          node["leisure"="sports_centre"](around:${radius},${userLoc.latitude},${userLoc.longitude});
          way["leisure"="sports_centre"](around:${radius},${userLoc.latitude},${userLoc.longitude});
          node["amenity"="community_centre"](around:${radius},${userLoc.latitude},${userLoc.longitude});
          way["amenity"="community_centre"](around:${radius},${userLoc.latitude},${userLoc.longitude});
          node["building"="civic"](around:${radius},${userLoc.latitude},${userLoc.longitude});
          way["building"="civic"](around:${radius},${userLoc.latitude},${userLoc.longitude});
          node["amenity"="shelter"](around:${radius},${userLoc.latitude},${userLoc.longitude});
          way["amenity"="shelter"](around:${radius},${userLoc.latitude},${userLoc.longitude});
        );
        out center;
      `;

      try {
        const response = await fetch(
          "https://overpass-api.de/api/interpreter",
          {
            method: "POST",
            body: overpassQuery,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const centers = data.elements
            .map((element) => {
              const lat = element.lat || element.center?.lat;
              const lon = element.lon || element.center?.lon;

              if (!lat || !lon) return null;

              const coords = { latitude: lat, longitude: lon };
              const distance = haversineDistance(userLoc, coords);

              let type = "Evacuation Center";
              if (element.tags?.amenity === "school") type = "School";
              else if (element.tags?.leisure === "sports_centre")
                type = "Covered Court";
              else if (element.tags?.amenity === "community_centre")
                type = "Community Center";
              else if (element.tags?.building === "civic")
                type = "Civic Building";
              else if (element.tags?.amenity === "shelter") type = "Shelter";

              return {
                name:
                  element.tags?.name ||
                  `${type} (${distance.toFixed(1)}km away)`,
                address:
                  element.tags?.["addr:full"] ||
                  element.tags?.["addr:street"] ||
                  "Address not available",
                coordinates: coords,
                type: type,
                distance: distance,
              };
            })
            .filter((center) => center !== null && center.distance <= 5)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 10); // Limit to 10 nearest centers

          setEvacCenters(centers);
        } else {
          console.error("Failed to fetch from Overpass API");
          setEvacCenters([]);
        }
      } catch (apiError) {
        console.error("Error fetching evacuation centers:", apiError);
        setEvacCenters([]);
      }
    } catch (error) {
      console.error("Error loading evacuation centers:", error);
      setError("Failed to load evacuation centers.");
    } finally {
      setMapLoading(false);
    }
  };

  const handleSafeUpdate = async (location = null) => {
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }
    try {
      const result = await SafeStatusService.recordSafeStatus(
        user.uid,
        location,
        "Manual check-in from home dashboard"
      );
      if (result.success) {
        setAlerts((prev) => [
          ...prev,
          {
            id: Date.now(),
            text: "Safe status updated!",
            severity: "low",
            isBroadcast: false,
          },
        ]);
      }
      return result;
    } catch (error) {
      console.error("Error updating safe status:", error);
      setError("Failed to update safe status.");
      return { success: false, error: error.message };
    }
  };

  const handleFamilyCheckIn = async () => {
    if (!user || !familyCode) return;

    setFamilyLoading(true);
    try {
      const result = await FamilyService.sendFamilyCheckIn(
        familyCode,
        user.uid,
        user.displayName || user.email
      );
      if (result.success) {
        setAlerts((prev) => [
          ...prev,
          {
            id: Date.now(),
            text: "Family check-in sent!",
            severity: "low",
            isBroadcast: false,
          },
        ]);
      }
    } catch (error) {
      console.error("Error sending family check-in:", error);
      setError("Failed to send family check-in.");
    } finally {
      setFamilyLoading(false);
    }
  };

  const handleSOSAlert = async () => {
    if (!user) return;
    try {
      const locationResult = await SafeStatusService.getCurrentLocation();
      const location = locationResult.success ? locationResult.location : null;
      const result = await SafeStatusService.sendSOSAlert(
        user.uid,
        location,
        "Emergency SOS alert from home dashboard"
      );
      if (result.success) {
        setAlerts((prev) => [
          ...prev,
          {
            id: Date.now(),
            text: "SOS alert sent!",
            severity: "high",
            isBroadcast: false,
          },
        ]);
      }
    } catch (error) {
      console.error("Error sending SOS alert:", error);
      setError("Failed to send SOS alert.");
    }
  };

  const handleChecklistChange = (item) => {
    setChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const handleSaveChecklist = () => {
    setAlerts((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: "Go-Bag checklist saved!",
        severity: "low",
        isBroadcast: false,
      },
    ]);
    console.log("Checklist saved:", checklist);
  };

  const dismissAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case "high":
        return "alert-danger";
      case "medium":
        return "alert-warning";
      case "low":
        return "alert-success";
      default:
        return "alert-info";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "SAFE":
        return <CheckCircle className="text-success" size={18} />;
      case "DANGER":
        return <X className="text-danger" size={18} />;
      case "NO RESPONSE":
        return <AlertCircle className="text-warning" size={18} />;
      default:
        return <Clock className="text-muted" size={18} />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "SAFE":
        return "badge bg-success";
      case "DANGER":
        return "badge bg-danger";
      case "NO RESPONSE":
        return "badge bg-warning";
      default:
        return "badge bg-secondary";
    }
  };

  const recenterMap = () => {
    if (mapInstance && userLocation) {
      mapInstance.setView([userLocation.latitude, userLocation.longitude], 13);
    }
  };

  const checklistItems = [
    { key: "food", label: "Food & Snacks" },
    { key: "water", label: "Bottled Water" },
    { key: "clothes", label: "Extra Clothes" },
    { key: "flashlight", label: "Flashlight & Batteries" },
  ];

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const progressPercentage = (completedCount / checklistItems.length) * 100;

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

          * {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }

          body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }

          .home-container {
            background: #f8f9fc;
            min-height: 100vh;
          }

          .hero-gradient {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            position: relative;
            overflow: hidden;
          }

          .hero-gradient::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            opacity: 0.3;
          }

          .hero-title {
            font-size: 3.5rem;
            font-weight: 800;
            letter-spacing: -1px;
            text-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: fadeInUp 0.6s ease-out;
          }

          .hero-subtitle {
            font-size: 1.25rem;
            font-weight: 400;
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
            border-radius: 20px;
            border: none;
            box-shadow: 0 8px 30px rgba(0,0,0,0.08);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            overflow: hidden;
            position: relative;
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

          .card-header-custom {
            background: transparent;
            border: none;
            padding: 2rem 2rem 1rem;
          }

          .card-title-custom {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1a202c;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin: 0;
          }

          .card-title-custom .icon-wrapper {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(255, 90, 31, 0.3);
          }

          .card-body-custom {
            padding: 1rem 2rem 2rem;
          }

          .stat-card {
            background: linear-gradient(135deg, #f6f8fb 0%, #ffffff 100%);
            border-radius: 16px;
            padding: 1.5rem;
            border: 2px solid #e2e8f0;
            transition: all 0.3s ease;
            cursor: pointer;
          }

          .stat-card:hover {
            border-color: #FF5A1F;
            transform: scale(1.02);
            box-shadow: 0 8px 25px rgba(255, 90, 31, 0.15);
          }

          .stat-number {
            font-size: 2.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .stat-label {
            font-size: 0.95rem;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .action-button {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            border: none;
            border-radius: 16px;
            padding: 1.75rem 1.5rem;
            color: white;
            font-weight: 600;
            font-size: 1.1rem;
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

          .action-button:active {
            transform: translateY(-2px) scale(0.98);
          }

          .sos-button {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            animation: sosPulse 2s infinite;
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
          }

          @keyframes sosPulse {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
            }
            50% {
              box-shadow: 0 0 0 15px rgba(220, 38, 38, 0);
            }
          }

          .sos-button:hover {
            animation: none;
            background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%);
          }

          .family-member-card {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 16px;
            padding: 1.25rem;
            margin-bottom: 1rem;
            border: 2px solid #e2e8f0;
            transition: all 0.3s ease;
            cursor: pointer;
          }

          .family-member-card:hover {
            border-color: #FF5A1F;
            transform: translateX(8px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          }

          .member-avatar {
            width: 56px;
            height: 56px;
            border-radius: 16px;
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 1.25rem;
            box-shadow: 0 4px 14px rgba(255, 90, 31, 0.3);
          }

          .badge-status {
            padding: 0.5rem 1rem;
            border-radius: 10px;
            font-weight: 600;
            font-size: 0.85rem;
            letter-spacing: 0.3px;
          }

          .progress-bar-custom {
            height: 12px;
            border-radius: 10px;
            background: #e2e8f0;
            overflow: hidden;
            position: relative;
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #FF5A1F 0%, #E63946 100%);
            border-radius: 10px;
            transition: width 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            overflow: hidden;
          }

          .progress-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: shimmer 2s infinite;
          }

          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }

          .checklist-item {
            background: white;
            border-radius: 12px;
            padding: 1.25rem;
            margin-bottom: 0.75rem;
            border: 2px solid #e2e8f0;
            transition: all 0.3s ease;
            cursor: pointer;
          }

          .checklist-item:hover {
            border-color: #FF5A1F;
            transform: translateX(4px);
          }

          .checklist-item.checked {
            background: linear-gradient(135deg, #fff5f1 0%, #ffe8e1 100%);
            border-color: #FF5A1F;
          }

          .custom-checkbox {
            width: 24px;
            height: 24px;
            border: 2px solid #cbd5e1;
            border-radius: 8px;
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
          }

          .custom-checkbox.checked {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            border-color: #FF5A1F;
          }

          .custom-checkbox.checked::after {
            content: '✓';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 14px;
            font-weight: bold;
          }

          .alert-notification {
            border-radius: 16px;
            border: none;
            padding: 1.5rem;
            margin-bottom: 1rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            animation: slideInRight 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
          }

          .alert-notification::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 5px;
            transition: width 0.3s ease;
          }

          .alert-notification:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.15);
          }

          .alert-notification:hover::before {
            width: 8px;
          }

          .alert-notification.alert-danger {
            background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%);
            border-left: 5px solid #dc2626;
          }

          .alert-notification.alert-danger::before {
            background: #dc2626;
          }

          .alert-notification.alert-warning {
            background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
            border-left: 5px solid #f59e0b;
          }

          .alert-notification.alert-warning::before {
            background: #f59e0b;
          }

          .alert-notification.alert-success {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border-left: 5px solid #22c55e;
          }

          .alert-notification.alert-success::before {
            background: #22c55e;
          }

          .alert-notification.alert-info {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border-left: 5px solid #3b82f6;
          }

          .alert-notification.alert-info::before {
            background: #3b82f6;
          }

          .alert-icon-wrapper {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }

          .alert-danger .alert-icon-wrapper {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          }

          .alert-warning .alert-icon-wrapper {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          }

          .alert-success .alert-icon-wrapper {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          }

          .alert-info .alert-icon-wrapper {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          }

          .alert-content {
            flex: 1;
            min-width: 0;
          }

          .alert-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 0.5rem;
            line-height: 1.4;
          }

          .alert-description {
            font-size: 0.95rem;
            color: #64748b;
            line-height: 1.6;
            margin-bottom: 0.75rem;
          }

          .alert-meta {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
            font-size: 0.85rem;
            color: #94a3b8;
          }

          .alert-badge {
            padding: 0.4rem 0.9rem;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .alert-danger .alert-badge {
            background: rgba(220, 38, 38, 0.15);
            color: #dc2626;
          }

          .alert-warning .alert-badge {
            background: rgba(245, 158, 11, 0.15);
            color: #f59e0b;
          }

          .alert-success .alert-badge {
            background: rgba(34, 197, 94, 0.15);
            color: #22c55e;
          }

          .alert-info .alert-badge {
            background: rgba(59, 130, 246, 0.15);
            color: #3b82f6;
          }

          .alert-close-btn {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: rgba(0,0,0,0.05);
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            cursor: pointer;
            flex-shrink: 0;
          }

          .alert-close-btn:hover {
            background: rgba(0,0,0,0.1);
            transform: rotate(90deg);
          }

          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(50px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateX(0) scale(1);
            }
          }

          .map-container {
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 25px rgba(0,0,0,0.12);
            position: relative;
          }

          .leaflet-container {
            border-radius: 16px;
          }

          .btn-recenter {
            position: absolute;
            top: 1rem;
            right: 1rem;
            z-index: 1000;
            background: white;
            border: none;
            border-radius: 12px;
            padding: 0.75rem;
            box-shadow: 0 4px 14px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            cursor: pointer;
          }

          .btn-recenter:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(0,0,0,0.2);
          }

          .loading-spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #f3f4f6;
            border-top-color: #FF5A1F;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .empty-state {
            text-align: center;
            padding: 3rem 1rem;
          }

          .empty-state-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #f6f8fb 0%, #e2e8f0 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
          }

          .broadcast-image {
            max-width: 100%;
            border-radius: 8px;
            margin-top: 0.5rem;
          }

          @media (max-width: 768px) {
            .hero-title {
              font-size: 2.5rem;
            }
            
            .stat-number {
              font-size: 2rem;
            }

            .action-button {
              padding: 1.5rem 1rem;
              font-size: 1rem;
            }
          }
        `}
      </style>

      <div className="home-container">
        <Header profileData={profileData} />

        {/* Hero Section */}
        <section className="hero-gradient text-white py-5 position-relative">
          <div className="container py-4">
            <div className="text-center position-relative">
              <h1 className="hero-title mb-3">SafeLink Dashboard</h1>
              <p className="hero-subtitle mb-4">
                Your family's safety, always connected
              </p>
              <div className="d-flex justify-content-center gap-3 flex-wrap">
                <div className="stat-card text-dark">
                  <div className="stat-number">{familyMembers.length}</div>
                  <div className="stat-label">Family Members</div>
                </div>
                <div className="stat-card text-dark">
                  <div className="stat-number">{alerts.length}</div>
                  <div className="stat-label">Active Alerts</div>
                </div>
                <div className="stat-card text-dark">
                  <div className="stat-number">{evacCenters.length}</div>
                  <div className="stat-label">Nearby Centers</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container py-5 px-4">
          {/* Quick Actions */}
          <div className="row g-4 mb-5">
            <div className="col-12 col-sm-6 col-lg-3">
              <button
                className="action-button sos-button w-100 d-flex flex-column align-items-center justify-content-center gap-3"
                onClick={handleSOSAlert}
                style={{ minHeight: "160px" }}
              >
                <Shield size={42} />
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "800" }}>
                    SOS
                  </div>
                  <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                    Emergency Alert
                  </div>
                </div>
              </button>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <button
                className="action-button w-100 d-flex flex-column align-items-center justify-content-center gap-3"
                onClick={handleFamilyCheckIn}
                style={{ minHeight: "160px" }}
              >
                <Users size={42} />
                <div>
                  <div style={{ fontSize: "1.25rem", fontWeight: "700" }}>
                    Check-In
                  </div>
                  <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                    Notify Family
                  </div>
                </div>
              </button>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <button
                className="action-button w-100 d-flex flex-column align-items-center justify-content-center gap-3"
                onClick={() => navigate("/alerts")}
                style={{ minHeight: "160px" }}
              >
                <Radio size={42} />
                <div>
                  <div style={{ fontSize: "1.25rem", fontWeight: "700" }}>
                    Alerts
                  </div>
                  <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                    View All
                  </div>
                </div>
              </button>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <button
                className="action-button w-100 d-flex flex-column align-items-center justify-content-center gap-3"
                onClick={() => navigate("/family")}
                style={{ minHeight: "160px" }}
              >
                <MapPin size={42} />
                <div>
                  <div style={{ fontSize: "1.25rem", fontWeight: "700" }}>
                    Locations
                  </div>
                  <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                    Track Family
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="row g-4">
            {/* Alerts Card */}
            <div className="col-12">
              <div className="dashboard-card">
                <div className="card-header-custom">
                  <h2 className="card-title-custom">
                    <div className="icon-wrapper">
                      <Bell size={24} color="white" />
                    </div>
                    Active Alerts
                  </h2>
                </div>
                <div className="card-body-custom">
                  {alerts.length > 0 ? (
                    <div>
                      {alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`alert-notification alert ${getSeverityClass(
                            alert.severity
                          )}`}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div className="alert-icon-wrapper">
                              {alert.severity === "high" && (
                                <AlertTriangle size={24} color="white" />
                              )}
                              {alert.severity === "medium" && (
                                <AlertCircle size={24} color="white" />
                              )}
                              {alert.severity === "low" && (
                                <CheckCircle size={24} color="white" />
                              )}
                              {alert.severity === "warning" && (
                                <Bell size={24} color="white" />
                              )}
                            </div>

                            <div className="alert-content">
                              <div className="alert-title">{alert.text}</div>

                              {alert.description && (
                                <div className="alert-description">
                                  {alert.description}
                                </div>
                              )}

                              {alert.isBroadcast && alert.image && (
                                <img
                                  src={alert.image}
                                  alt="Broadcast"
                                  className="broadcast-image"
                                  style={{
                                    maxWidth: "100%",
                                    borderRadius: "12px",
                                    marginTop: "0.75rem",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                  }}
                                />
                              )}

                              <div className="alert-meta">
                                <span className="alert-badge">
                                  {alert.severity === "high"
                                    ? "Critical"
                                    : alert.severity === "medium"
                                    ? "Warning"
                                    : alert.severity === "low"
                                    ? "Info"
                                    : "Update"}
                                </span>
                                {alert.isBroadcast && (
                                  <span className="d-flex align-items-center gap-1">
                                    <Radio size={14} />
                                    Broadcast
                                  </span>
                                )}
                                {alert.isDiaster && (
                                  <span className="d-flex align-items-center gap-1">
                                    <AlertTriangle size={14} />
                                    Disaster Alert
                                  </span>
                                )}
                                <span className="d-flex align-items-center gap-1">
                                  <Clock size={14} />
                                  Just now
                                </span>
                              </div>
                            </div>

                            <button
                              className="alert-close-btn"
                              onClick={() => dismissAlert(alert.id)}
                              aria-label="Dismiss alert"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <CheckCircle size={40} className="text-success" />
                      </div>
                      <h5 style={{ fontWeight: 600, color: "#64748b" }}>
                        All Clear
                      </h5>
                      <p className="text-muted mb-0">
                        No active alerts at this time
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Family Members Card */}
            <div className="col-12 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom">
                  <h2 className="card-title-custom">
                    <div className="icon-wrapper">
                      <Users size={24} color="white" />
                    </div>
                    Family Members
                  </h2>
                </div>
                <div className="card-body-custom">
                  {familyLoading ? (
                    <div className="empty-state">
                      <div className="loading-spinner"></div>
                      <p className="text-muted mt-3 mb-0">
                        Loading family data...
                      </p>
                    </div>
                  ) : familyMembers.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <Users size={40} className="text-muted" />
                      </div>
                      <h5 style={{ fontWeight: 600, color: "#64748b" }}>
                        No Members Yet
                      </h5>
                      <p className="text-muted mb-3">
                        Invite family members to get started
                      </p>
                      <button
                        className="btn btn-sm"
                        onClick={() => navigate("/family")}
                        style={{
                          background:
                            "linear-gradient(135deg, #FF5A1F 0%, #E63946 100%)",
                          color: "white",
                          border: "none",
                          borderRadius: "10px",
                          padding: "0.6rem 1.5rem",
                          fontWeight: 600,
                        }}
                      >
                        Add Members
                      </button>
                    </div>
                  ) : (
                    <div>
                      {familyMembers.map((member, index) => (
                        <div
                          key={member.userId || index}
                          className="family-member-card"
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div className="member-avatar">
                              {member.name
                                ? member.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                : "U"}
                            </div>
                            <div className="flex-grow-1">
                              <h6
                                style={{
                                  fontWeight: 700,
                                  fontSize: "1.1rem",
                                  marginBottom: "0.5rem",
                                  color: "#1a202c",
                                }}
                              >
                                {member.name || "Unknown"}
                              </h6>
                              <div className="d-flex align-items-center gap-2">
                                {getStatusIcon(member.status)}
                                <span
                                  className={`badge-status ${getStatusBadge(
                                    member.status
                                  )}`}
                                >
                                  {member.status || "Not Yet Responded"}
                                </span>
                              </div>
                            </div>
                            <ChevronRight size={24} className="text-muted" />
                          </div>
                        </div>
                      ))}
                      <button
                        className="btn w-100 mt-3"
                        onClick={() => navigate("/family")}
                        style={{
                          background:
                            "linear-gradient(135deg, #f6f8fb 0%, #e2e8f0 100%)",
                          border: "2px solid #e2e8f0",
                          borderRadius: "12px",
                          padding: "0.875rem",
                          fontWeight: 600,
                          color: "#64748b",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = "#FF5A1F";
                          e.target.style.color = "#FF5A1F";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = "#e2e8f0";
                          e.target.style.color = "#64748b";
                        }}
                      >
                        View All Members
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Barangay Members Card - ONLY SHOW FOR VERIFIED OFFICIALS */}
            {isVerifiedOfficial && (
              <div className="col-12 col-lg-6">
                <div className="dashboard-card">
                  <div className="card-header-custom">
                    <h2 className="card-title-custom">
                      <div className="icon-wrapper">
                        <Users size={24} color="white" />
                      </div>
                      Barangay Members
                    </h2>
                  </div>
                  <div className="card-body-custom">
                    {barangayMembers.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <Users size={40} className="text-muted" />
                        </div>
                        <h5 style={{ fontWeight: 600, color: "#64748b" }}>
                          No Members Yet
                        </h5>
                        <p className="text-muted mb-0">
                          Your barangay doesn't have any members yet
                        </p>
                      </div>
                    ) : (
                      <div>
                        {barangayMembers.slice(0, 10).map((member, index) => (
                          <div
                            key={member.id || index}
                            className="family-member-card"
                            style={{ cursor: "default" }}
                          >
                            <div className="d-flex align-items-center gap-3">
                              <div className="member-avatar">
                                {member.profile?.firstName?.[0]?.toUpperCase() ||
                                  "U"}
                                {member.profile?.lastName?.[0]?.toUpperCase() ||
                                  ""}
                              </div>
                              <div className="flex-grow-1">
                                <h6
                                  style={{
                                    fontWeight: 700,
                                    fontSize: "1.1rem",
                                    marginBottom: "0.5rem",
                                    color: "#1a202c",
                                  }}
                                >
                                  {member.profile?.firstName || ""}{" "}
                                  {member.profile?.lastName || "Unknown"}
                                </h6>
                                <div className="d-flex align-items-center gap-2">
                                  <span
                                    style={{
                                      fontSize: "0.875rem",
                                      color: "#64748b",
                                    }}
                                  >
                                    {member.email || "No email"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          className="btn w-100 mt-3"
                          onClick={() => navigate("/barangay-members")}
                          style={{
                            background:
                              "linear-gradient(135deg, #f6f8fb 0%, #e2e8f0 100%)",
                            border: "2px solid #e2e8f0",
                            borderRadius: "12px",
                            padding: "0.875rem",
                            fontWeight: 600,
                            color: "#64748b",
                            transition: "all 0.3s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.borderColor = "#FF5A1F";
                            e.target.style.color = "#FF5A1F";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.borderColor = "#e2e8f0";
                            e.target.style.color = "#64748b";
                          }}
                        >
                          View All Barangay Members
                        </button>
                        <button
                          className="btn w-100 mt-2"
                          onClick={() => navigate("/broadcast-disaster")}
                          style={{
                            background:
                              "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
                            border: "none",
                            borderRadius: "12px",
                            padding: "0.875rem",
                            fontWeight: 600,
                            color: "white",
                            transition: "all 0.3s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = "translateY(-2px)";
                            e.target.style.boxShadow =
                              "0 4px 12px rgba(220, 38, 38, 0.3)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow = "none";
                          }}
                        >
                          Broadcast Disaster Alert
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Evacuation Centers Card */}
            <div className="col-12 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom">
                  <h2 className="card-title-custom">
                    <div className="icon-wrapper">
                      <MapPin size={24} color="white" />
                    </div>
                    Evacuation Centers
                  </h2>
                </div>
                <div className="card-body-custom">
                  {mapLoading ? (
                    <div className="empty-state">
                      <div className="loading-spinner"></div>
                      <p className="text-muted mt-3 mb-0">Loading map...</p>
                    </div>
                  ) : (
                    <div className="position-relative">
                      <div
                        className="map-container"
                        style={{ height: "400px" }}
                      >
                        <MapContainer
                          center={
                            userLocation
                              ? [userLocation.latitude, userLocation.longitude]
                              : [14.5547, 121.0244]
                          }
                          zoom={13}
                          style={{ height: "100%", width: "100%" }}
                          whenCreated={setMapInstance}
                        >
                          <TileLayer
                            attribution="&copy; OpenStreetMap contributors"
                            url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
                          />
                          {userLocation && (
                            <Marker
                              position={[
                                userLocation.latitude,
                                userLocation.longitude,
                              ]}
                              icon={userIcon}
                            >
                              <Popup>
                                <strong>Your Location</strong>
                              </Popup>
                            </Marker>
                          )}
                          {evacCenters.map((center, index) => (
                            <Marker
                              key={index}
                              position={[
                                center.coordinates.latitude,
                                center.coordinates.longitude,
                              ]}
                              icon={evacIcon}
                            >
                              <Popup>
                                <div style={{ minWidth: "200px" }}>
                                  <strong
                                    style={{
                                      fontSize: "1.1rem",
                                      color: "#1a202c",
                                    }}
                                  >
                                    {center.name}
                                  </strong>
                                  <p
                                    style={{
                                      margin: "0.5rem 0",
                                      color: "#64748b",
                                    }}
                                  >
                                    {center.address}
                                  </p>
                                  <p
                                    style={{
                                      margin: "0.5rem 0",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Type: {center.type}
                                  </p>
                                  <p
                                    style={{
                                      margin: "0.5rem 0",
                                      fontWeight: 600,
                                      color: "#FF5A1F",
                                    }}
                                  >
                                    Distance: {center.distance.toFixed(2)} km
                                  </p>
                                  <a
                                    href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation?.latitude},${userLocation?.longitude}&destination=${center.coordinates.latitude},${center.coordinates.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: "inline-block",
                                      marginTop: "0.5rem",
                                      padding: "0.5rem 1rem",
                                      background:
                                        "linear-gradient(135deg, #FF5A1F 0%, #E63946 100%)",
                                      color: "white",
                                      borderRadius: "8px",
                                      textDecoration: "none",
                                      fontWeight: 600,
                                      fontSize: "0.9rem",
                                    }}
                                  >
                                    Get Directions
                                  </a>
                                </div>
                              </Popup>
                            </Marker>
                          ))}
                        </MapContainer>
                      </div>
                      <button
                        className="btn-recenter"
                        onClick={recenterMap}
                        title="Recenter Map"
                      >
                        <MapPin size={20} color="#FF5A1F" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Go-Bag Checklist Card */}
            <div className="col-12 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom">
                  <h2 className="card-title-custom">
                    <div className="icon-wrapper">
                      <Package size={24} color="white" />
                    </div>
                    Emergency Go-Bag
                  </h2>
                </div>
                <div className="card-body-custom">
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span style={{ fontWeight: 600, color: "#64748b" }}>
                        Progress: {completedCount}/{checklistItems.length}
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "1.25rem",
                          color: "#FF5A1F",
                        }}
                      >
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                    <div className="progress-bar-custom">
                      <div
                        className="progress-fill"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    {checklistItems.map((item) => (
                      <div
                        key={item.key}
                        className={`checklist-item ${
                          checklist[item.key] ? "checked" : ""
                        }`}
                        onClick={() => handleChecklistChange(item.key)}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className={`custom-checkbox ${
                              checklist[item.key] ? "checked" : ""
                            }`}
                          ></div>
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: "1.05rem",
                              color: "#1a202c",
                              flex: 1,
                            }}
                          >
                            {item.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    className="action-button w-100 mt-4"
                    onClick={handleSaveChecklist}
                    style={{ minHeight: "auto", padding: "1rem" }}
                  >
                    <CheckCircle size={20} className="me-2" />
                    Save Checklist
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Updates Card */}
            <div className="col-12 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom">
                  <h2 className="card-title-custom">
                    <div className="icon-wrapper">
                      <Radio size={24} color="white" />
                    </div>
                    Recent Updates
                  </h2>
                </div>
                <div className="card-body-custom">
                  {alerts.length > 0 ? (
                    <div>
                      {alerts.slice(0, 3).map((alert) => (
                        <div
                          key={alert.id}
                          style={{
                            background:
                              "linear-gradient(135deg, #f6f8fb 0%, #ffffff 100%)",
                            borderRadius: "12px",
                            padding: "1.25rem",
                            marginBottom: "1rem",
                            borderLeft: `4px solid ${
                              alert.severity === "high"
                                ? "#dc2626"
                                : alert.severity === "medium"
                                ? "#f59e0b"
                                : "#22c55e"
                            }`,
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <span
                                style={{
                                  fontWeight: 600,
                                  fontSize: "1rem",
                                  color: "#1a202c",
                                }}
                              >
                                {alert.text}
                              </span>
                              {alert.isBroadcast && (
                                <>
                                  <p
                                    style={{
                                      margin: "0.5rem 0",
                                      color: "#64748b",
                                    }}
                                  >
                                    {alert.description}
                                  </p>
                                  {alert.image && (
                                    <img
                                      src={alert.image}
                                      alt="Broadcast"
                                      className="broadcast-image"
                                    />
                                  )}
                                </>
                              )}
                            </div>
                            <span
                              style={{
                                fontSize: "0.85rem",
                                color: "#94a3b8",
                                whiteSpace: "nowrap",
                                marginLeft: "1rem",
                              }}
                            >
                              Just now
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <Radio size={40} className="text-muted" />
                      </div>
                      <h5 style={{ fontWeight: 600, color: "#64748b" }}>
                        No Recent Updates
                      </h5>
                      <p className="text-muted mb-0">You're all caught up!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Toast */}
        {error && (
          <div
            className="position-fixed bottom-0 end-0 p-4"
            style={{ zIndex: 9999 }}
          >
            <div
              className="alert-notification alert alert-danger d-flex align-items-center gap-3"
              style={{
                minWidth: "320px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
              }}
            >
              <AlertTriangle size={24} />
              <div className="flex-grow-1">
                <strong className="d-block mb-1">Error</strong>
                <span>{error}</span>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setError(null)}
              ></button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
