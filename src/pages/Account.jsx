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
  User,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Save,
  X,
  Trash2,
  Shield,
  AlertTriangle,
  Eye,
  EyeOff,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
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

  const [profileData, setProfileData] = useState({
    profile: {
      firstName: "",
      lastName: "",
      address: "",
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
    if (data.phoneNumber && !/^\+?[\d\s-]{10,}$/.test(data.phoneNumber)) {
      errors.phoneNumber = "Invalid phone number format";
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
            address: profileData.profile.address || "",
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
    setDeleteError(""); // Clear previous error

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
      <>
        <style>
          {`
            .account-loading {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              text-align: center;
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            }
            .loading-spinner {
              width: 50px;
              height: 50px;
              border: 4px solid #e9ecef;
              border-top: 4px solid #FF5A1F;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin-bottom: 1rem;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
        <div className="account-loading">
          <div className="loading-spinner"></div>
          <p className="text-muted">Loading account information...</p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Custom CSS for maintaining original design and hover effects */}
      <style>
        {`
          .account-root {
            min-height: 100vh;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          }
          
          .notification-container {
            position: fixed;
            top: 90px;
            right: 1rem;
            z-index: 1050;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            max-width: 400px;
          }
          
          .account-alert {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideIn 0.3s ease;
          }
          
          .account-alert.success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
          }
          
          .account-alert.error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
          }
          
          .alert-close-btn {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 4px;
            margin-left: auto;
            transition: background-color 0.3s ease;
          }
          
          .alert-close-btn:hover {
            background-color: rgba(0, 0, 0, 0.1);
          }
          
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          .account-title {
            text-align: center;
            margin: 2rem 0;
          }
          
          .account-title h2 {
            font-size: 1.75rem;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 0.5rem;
          }
          
          .account-subtitle {
            color: #6c757d;
            font-size: 0.95rem;
          }
          
          .account-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            margin-bottom: 1.5rem;
            transition: transform 0.3s ease;
          }
          
          .account-card:hover {
            transform: translateY(-2px);
          }
          
          .card-header-custom {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
            gap: 1rem;
          }
          
          .card-title-custom {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 1.1rem;
            font-weight: 600;
            color: #1a1a1a;
            margin: 0;
          }
          
          .icon-blue {
            color: #0066cc;
          }
          
          .icon-gray {
            color: #6c757d;
          }
          
          .icon-green {
            color: #28a745;
          }
          
          .icon-small {
            width: 16px;
            height: 16px;
          }
          
          .icon-medium {
            width: 20px;
            height: 20px;
          }
          
          .icon-large {
            width: 32px;
            height: 32px;
          }
          
          .btn-safelink {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            border: 2px solid #FF5A1F;
            color: white;
            font-weight: 600;
            transition: all 0.3s ease;
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
          
          .btn-edit {
            background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .btn-edit:hover {
            background: linear-gradient(135deg, #5a6268 0%, #495057 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
          }
          
          .btn-danger-custom {
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            width: 100%;
            justify-content: center;
          }
          
          .btn-danger-custom:hover:not(:disabled) {
            background: linear-gradient(135deg, #c82333 0%, #a71e2a 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
          }
          
          .btn-danger-custom:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          
          .form-input-custom {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.3s ease;
            background-color: #fafafa;
          }
          
          .form-input-custom:focus {
            outline: none;
            border-color: #FF5A1F;
            background-color: white;
            box-shadow: 0 0 0 3px rgba(255, 90, 31, 0.1);
          }
          
          .form-input-custom.is-invalid {
            border-color: #dc3545;
            background-color: #fdf2f2;
          }
          
          .form-input-custom:disabled {
            background-color: #f8f9fa;
            color: #6c757d;
            cursor: not-allowed;
          }
          
          .input-group-custom {
            position: relative;
            display: flex;
            align-items: center;
          }
          
          .input-icon-btn {
            position: absolute;
            right: 0.75rem;
            background: none;
            border: none;
            color: #6c757d;
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 4px;
            transition: color 0.3s ease;
            display: flex;
            align-items: center;
          }
          
          .input-icon-btn:hover {
            color: #FF5A1F;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
          }
          
          .info-item {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            padding: 0.75rem 0;
          }
          
          .info-item div {
            flex: 1;
          }
          
          .info-label {
            font-size: 0.875rem;
            color: #6c757d;
            margin: 0;
          }
          
          .info-value {
            font-weight: 500;
            color: #1a1a1a;
            margin: 0.25rem 0 0 0;
          }
          
          .info-label-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.25rem;
          }
          
          .status-badge {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 500;
            display: inline-block;
          }
          
          .danger-zone {
            border: 2px solid #dc3545;
            background: linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%);
          }
          
          .danger-title {
            color: #dc3545;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .danger-text {
            color: #721c24;
            font-size: 0.875rem;
            margin-bottom: 1rem;
          }
          
          .modal-overlay-custom {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1055;
            padding: 1rem;
          }
          
          .modal-custom {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            animation: modalIn 0.3s ease;
          }
          
          @keyframes modalIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          .modal-icon-custom {
            text-align: center;
            margin-bottom: 1rem;
          }
          
          .modal-title-custom {
            text-align: center;
            font-size: 1.25rem;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 0.5rem;
          }
          
          .modal-text-custom {
            text-align: center;
            color: #6c757d;
            margin-bottom: 2rem;
            line-height: 1.6;
          }
          
          @media (max-width: 768px) {
            .info-grid {
              grid-template-columns: 1fr;
            }
            
            .card-header-custom {
              flex-direction: column;
              align-items: flex-start;
            }
            
            .notification-container {
              right: 0.5rem;
              left: 0.5rem;
              max-width: none;
            }
          }
          
          @media (max-width: 576px) {
            .modal-custom {
              margin: 0.5rem;
              padding: 1.5rem;
            }
          }
        `}
      </style>

      <div className="account-root">
        <Header profileData={profileData} />

        <main className="container py-4">
          {/* Notifications */}
          <div className="notification-container">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`account-alert ${notification.type} alert`}
              >
                {notification.type === "success" ? (
                  <CheckCircle className="icon-small" />
                ) : (
                  <AlertTriangle className="icon-small" />
                )}
                <span className="flex-grow-1">{notification.message}</span>
                <button
                  className="alert-close-btn btn btn-sm"
                  onClick={() =>
                    setNotifications((prev) =>
                      prev.filter((n) => n.id !== notification.id)
                    )
                  }
                  aria-label="Close notification"
                >
                  <X className="icon-small" />
                </button>
              </div>
            ))}
          </div>

          {/* Page Title */}
          <div className="account-title">
            <h2>My Account</h2>
            <p className="account-subtitle">
              Manage your SafeLink account information and settings
            </p>
          </div>

          <div className="row">
            {/* Main Content */}
            <div className="col-lg-8">
              {/* Profile Information Card */}
              <div className="account-card">
                <div className="card-header-custom">
                  <h3 className="card-title-custom">
                    <User className="icon-medium icon-blue" />
                    <span>Profile Information</span>
                  </h3>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn-edit btn"
                    >
                      <Edit3 className="icon-small" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleProfileUpdate}>
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label">First Name</label>
                        <input
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
                          className={`form-control form-input-custom ${
                            formErrors.profile.firstName ? "is-invalid" : ""
                          }`}
                          placeholder="Enter your first name"
                        />
                        {formErrors.profile.firstName && (
                          <div className="invalid-feedback d-block">
                            {formErrors.profile.firstName}
                          </div>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Last Name</label>
                        <input
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
                          className={`form-control form-input-custom ${
                            formErrors.profile.lastName ? "is-invalid" : ""
                          }`}
                          placeholder="Enter your last name"
                        />
                        {formErrors.profile.lastName && (
                          <div className="invalid-feedback d-block">
                            {formErrors.profile.lastName}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="form-control form-input-custom"
                        placeholder="Email cannot be changed"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        value={profileData.phoneNumber}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            phoneNumber: e.target.value,
                          })
                        }
                        className={`form-control form-input-custom ${
                          formErrors.profile.phoneNumber ? "is-invalid" : ""
                        }`}
                        placeholder="Enter your phone number"
                      />
                      {formErrors.profile.phoneNumber && (
                        <div className="invalid-feedback d-block">
                          {formErrors.profile.phoneNumber}
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <label className="form-label">Address</label>
                      <input
                        type="text"
                        value={profileData.profile.address}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            profile: {
                              ...profileData.profile,
                              address: e.target.value,
                            },
                          })
                        }
                        className="form-control form-input-custom"
                        placeholder="Enter your address"
                      />
                    </div>

                    <div className="d-flex gap-2 flex-wrap">
                      <button
                        type="submit"
                        disabled={loadingStates.profile}
                        className="btn btn-safelink d-flex align-items-center gap-2"
                      >
                        <Save className="icon-small" />
                        <span>
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
                            "Save Changes"
                          )}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setFormErrors((prev) => ({ ...prev, profile: {} }));
                        }}
                        className="btn btn-secondary d-flex align-items-center gap-2"
                      >
                        <X className="icon-small" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="info-grid">
                      <div className="info-item">
                        <User className="icon-small icon-gray" />
                        <div>
                          <p className="info-label">First Name</p>
                          <p className="info-value">
                            {profileData.profile.firstName || "Not set"}
                          </p>
                        </div>
                      </div>
                      <div className="info-item">
                        <User className="icon-small icon-gray" />
                        <div>
                          <p className="info-label">Last Name</p>
                          <p className="info-value">
                            {profileData.profile.lastName || "Not set"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="info-item">
                      <Mail className="icon-small icon-gray" />
                      <div>
                        <p className="info-label">Email Address</p>
                        <p className="info-value">{profileData.email}</p>
                      </div>
                    </div>
                    <div className="info-item">
                      <Phone className="icon-small icon-gray" />
                      <div>
                        <p className="info-label">Phone Number</p>
                        <p className="info-value">
                          {profileData.phoneNumber || "Not set"}
                        </p>
                      </div>
                    </div>
                    <div className="info-item">
                      <MapPin className="icon-small icon-gray" />
                      <div>
                        <p className="info-label">Address</p>
                        <p className="info-value">
                          {profileData.profile.address || "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Security Settings Card */}
              <div className="account-card">
                <div className="card-header-custom">
                  <h3 className="card-title-custom">Security Settings</h3>
                  {!showPasswordChange && (
                    <button
                      onClick={() => setShowPasswordChange(true)}
                      className="btn btn-outline-secondary btn-sm"
                    >
                      Change Password
                    </button>
                  )}
                </div>

                {showPasswordChange ? (
                  <form onSubmit={handlePasswordChange}>
                    <div className="mb-3">
                      <label className="form-label">Current Password</label>
                      <div className="input-group-custom">
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          className={`form-control form-input-custom ${
                            formErrors.password.currentPassword
                              ? "is-invalid"
                              : ""
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("current")}
                          className="input-icon-btn btn"
                        >
                          {showPasswords.current ? (
                            <EyeOff className="icon-small" />
                          ) : (
                            <Eye className="icon-small" />
                          )}
                        </button>
                      </div>
                      {formErrors.password.currentPassword && (
                        <div className="invalid-feedback d-block">
                          {formErrors.password.currentPassword}
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">New Password</label>
                      <div className="input-group-custom">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          className={`form-control form-input-custom ${
                            formErrors.password.newPassword ? "is-invalid" : ""
                          }`}
                          required
                          minLength="6"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("new")}
                          className="input-icon-btn btn"
                        >
                          {showPasswords.new ? (
                            <EyeOff className="icon-small" />
                          ) : (
                            <Eye className="icon-small" />
                          )}
                        </button>
                      </div>
                      {formErrors.password.newPassword && (
                        <div className="invalid-feedback d-block">
                          {formErrors.password.newPassword}
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <label className="form-label">Confirm New Password</label>
                      <div className="input-group-custom">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          className={`form-control form-input-custom ${
                            formErrors.password.confirmPassword
                              ? "is-invalid"
                              : ""
                          }`}
                          required
                          minLength="6"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("confirm")}
                          className="input-icon-btn btn"
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="icon-small" />
                          ) : (
                            <Eye className="icon-small" />
                          )}
                        </button>
                      </div>
                      {formErrors.password.confirmPassword && (
                        <div className="invalid-feedback d-block">
                          {formErrors.password.confirmPassword}
                        </div>
                      )}
                    </div>

                    <div className="d-flex gap-2 flex-wrap">
                      <button
                        type="submit"
                        disabled={loadingStates.password}
                        className="btn btn-safelink d-flex align-items-center gap-2"
                      >
                        <Save className="icon-small" />
                        <span>
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
                            "Update Password"
                          )}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordChange(false);
                          setPasswordData({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          });
                          setFormErrors((prev) => ({ ...prev, password: {} }));
                        }}
                        className="btn btn-secondary d-flex align-items-center gap-2"
                      >
                        <X className="icon-small" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="info-item">
                    <Shield className="icon-small icon-green" />
                    <div>
                      <p className="info-value">Password</p>
                      <p className="info-label">
                        Your password is secure and encrypted
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              {/* Account Information Card */}
              <div className="account-card">
                <h3 className="card-title-custom">Account Information</h3>
                <div>
                  <div className="info-label-group">
                    <Calendar className="icon-small" />
                    <span className="info-label">Account Created</span>
                  </div>
                  <p className="info-value">
                    {formatDate(user.metadata?.creationTime)}
                  </p>
                </div>
                <div className="mt-3">
                  <div className="info-label-group">
                    <Clock className="icon-small" />
                    <span className="info-label">Last Sign In</span>
                  </div>
                  <p className="info-value">
                    {formatDate(user.metadata?.lastSignInTime)}
                  </p>
                </div>
                <div className="mt-3">
                  <div className="info-label-group">
                    <Shield className="icon-small" />
                    <span className="info-label">Account Status</span>
                  </div>
                  <span className="status-badge">Active</span>
                </div>
              </div>

              {/* Danger Zone Card */}
              <div className="account-card danger-zone">
                <h3 className="card-title-custom danger-title">
                  <AlertTriangle className="icon-small" />
                  <span>Danger Zone</span>
                </h3>
                <p className="danger-text">
                  Once you delete your account, there is no going back. Please
                  be certain.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn-danger-custom btn"
                >
                  <Trash2 className="icon-small" />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="modal-overlay-custom">
              <div className="modal-custom">
                <div className="modal-icon-custom">
                  <AlertTriangle className="icon-large text-danger" />
                </div>
                <h3 className="modal-title-custom">Delete Account</h3>
                <p className="modal-text-custom">
                  This action cannot be undone. This will permanently delete
                  your SafeLink account and all associated data.
                </p>

                <form onSubmit={handleDeleteAccount}>
                  <div className="mb-3">
                    <label className="form-label">
                      Enter your password to confirm
                    </label>
                    <input
                      type="password"
                      value={deleteConfirmation.password}
                      onChange={(e) =>
                        setDeleteConfirmation({
                          ...deleteConfirmation,
                          password: e.target.value,
                        })
                      }
                      className={`form-control form-input-custom ${
                        formErrors.delete.password ? "is-invalid" : ""
                      }`}
                      required
                    />
                    {formErrors.delete.password && (
                      <div className="invalid-feedback d-block">
                        {formErrors.delete.password}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Type "DELETE" to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmation.confirmText}
                      onChange={(e) =>
                        setDeleteConfirmation({
                          ...deleteConfirmation,
                          confirmText: e.target.value,
                        })
                      }
                      className={`form-control form-input-custom ${
                        formErrors.delete.confirmText ? "is-invalid" : ""
                      }`}
                      placeholder="DELETE"
                      required
                    />
                    {formErrors.delete.confirmText && (
                      <div className="invalid-feedback d-block">
                        {formErrors.delete.confirmText}
                      </div>
                    )}
                  </div>

                  {deleteError && (
                    <div className="alert alert-danger" role="alert">
                      {deleteError}
                    </div>
                  )}

                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      type="submit"
                      disabled={loadingStates.delete}
                      className="btn-danger-custom btn flex-grow-1"
                    >
                      {loadingStates.delete ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Deleting...
                        </>
                      ) : (
                        "Delete Account"
                      )}
                    </button>
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
                      className="btn btn-secondary flex-grow-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default Account;
