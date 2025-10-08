import { useState, useEffect, useCallback } from "react";
import { auth, db } from "../config/firebase";
import Header from "../components/Header";
import {
  updateProfile,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import {
  regions,
  provinces,
  cities,
  barangays,
} from "select-philippines-address";
import {
  User,
  Mail,
  Phone,
  Edit3,
  Save,
  X,
  Trash2,
  Shield,
  AlertTriangle,
  Eye,
  EyeOff,
  Calendar,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Account = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    profile: false,
    password: false,
    delete: false,
  });
  const [notifications, setNotifications] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [deleteError, setDeleteError] = useState("");
  const [regionList, setRegionList] = useState([]);
  const [provinceList, setProvinceList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [barangayList, setBarangayList] = useState([]);
  const [regionCode, setRegionCode] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [cityCode, setCityCode] = useState("");

  const [profileData, setProfileData] = useState({
    profile: {
      firstName: "",
      lastName: "",
      birthdate: "",
      administrativeLocation: {
        region: "",
        province: "",
        municipality: "",
        barangay: "",
      },
    },
    email: "",
    phoneNumber: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState({
    password: "",
    confirmText: "",
  });

  const [formErrors, setFormErrors] = useState({
    profile: {},
    password: {},
    delete: {},
  });

  const addNotification = useCallback((message, type = "success") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  const validateProfileData = useCallback((data) => {
    const errors = {};
    if (!data.profile.firstName.trim()) {
      errors.firstName = "First name is required";
    }
    if (!data.profile.lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    if (!data.phoneNumber) {
      errors.phoneNumber = "Phone number is required";
    } else if (!/^\+?[\d\s-]{10,}$/.test(data.phoneNumber)) {
      errors.phoneNumber = "Invalid phone number format";
    }
    if (!data.profile.birthdate) {
      errors.birthdate = "Birthdate is required";
    }
    if (!data.profile.administrativeLocation.region) {
      errors.region = "Please select a region";
    }
    if (!data.profile.administrativeLocation.province) {
      errors.province = "Please select a province";
    }
    if (!data.profile.administrativeLocation.municipality) {
      errors.municipality = "Please select a city/municipality";
    }
    if (!data.profile.administrativeLocation.barangay) {
      errors.barangay = "Please select a barangay";
    }
    return errors;
  }, []);

  const validatePasswordData = useCallback((data) => {
    const errors = {};
    if (!data.currentPassword) {
      errors.currentPassword = "Current password is required";
    }
    if (data.newPassword.length < 6) {
      errors.newPassword = "New password must be at least 6 characters";
    }
    if (data.newPassword !== data.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    return errors;
  }, []);

  const validateDeleteConfirmation = useCallback((data) => {
    const errors = {};
    if (!data.password) {
      errors.password = "Password is required";
    }
    if (data.confirmText !== "DELETE") {
      errors.confirmText = "Please type 'DELETE' to confirm";
    }
    return errors;
  }, []);

  const loadRegions = async () => {
    try {
      const regionData = await regions();
      setRegionList(regionData);
    } catch (error) {
      console.error("Error loading regions:", error);
    }
  };

  const loadProvinces = async (regCode) => {
    try {
      const provinceData = await provinces(regCode);
      setProvinceList(provinceData);
      setCityList([]);
      setBarangayList([]);
    } catch (error) {
      console.error("Error loading provinces:", error);
    }
  };

  const loadCities = async (provCode) => {
    try {
      const cityData = await cities(provCode);
      setCityList(cityData);
      setBarangayList([]);
    } catch (error) {
      console.error("Error loading cities:", error);
    }
  };

  const loadBarangays = async (cityCode) => {
    try {
      const barangayData = await barangays(cityCode);
      setBarangayList(barangayData);
    } catch (error) {
      console.error("Error loading barangays:", error);
    }
  };

  useEffect(() => {
    loadRegions();
  }, []);

  useEffect(() => {
    if (regionCode) {
      loadProvinces(regionCode);
    } else {
      setProvinceList([]);
      setCityList([]);
      setBarangayList([]);
      setProvinceCode("");
      setCityCode("");
    }
  }, [regionCode]);

  useEffect(() => {
    if (provinceCode) {
      loadCities(provinceCode);
    } else {
      setCityList([]);
      setBarangayList([]);
      setCityCode("");
    }
  }, [provinceCode]);

  useEffect(() => {
    if (cityCode) {
      loadBarangays(cityCode);
    } else {
      setBarangayList([]);
    }
  }, [cityCode]);

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
                birthdate: userData.profile?.birthdate || "",
                administrativeLocation: {
                  region:
                    userData.profile?.administrativeLocation?.region || "",
                  province:
                    userData.profile?.administrativeLocation?.province || "",
                  municipality:
                    userData.profile?.administrativeLocation?.municipality ||
                    "",
                  barangay:
                    userData.profile?.administrativeLocation?.barangay || "",
                },
              },
              email: userData.email || firebaseUser.email || "",
              phoneNumber:
                userData.phoneNumber || firebaseUser.phoneNumber || "",
            });
          }
        } catch (error) {
          addNotification("Failed to fetch user data", "error");
          console.error("Error fetching user document:", error);
        }
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate, addNotification]);

  // Set regionCode when regionList and profileData are available
  useEffect(() => {
    if (
      regionList.length > 0 &&
      profileData.profile.administrativeLocation.region
    ) {
      const selectedRegion = regionList.find(
        (r) =>
          r.region_name === profileData.profile.administrativeLocation.region
      );
      if (selectedRegion && selectedRegion.region_code !== regionCode) {
        setRegionCode(selectedRegion.region_code);
      }
    }
  }, [regionList, profileData.profile.administrativeLocation.region]);

  // Set provinceCode when provinceList and profileData are available
  useEffect(() => {
    if (
      provinceList.length > 0 &&
      profileData.profile.administrativeLocation.province
    ) {
      const selectedProvince = provinceList.find(
        (p) =>
          p.province_name ===
          profileData.profile.administrativeLocation.province
      );
      if (selectedProvince && selectedProvince.province_code !== provinceCode) {
        setProvinceCode(selectedProvince.province_code);
      }
    }
  }, [provinceList, profileData.profile.administrativeLocation.province]);

  // Set cityCode when cityList and profileData are available
  useEffect(() => {
    if (
      cityList.length > 0 &&
      profileData.profile.administrativeLocation.municipality
    ) {
      const selectedCity = cityList.find(
        (c) =>
          c.city_name ===
          profileData.profile.administrativeLocation.municipality
      );
      if (selectedCity && selectedCity.city_code !== cityCode) {
        setCityCode(selectedCity.city_code);
      }
    }
  }, [cityList, profileData.profile.administrativeLocation.municipality]);

  const handleRegionChange = (e) => {
    const selectedRegion = regionList.find(
      (r) => r.region_name === e.target.value
    );
    if (selectedRegion) {
      setProfileData({
        ...profileData,
        profile: {
          ...profileData.profile,
          administrativeLocation: {
            ...profileData.profile.administrativeLocation,
            region: selectedRegion.region_name,
            province: "",
            municipality: "",
            barangay: "",
          },
        },
      });
      setRegionCode(selectedRegion.region_code);
      setProvinceCode("");
      setCityCode("");
      setFormErrors((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          region: "",
          province: "",
          municipality: "",
          barangay: "",
        },
      }));
    }
  };

  const handleProvinceChange = (e) => {
    const selectedProvince = provinceList.find(
      (p) => p.province_name === e.target.value
    );
    if (selectedProvince) {
      setProfileData({
        ...profileData,
        profile: {
          ...profileData.profile,
          administrativeLocation: {
            ...profileData.profile.administrativeLocation,
            province: selectedProvince.province_name,
            municipality: "",
            barangay: "",
          },
        },
      });
      setProvinceCode(selectedProvince.province_code);
      setCityCode("");
      setFormErrors((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          province: "",
          municipality: "",
          barangay: "",
        },
      }));
    }
  };

  const handleCityChange = (e) => {
    const selectedCity = cityList.find((c) => c.city_name === e.target.value);
    if (selectedCity) {
      setProfileData({
        ...profileData,
        profile: {
          ...profileData.profile,
          administrativeLocation: {
            ...profileData.profile.administrativeLocation,
            municipality: selectedCity.city_name,
            barangay: "",
          },
        },
      });
      setCityCode(selectedCity.city_code);
      setFormErrors((prev) => ({
        ...prev,
        profile: { ...prev.profile, municipality: "", barangay: "" },
      }));
    }
  };

  const handleBarangayChange = (e) => {
    setProfileData({
      ...profileData,
      profile: {
        ...profileData.profile,
        administrativeLocation: {
          ...profileData.profile.administrativeLocation,
          barangay: e.target.value,
        },
      },
    });
    setFormErrors((prev) => ({
      ...prev,
      profile: { ...prev.profile, barangay: "" },
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const errors = validateProfileData(profileData);
    setFormErrors((prev) => ({ ...prev, profile: errors }));

    if (Object.keys(errors).length > 0) return;

    setLoadingStates((prev) => ({ ...prev, profile: true }));
    try {
      const fullName =
        `${profileData.profile.firstName} ${profileData.profile.lastName}`.trim();
      await updateProfile(auth.currentUser, {
        displayName: fullName,
      });

      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(
        userDocRef,
        {
          profile: {
            firstName: profileData.profile.firstName,
            lastName: profileData.profile.lastName,
            birthdate: profileData.profile.birthdate,
            administrativeLocation: profileData.profile.administrativeLocation,
            isVerifiedOfficial: false,
          },
          email: profileData.email,
          phoneNumber: profileData.phoneNumber,
        },
        { merge: true }
      );

      addNotification("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      addNotification("Failed to update profile", "error");
      console.error(error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, profile: false }));
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const errors = validatePasswordData(passwordData);
    setFormErrors((prev) => ({ ...prev, password: errors }));

    if (Object.keys(errors).length > 0) return;

    setLoadingStates((prev) => ({ ...prev, password: true }));
    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, passwordData.newPassword);

      addNotification("Password updated successfully!");
      setShowPasswordChange(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setFormErrors((prev) => ({ ...prev, password: {} }));
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        addNotification("Current password is incorrect", "error");
      } else {
        addNotification("Failed to update password", "error");
      }
      console.error(error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, password: false }));
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    const errors = validateDeleteConfirmation(deleteConfirmation);
    setFormErrors((prev) => ({ ...prev, delete: errors }));
    setDeleteError("");

    if (Object.keys(errors).length > 0) return;

    setLoadingStates((prev) => ({ ...prev, delete: true }));
    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        deleteConfirmation.password
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await deleteDoc(userDocRef);
      await deleteUser(auth.currentUser);
      addNotification("Account deleted successfully", "success");
      navigate("/login");
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        setDeleteError("Password is incorrect");
      } else {
        setDeleteError("Failed to delete account");
      }
      console.error(error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, delete: false }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const formatDate = (date) => {
    if (!date) return "Not available";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) {
    return (
      <div className="account-root">
        <div className="account-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          .account-root {
            min-height: 100vh;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            display: flex;
            flex-direction: column;
          }

          .account-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            gap: 1rem;
          }

          .account-header {
            padding: 1.5rem 0;
            background: white;
            border-bottom: 1px solid #e9ecef;
            text-align: center;
          }

          .account-tagline {
            color: #6c757d;
            font-size: 0.875rem;
            margin: 0.5rem 0 0 0;
          }

          .account-div {
            padding: 2rem 0;
          }

          .account-title {
            text-align: center;
            margin: 0 0 0.5rem 0;
            font-size: 2rem;
            font-weight: 700;
            color: #1a1a1a;
          }

          .account-desc {
            text-align: center;
            color: #6c757d;
            margin-bottom: 2rem;
            font-size: 1rem;
          }

          .account-success {
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 1rem;
            border-radius: 8px;
            margin: 1.5rem 0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: 500;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            animation: slideIn 0.3s ease;
          }

          .account-success-icon {
            background: #28a745;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: bold;
            flex-shrink: 0;
          }

          .account-form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.25rem;
            margin-bottom: 1.5rem;
          }

          .account-section-title {
            grid-column: 1 / -1;
            font-size: 1.1rem;
            font-weight: 600;
            color: #1a1a1a;
            margin: 1rem 0 0.5rem 0;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e9ecef;
          }

          .account-input-div {
            display: flex;
            flex-direction: column;
          }

          .account-input-div label {
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #374151;
            font-size: 0.875rem;
          }

          .account-input-div input,
          .account-input-div select {
            padding: 0.75rem 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.3s ease;
            background-color: #fafafa;
            width: 100%;
          }

          .account-input-div input:focus,
          .account-input-div select:focus {
            outline: none;
            border-color: #FF5A1F;
            background-color: white;
            box-shadow: 0 0 0 3px rgba(255, 90, 31, 0.1);
          }

          .account-input-div input.is-invalid,
          .account-input-div select.is-invalid {
            border-color: #dc3545;
            background-color: #fdf2f2;
          }

          .account-input-div select:disabled {
            background-color: #e9ecef;
            cursor: not-allowed;
            opacity: 0.6;
          }

          .account-input-error {
            color: #dc3545;
            font-size: 0.75rem;
            margin-top: 0.25rem;
            display: block;
          }

          .account-error {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 0.75rem;
            border-radius: 6px;
            margin: 1rem 0;
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .password-toggle-btn {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            background: transparent;
            border: none;
            color: #6c757d;
            cursor: pointer;
            padding: 4px;
            transition: color 0.2s;
          }

          .password-toggle-btn:hover {
            color: #FF5A1F;
          }

          .btn-safelink {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            border: 2px solid #FF5A1F;
            color: white;
            font-weight: 600;
            transition: all 0.3s ease;
            border-radius: 8px;
            padding: 0.75rem 1.5rem;
          }

          .btn-safelink:hover:not(:disabled) {
            background: linear-gradient(135deg, #E63946 0%, #c82333 100%);
            border-color: #E63946;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 90, 31, 0.3);
          }

          .btn-safelink:focus {
            background: linear-gradient(135deg, #E63946 0%, #c82333 100%);
            border-color: #E63946;
            color: white;
            box-shadow: 0 0 0 0.25rem rgba(255, 90, 31, 0.25);
          }

          .btn-safelink:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }

          .btn-secondary {
            background: white;
            border: 2px solid #e5e7eb;
            color: #6c757d;
            font-weight: 500;
            transition: all 0.3s ease;
            border-radius: 8px;
            padding: 0.75rem 1.5rem;
          }

          .btn-secondary:hover:not(:disabled) {
            border-color: #d1d5db;
            background-color: #f9fafb;
            color: #374151;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .btn-secondary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }

          .account-button-group {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
          }

          .status-badge {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 50px;
            font-size: 0.75rem;
            font-weight: 600;
            display: inline-block;
          }

          .danger-zone-card {
            background: linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%);
            border: 2px solid #fca5a5;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }

          .info-item-hover {
            transition: all 0.3s ease;
            border-radius: 8px;
            padding: 1rem;
          }

          .info-item-hover:hover {
            background-color: rgba(255, 90, 31, 0.05);
            transform: translateX(4px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .card {
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }

          .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          }

          .modal-backdrop-custom {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(6px);
            z-index: 1050;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            animation: fadeIn 0.3s ease;
          }

          .modal-content-custom {
            background: white;
            border-radius: 12px;
            max-width: 500px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            animation: modalSlideIn 0.3s ease;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(-20px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          .account-toast {
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideIn 0.3s ease;
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media (max-width: 768px) {
            .account-form-grid {
              grid-template-columns: 1fr;
            }

            .account-title {
              font-size: 1.75rem;
            }

            .account-button-group {
              flex-direction: column;
            }
          }

          @media (max-width: 576px) {
            .account-div {
              padding: 1rem 0;
            }
          }
        `}
      </style>

      <div className="account-root">
        <header className="account-header">
          <div className="container text-center">
            <Header profileData={profileData} />
            <p className="account-tagline">Your Family Safety Dashboard</p>
          </div>
        </header>

        <div className="container account-div">
          {/* Toast Notifications */}
          <div
            className="position-fixed top-0 end-0 p-3"
            style={{ zIndex: 1060, marginTop: "80px" }}
          >
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`account-toast toast show ${
                  notification.type === "error"
                    ? "account-error"
                    : "account-success"
                } text-white`}
                role="alert"
              >
                <div className="toast-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    {notification.type === "success" ? (
                      <span className="account-success-icon">✔</span>
                    ) : (
                      <AlertTriangle size={18} />
                    )}
                    <span>{notification.message}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() =>
                      setNotifications((prev) =>
                        prev.filter((n) => n.id !== notification.id)
                      )
                    }
                    aria-label="Close"
                  ></button>
                </div>
              </div>
            ))}
          </div>

          {/* Page Header */}
          <div className="text-center mb-5">
            <h1 className="account-title">My Account</h1>
            <p className="account-desc">
              Manage your SafeLink account information and settings
            </p>
          </div>

          <div className="row g-4">
            {/* Main Content Column */}
            <div className="col-lg-8">
              {/* Profile Information Card */}
              <div className="card border-0 mb-4">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="h5 mb-0 d-flex align-items-center gap-2">
                      <User size={20} className="text-primary" />
                      <span className="fw-bold">Profile Information</span>
                    </h2>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn btn-secondary btn-sm d-flex align-items-center gap-2"
                      >
                        <Edit3 size={16} />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <form
                      className="account-form"
                      onSubmit={handleProfileUpdate}
                    >
                      <div className="account-form-grid">
                        <div className="account-section-title">
                          Personal Information
                        </div>

                        <div className="account-input-div">
                          <label htmlFor="firstName" className="form-label">
                            First Name{" "}
                            <span style={{ color: "#dc3545" }}>*</span>
                          </label>
                          <input
                            id="firstName"
                            type="text"
                            value={profileData.profile.firstName}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                profile: {
                                  ...profileData.profile,
                                  firstName: e.target.value,
                                },
                              })
                            }
                            className={`form-control ${
                              formErrors.profile.firstName ? "is-invalid" : ""
                            }`}
                            placeholder="Enter your first name"
                            aria-required="true"
                            aria-invalid={!!formErrors.profile.firstName}
                            aria-describedby={
                              formErrors.profile.firstName
                                ? "firstName-error"
                                : undefined
                            }
                          />
                          {formErrors.profile.firstName && (
                            <span
                              id="firstName-error"
                              className="account-input-error"
                              role="alert"
                            >
                              {formErrors.profile.firstName}
                            </span>
                          )}
                        </div>

                        <div className="account-input-div">
                          <label htmlFor="lastName" className="form-label">
                            Last Name{" "}
                            <span style={{ color: "#dc3545" }}>*</span>
                          </label>
                          <input
                            id="lastName"
                            type="text"
                            value={profileData.profile.lastName}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                profile: {
                                  ...profileData.profile,
                                  lastName: e.target.value,
                                },
                              })
                            }
                            className={`form-control ${
                              formErrors.profile.lastName ? "is-invalid" : ""
                            }`}
                            placeholder="Enter your last name"
                            aria-required="true"
                            aria-invalid={!!formErrors.profile.lastName}
                            aria-describedby={
                              formErrors.profile.lastName
                                ? "lastName-error"
                                : undefined
                            }
                          />
                          {formErrors.profile.lastName && (
                            <span
                              id="lastName-error"
                              className="account-input-error"
                              role="alert"
                            >
                              {formErrors.profile.lastName}
                            </span>
                          )}
                        </div>

                        <div className="account-input-div">
                          <label htmlFor="email" className="form-label">
                            Email Address
                          </label>
                          <input
                            id="email"
                            type="email"
                            value={profileData.email}
                            disabled
                            className="form-control"
                            placeholder="Email cannot be changed"
                          />
                        </div>

                        <div className="account-input-div">
                          <label htmlFor="phoneNumber" className="form-label">
                            Phone Number{" "}
                            <span style={{ color: "#dc3545" }}>*</span>
                          </label>
                          <input
                            id="phoneNumber"
                            type="tel"
                            value={profileData.phoneNumber}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                phoneNumber: e.target.value,
                              })
                            }
                            className={`form-control ${
                              formErrors.profile.phoneNumber ? "is-invalid" : ""
                            }`}
                            placeholder="Enter your phone number"
                            aria-required="true"
                            aria-invalid={!!formErrors.profile.phoneNumber}
                            aria-describedby={
                              formErrors.profile.phoneNumber
                                ? "phoneNumber-error"
                                : undefined
                            }
                          />
                          {formErrors.profile.phoneNumber && (
                            <span
                              id="phoneNumber-error"
                              className="account-input-error"
                              role="alert"
                            >
                              {formErrors.profile.phoneNumber}
                            </span>
                          )}
                        </div>

                        <div className="account-input-div">
                          <label htmlFor="birthdate" className="form-label">
                            Birthdate{" "}
                            <span style={{ color: "#dc3545" }}>*</span>
                          </label>
                          <input
                            id="birthdate"
                            type="date"
                            value={profileData.profile.birthdate}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                profile: {
                                  ...profileData.profile,
                                  birthdate: e.target.value,
                                },
                              })
                            }
                            className={`form-control ${
                              formErrors.profile.birthdate ? "is-invalid" : ""
                            }`}
                            aria-required="true"
                            aria-invalid={!!formErrors.profile.birthdate}
                            aria-describedby={
                              formErrors.profile.birthdate
                                ? "birthdate-error"
                                : undefined
                            }
                          />
                          {formErrors.profile.birthdate && (
                            <span
                              id="birthdate-error"
                              className="account-input-error"
                              role="alert"
                            >
                              {formErrors.profile.birthdate}
                            </span>
                          )}
                        </div>

                        <div className="account-section-title">Address</div>

                        <div className="account-input-div">
                          <label htmlFor="region" className="form-label">
                            Region <span style={{ color: "#dc3545" }}>*</span>
                          </label>
                          <select
                            id="region"
                            className={`form-select ${
                              formErrors.profile.region ? "is-invalid" : ""
                            }`}
                            value={
                              profileData.profile.administrativeLocation.region
                            }
                            onChange={handleRegionChange}
                            aria-required="true"
                            aria-invalid={!!formErrors.profile.region}
                            aria-describedby={
                              formErrors.profile.region
                                ? "region-error"
                                : undefined
                            }
                          >
                            <option value="">Select Region</option>
                            {regionList.map((r) => (
                              <option key={r.region_code} value={r.region_name}>
                                {r.region_name}
                              </option>
                            ))}
                          </select>
                          {formErrors.profile.region && (
                            <span
                              id="region-error"
                              className="account-input-error"
                              role="alert"
                            >
                              {formErrors.profile.region}
                            </span>
                          )}
                        </div>

                        <div className="account-input-div">
                          <label htmlFor="province" className="form-label">
                            Province <span style={{ color: "#dc3545" }}>*</span>
                          </label>
                          <select
                            id="province"
                            className={`form-select ${
                              formErrors.profile.province ? "is-invalid" : ""
                            }`}
                            value={
                              profileData.profile.administrativeLocation
                                .province
                            }
                            onChange={handleProvinceChange}
                            disabled={
                              !profileData.profile.administrativeLocation.region
                            }
                            aria-required="true"
                            aria-invalid={!!formErrors.profile.province}
                            aria-describedby={
                              formErrors.profile.province
                                ? "province-error"
                                : undefined
                            }
                          >
                            <option value="">Select Province</option>
                            {provinceList.map((p) => (
                              <option
                                key={p.province_code}
                                value={p.province_name}
                              >
                                {p.province_name}
                              </option>
                            ))}
                          </select>
                          {formErrors.profile.province && (
                            <span
                              id="province-error"
                              className="account-input-error"
                              role="alert"
                            >
                              {formErrors.profile.province}
                            </span>
                          )}
                        </div>

                        <div className="account-input-div">
                          <label htmlFor="municipality" className="form-label">
                            City/Municipality{" "}
                            <span style={{ color: "#dc3545" }}>*</span>
                          </label>
                          <select
                            id="municipality"
                            className={`form-select ${
                              formErrors.profile.municipality
                                ? "is-invalid"
                                : ""
                            }`}
                            value={
                              profileData.profile.administrativeLocation
                                .municipality
                            }
                            onChange={handleCityChange}
                            disabled={
                              !profileData.profile.administrativeLocation
                                .province
                            }
                            aria-required="true"
                            aria-invalid={!!formErrors.profile.municipality}
                            aria-describedby={
                              formErrors.profile.municipality
                                ? "municipality-error"
                                : undefined
                            }
                          >
                            <option value="">Select City/Municipality</option>
                            {cityList.map((c) => (
                              <option key={c.city_code} value={c.city_name}>
                                {c.city_name}
                              </option>
                            ))}
                          </select>
                          {formErrors.profile.municipality && (
                            <span
                              id="municipality-error"
                              className="account-input-error"
                              role="alert"
                            >
                              {formErrors.profile.municipality}
                            </span>
                          )}
                        </div>

                        <div className="account-input-div">
                          <label htmlFor="barangay" className="form-label">
                            Barangay <span style={{ color: "#dc3545" }}>*</span>
                          </label>
                          <select
                            id="barangay"
                            className={`form-select ${
                              formErrors.profile.barangay ? "is-invalid" : ""
                            }`}
                            value={
                              profileData.profile.administrativeLocation
                                .barangay
                            }
                            onChange={handleBarangayChange}
                            disabled={
                              !profileData.profile.administrativeLocation
                                .municipality
                            }
                            aria-required="true"
                            aria-invalid={!!formErrors.profile.barangay}
                            aria-describedby={
                              formErrors.profile.barangay
                                ? "barangay-error"
                                : undefined
                            }
                          >
                            <option value="">Select Barangay</option>
                            {barangayList.map((b) => (
                              <option key={b.brgy_code} value={b.brgy_name}>
                                {b.brgy_name}
                              </option>
                            ))}
                          </select>
                          {formErrors.profile.barangay && (
                            <span
                              id="barangay-error"
                              className="account-input-error"
                              role="alert"
                            >
                              {formErrors.profile.barangay}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="account-button-group">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setFormErrors((prev) => ({ ...prev, profile: {} }));
                          }}
                          className="btn btn-secondary btn-lg"
                          disabled={loadingStates.profile}
                        >
                          <X size={16} className="me-2" />
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loadingStates.profile}
                          className="btn btn-safelink btn-lg"
                        >
                          {loadingStates.profile ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save size={16} className="me-2" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="account-form-grid">
                      <div className="account-input-div">
                        <label className="form-label">First Name</label>
                        <div className="info-item-hover">
                          <p className="mb-0 fw-bold">
                            {profileData.profile.firstName || "Not set"}
                          </p>
                        </div>
                      </div>
                      <div className="account-input-div">
                        <label className="form-label">Last Name</label>
                        <div className="info-item-hover">
                          <p className="mb-0 fw-bold">
                            {profileData.profile.lastName || "Not set"}
                          </p>
                        </div>
                      </div>
                      <div className="account-input-div">
                        <label className="form-label">Email Address</label>
                        <div className="info-item-hover">
                          <p className="mb-0 fw-bold">{profileData.email}</p>
                        </div>
                      </div>
                      <div className="account-input-div">
                        <label className="form-label">Phone Number</label>
                        <div className="info-item-hover">
                          <p className="mb-0 fw-bold">
                            {profileData.phoneNumber || "Not set"}
                          </p>
                        </div>
                      </div>
                      <div className="account-input-div">
                        <label className="form-label">Birthdate</label>
                        <div className="info-item-hover">
                          <p className="mb-0 fw-bold">
                            {profileData.profile.birthdate || "Not set"}
                          </p>
                        </div>
                      </div>
                      <div className="account-section-title">Address</div>
                      <div className="account-input-div">
                        <label className="form-label">Region</label>
                        <div className="info-item-hover">
                          <p className="mb-0 fw-bold">
                            {profileData.profile.administrativeLocation
                              .region || "Not set"}
                          </p>
                        </div>
                      </div>
                      <div className="account-input-div">
                        <label className="form-label">Province</label>
                        <div className="info-item-hover">
                          <p className="mb-0 fw-bold">
                            {profileData.profile.administrativeLocation
                              .province || "Not set"}
                          </p>
                        </div>
                      </div>
                      <div className="account-input-div">
                        <label className="form-label">City/Municipality</label>
                        <div className="info-item-hover">
                          <p className="mb-0 fw-bold">
                            {profileData.profile.administrativeLocation
                              .municipality || "Not set"}
                          </p>
                        </div>
                      </div>
                      <div className="account-input-div">
                        <label className="form-label">Barangay</label>
                        <div className="info-item-hover">
                          <p className="mb-0 fw-bold">
                            {profileData.profile.administrativeLocation
                              .barangay || "Not set"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Settings Card */}
              <div className="card border-0">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="h5 mb-0 d-flex align-items-center gap-2">
                      <Shield size={20} className="text-success" />
                      <span className="fw-bold">Security Settings</span>
                    </h2>
                    {!showPasswordChange && (
                      <button
                        onClick={() => setShowPasswordChange(true)}
                        className="btn btn-secondary btn-sm"
                      >
                        Change Password
                      </button>
                    )}
                  </div>

                  {showPasswordChange ? (
                    <form
                      className="account-form"
                      onSubmit={handlePasswordChange}
                    >
                      <div className="account-form-grid">
                        <div className="account-input-div">
                          <label
                            htmlFor="currentPassword"
                            className="form-label"
                          >
                            Current Password{" "}
                            <span style={{ color: "#dc3545" }}>*</span>
                          </label>
                          <div className="position-relative">
                            <input
                              id="currentPassword"
                              type={showPasswords.current ? "text" : "password"}
                              value={passwordData.currentPassword}
                              onChange={(e) =>
                                setPasswordData({
                                  ...passwordData,
                                  currentPassword: e.target.value,
                                })
                              }
                              className={`form-control ${
                                formErrors.password.currentPassword
                                  ? "is-invalid"
                                  : ""
                              }`}
                              required
                              aria-required="true"
                              aria-invalid={
                                !!formErrors.password.currentPassword
                              }
                              aria-describedby={
                                formErrors.password.currentPassword
                                  ? "currentPassword-error"
                                  : undefined
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                togglePasswordVisibility("current")
                              }
                              className="password-toggle-btn"
                            >
                              {showPasswords.current ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                          {formErrors.password.currentPassword && (
                            <span
                              id="currentPassword-error"
                              className="account-input-error"
                              role="alert"
                            >
                              {formErrors.password.currentPassword}
                            </span>
                          )}
                        </div>

                        <div className="account-input-div">
                          <label htmlFor="newPassword" className="form-label">
                            New Password{" "}
                            <span style={{ color: "#dc3545" }}>*</span>
                          </label>
                          <div className="position-relative">
                            <input
                              id="newPassword"
                              type={showPasswords.new ? "text" : "password"}
                              value={passwordData.newPassword}
                              onChange={(e) =>
                                setPasswordData({
                                  ...passwordData,
                                  newPassword: e.target.value,
                                })
                              }
                              className={`form-control ${
                                formErrors.password.newPassword
                                  ? "is-invalid"
                                  : ""
                              }`}
                              required
                              minLength="6"
                              aria-required="true"
                              aria-invalid={!!formErrors.password.newPassword}
                              aria-describedby={
                                formErrors.password.newPassword
                                  ? "newPassword-error"
                                  : undefined
                              }
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility("new")}
                              className="password-toggle-btn"
                            >
                              {showPasswords.new ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                          {formErrors.password.newPassword && (
                            <span
                              id="newPassword-error"
                              className="account-input-error"
                              role="alert"
                            >
                              {formErrors.password.newPassword}
                            </span>
                          )}
                        </div>

                        <div className="account-input-div">
                          <label
                            htmlFor="confirmPassword"
                            className="form-label"
                          >
                            Confirm New Password{" "}
                            <span style={{ color: "#dc3545" }}>*</span>
                          </label>
                          <div className="position-relative">
                            <input
                              id="confirmPassword"
                              type={showPasswords.confirm ? "text" : "password"}
                              value={passwordData.confirmPassword}
                              onChange={(e) =>
                                setPasswordData({
                                  ...passwordData,
                                  confirmPassword: e.target.value,
                                })
                              }
                              className={`form-control ${
                                formErrors.password.confirmPassword
                                  ? "is-invalid"
                                  : ""
                              }`}
                              required
                              minLength="6"
                              aria-required="true"
                              aria-invalid={
                                !!formErrors.password.confirmPassword
                              }
                              aria-describedby={
                                formErrors.password.confirmPassword
                                  ? "confirmPassword-error"
                                  : undefined
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                togglePasswordVisibility("confirm")
                              }
                              className="password-toggle-btn"
                            >
                              {showPasswords.confirm ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                          {formErrors.password.confirmPassword && (
                            <span
                              id="confirmPassword-error"
                              className="account-input-error"
                              role="alert"
                            >
                              {formErrors.password.confirmPassword}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="account-button-group">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordChange(false);
                            setPasswordData({
                              currentPassword: "",
                              newPassword: "",
                              confirmPassword: "",
                            });
                            setFormErrors((prev) => ({
                              ...prev,
                              password: {},
                            }));
                          }}
                          className="btn btn-secondary btn-lg"
                          disabled={loadingStates.password}
                        >
                          <X size={16} className="me-2" />
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loadingStates.password}
                          className="btn btn-safelink btn-lg"
                        >
                          {loadingStates.password ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              Updating...
                            </>
                          ) : (
                            <>
                              <Save size={16} className="me-2" />
                              Update Password
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="info-item-hover">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <Shield size={16} className="text-success" />
                        <small className="text-muted fw-semibold">
                          Password
                        </small>
                      </div>
                      <p className="mb-0 fw-bold">
                        Your password is secure and encrypted
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="col-lg-4">
              {/* Account Information Card */}
              <div className="card border-0 mb-4">
                <div className="card-body p-4">
                  <h2 className="h5 fw-bold mb-4">Account Information</h2>

                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Calendar size={16} className="text-muted" />
                      <small className="text-muted fw-semibold">
                        Account Created
                      </small>
                    </div>
                    <p className="mb-0 fw-bold small">
                      {formatDate(user.metadata?.creationTime)}
                    </p>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Clock size={16} className="text-muted" />
                      <small className="text-muted fw-semibold">
                        Last Sign In
                      </small>
                    </div>
                    <p className="mb-0 fw-bold small">
                      {formatDate(user.metadata?.lastSignInTime)}
                    </p>
                  </div>

                  <div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Shield size={16} className="text-muted" />
                      <small className="text-muted fw-semibold">
                        Account Status
                      </small>
                    </div>
                    <span className="status-badge">Active</span>
                  </div>
                </div>
              </div>

              {/* Danger Zone Card */}
              <div className="card border-0 danger-zone-card">
                <div className="card-body p-4">
                  <h2 className="h5 fw-bold mb-3 text-danger d-flex align-items-center gap-2">
                    <AlertTriangle size={20} />
                    <span>Danger Zone</span>
                  </h2>
                  <div className="account-error alert" role="alert">
                    <AlertTriangle size={16} className="me-2" />
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="btn btn-danger w-100 d-flex align-items-center justify-content-center gap-2"
                  >
                    <Trash2 size={18} />
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-backdrop-custom">
            <div className="modal-content-custom">
              <div className="modal-header border-0 p-4 pb-0">
                <div className="w-100 text-center">
                  <div className="bg-danger bg-opacity-10 rounded-circle p-3 d-inline-flex">
                    <AlertTriangle size={32} className="text-danger" />
                  </div>
                  <h3 className="h5 fw-bold mb-2">Delete Account</h3>
                  <p className="text-muted mb-0">
                    This action cannot be undone. This will permanently delete
                    your SafeLink account and all associated data.
                  </p>
                </div>
              </div>

              <div className="modal-body p-4">
                <form className="account-form" onSubmit={handleDeleteAccount}>
                  <div className="account-input-div mb-3">
                    <label htmlFor="deletePassword" className="form-label">
                      Enter your password to confirm{" "}
                      <span style={{ color: "#dc3545" }}>*</span>
                    </label>
                    <input
                      id="deletePassword"
                      type="password"
                      value={deleteConfirmation.password}
                      onChange={(e) =>
                        setDeleteConfirmation({
                          ...deleteConfirmation,
                          password: e.target.value,
                        })
                      }
                      className={`form-control ${
                        formErrors.delete.password ? "is-invalid" : ""
                      }`}
                      required
                      placeholder="Enter your password"
                      aria-required="true"
                      aria-invalid={!!formErrors.delete.password}
                      aria-describedby={
                        formErrors.delete.password
                          ? "deletePassword-error"
                          : undefined
                      }
                    />
                    {formErrors.delete.password && (
                      <span
                        id="deletePassword-error"
                        className="account-input-error"
                        role="alert"
                      >
                        {formErrors.delete.password}
                      </span>
                    )}
                  </div>

                  <div className="account-input-div mb-3">
                    <label htmlFor="confirmText" className="form-label">
                      Type "DELETE" to confirm{" "}
                      <span style={{ color: "#dc3545" }}>*</span>
                    </label>
                    <input
                      id="confirmText"
                      type="text"
                      value={deleteConfirmation.confirmText}
                      onChange={(e) =>
                        setDeleteConfirmation({
                          ...deleteConfirmation,
                          confirmText: e.target.value,
                        })
                      }
                      className={`form-control ${
                        formErrors.delete.confirmText ? "is-invalid" : ""
                      }`}
                      placeholder="DELETE"
                      required
                      aria-required="true"
                      aria-invalid={!!formErrors.delete.confirmText}
                      aria-describedby={
                        formErrors.delete.confirmText
                          ? "confirmText-error"
                          : undefined
                      }
                    />
                    {formErrors.delete.confirmText && (
                      <span
                        id="confirmText-error"
                        className="account-input-error"
                        role="alert"
                      >
                        {formErrors.delete.confirmText}
                      </span>
                    )}
                  </div>

                  {deleteError && (
                    <div className="account-error alert mb-3" role="alert">
                      <AlertTriangle size={16} className="me-2" />
                      {deleteError}
                    </div>
                  )}

                  <div className="account-button-group">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmation({
                          password: "",
                          confirmText: "",
                        });
                        setFormErrors((prev) => ({ ...prev, delete: {} }));
                        setDeleteError("");
                      }}
                      className="btn btn-secondary btn-lg flex-fill"
                      disabled={loadingStates.delete}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loadingStates.delete}
                      className="btn btn-danger btn-lg flex-fill d-flex align-items-center justify-content-center gap-2"
                    >
                      {loadingStates.delete ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 size={16} />
                          <span>Delete Account</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Account;
