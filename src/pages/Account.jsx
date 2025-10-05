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
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div
            className="spinner-border text-danger mb-3"
            style={{ width: "3rem", height: "3rem" }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading account information...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          .hover-lift {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .hover-lift:hover {
            transform: translateY(-4px);
            box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.15) !important;
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
          .form-control:focus {
            border-color: #FF5A1F;
            box-shadow: 0 0 0 0.25rem rgba(255, 90, 31, 0.25);
          }
          .btn-safelink {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            border: none;
            color: white;
            transition: all 0.3s ease;
          }
          .btn-safelink:hover:not(:disabled) {
            background: linear-gradient(135deg, #E63946 0%, #c82333 100%);
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 0.25rem 0.75rem rgba(255, 90, 31, 0.3);
          }
          .btn-safelink:disabled {
            opacity: 0.6;
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
          }
          .info-item-hover {
            transition: all 0.2s ease;
          }
          .info-item-hover:hover {
            background-color: rgba(255, 90, 31, 0.05);
            transform: translateX(4px);
          }
          .modal-backdrop-custom {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: 1050;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }
          .modal-content-custom {
            background: white;
            border-radius: 12px;
            max-width: 500px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            animation: modalSlideIn 0.3s ease;
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
        `}
      </style>

      <div className="min-vh-100 bg-light">
        <Header profileData={profileData} />

        {/* Toast Notifications */}
        <div
          className="position-fixed top-0 end-0 p-3"
          style={{ zIndex: 1060, marginTop: "80px" }}
        >
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`toast show mb-2 ${
                notification.type === "error" ? "bg-danger" : "bg-success"
              } text-white`}
              role="alert"
            >
              <div className="toast-body d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  {notification.type === "success" ? (
                    <CheckCircle size={18} />
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

        {/* Main Content */}
        <div className="container py-4 px-3 px-md-4">
          {/* Page Header */}
          <div className="text-center mb-5">
            <h1 className="display-5 fw-bold mb-2">My Account</h1>
            <p className="text-muted">
              Manage your SafeLink account information and settings
            </p>
          </div>

          <div className="row g-4">
            {/* Main Content Column */}
            <div className="col-lg-8">
              {/* Profile Information Card */}
              <div className="card border-0 shadow-sm mb-4 hover-lift">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="h5 mb-0 d-flex align-items-center gap-2">
                      <User size={20} className="text-primary" />
                      <span className="fw-bold">Profile Information</span>
                    </h2>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
                      >
                        <Edit3 size={16} />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleProfileUpdate}>
                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            First Name
                          </label>
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
                            className={`form-control ${
                              formErrors.profile.firstName ? "is-invalid" : ""
                            }`}
                            placeholder="Enter your first name"
                          />
                          {formErrors.profile.firstName && (
                            <div className="invalid-feedback">
                              {formErrors.profile.firstName}
                            </div>
                          )}
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            Last Name
                          </label>
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
                            className={`form-control ${
                              formErrors.profile.lastName ? "is-invalid" : ""
                            }`}
                            placeholder="Enter your last name"
                          />
                          {formErrors.profile.lastName && (
                            <div className="invalid-feedback">
                              {formErrors.profile.lastName}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={profileData.email}
                          disabled
                          className="form-control"
                          placeholder="Email cannot be changed"
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          Phone Number
                        </label>
                        <input
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
                        />
                        {formErrors.profile.phoneNumber && (
                          <div className="invalid-feedback">
                            {formErrors.profile.phoneNumber}
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <label className="form-label fw-semibold">
                          Address
                        </label>
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
                          className="form-control"
                          placeholder="Enter your address"
                        />
                      </div>

                      <div className="d-flex gap-2 flex-wrap">
                        <button
                          type="submit"
                          disabled={loadingStates.profile}
                          className="btn btn-safelink d-flex align-items-center gap-2"
                        >
                          {loadingStates.profile ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save size={16} />
                              <span>Save Changes</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setFormErrors((prev) => ({ ...prev, profile: {} }));
                          }}
                          className="btn btn-secondary d-flex align-items-center gap-2"
                        >
                          <X size={16} />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className="p-3 rounded bg-light info-item-hover">
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <User size={16} className="text-muted" />
                              <small className="text-muted fw-semibold">
                                First Name
                              </small>
                            </div>
                            <p className="mb-0 fw-bold">
                              {profileData.profile.firstName || "Not set"}
                            </p>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="p-3 rounded bg-light info-item-hover">
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <User size={16} className="text-muted" />
                              <small className="text-muted fw-semibold">
                                Last Name
                              </small>
                            </div>
                            <p className="mb-0 fw-bold">
                              {profileData.profile.lastName || "Not set"}
                            </p>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="p-3 rounded bg-light info-item-hover">
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <Mail size={16} className="text-muted" />
                              <small className="text-muted fw-semibold">
                                Email Address
                              </small>
                            </div>
                            <p className="mb-0 fw-bold">{profileData.email}</p>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="p-3 rounded bg-light info-item-hover">
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <Phone size={16} className="text-muted" />
                              <small className="text-muted fw-semibold">
                                Phone Number
                              </small>
                            </div>
                            <p className="mb-0 fw-bold">
                              {profileData.phoneNumber || "Not set"}
                            </p>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="p-3 rounded bg-light info-item-hover">
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <MapPin size={16} className="text-muted" />
                              <small className="text-muted fw-semibold">
                                Address
                              </small>
                            </div>
                            <p className="mb-0 fw-bold">
                              {profileData.profile.address || "Not set"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Settings Card */}
              <div className="card border-0 shadow-sm hover-lift">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="h5 mb-0 d-flex align-items-center gap-2">
                      <Shield size={20} className="text-success" />
                      <span className="fw-bold">Security Settings</span>
                    </h2>
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
                        <label className="form-label fw-semibold">
                          Current Password
                        </label>
                        <div className="position-relative">
                          <input
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
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility("current")}
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
                          <div className="text-danger small mt-1">
                            {formErrors.password.currentPassword}
                          </div>
                        )}
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          New Password
                        </label>
                        <div className="position-relative">
                          <input
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
                          <div className="text-danger small mt-1">
                            {formErrors.password.newPassword}
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <label className="form-label fw-semibold">
                          Confirm New Password
                        </label>
                        <div className="position-relative">
                          <input
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
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility("confirm")}
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
                          <div className="text-danger small mt-1">
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
                          {loadingStates.password ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              <span>Updating...</span>
                            </>
                          ) : (
                            <>
                              <Save size={16} />
                              <span>Update Password</span>
                            </>
                          )}
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
                            setFormErrors((prev) => ({
                              ...prev,
                              password: {},
                            }));
                          }}
                          className="btn btn-secondary d-flex align-items-center gap-2"
                        >
                          <X size={16} />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-3 rounded bg-light info-item-hover">
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
              <div className="card border-0 shadow-sm mb-4 hover-lift">
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
              <div className="card border-0 shadow-sm hover-lift danger-zone-card">
                <div className="card-body p-4">
                  <h2 className="h5 fw-bold mb-3 text-danger d-flex align-items-center gap-2">
                    <AlertTriangle size={20} />
                    <span>Danger Zone</span>
                  </h2>
                  <div className="alert alert-danger mb-3" role="alert">
                    <small>
                      Once you delete your account, there is no going back.
                      Please be certain.
                    </small>
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
                  <div className="d-flex justify-content-center mb-3">
                    <div className="bg-danger bg-opacity-10 rounded-circle p-3 d-inline-flex">
                      <AlertTriangle size={32} className="text-danger" />
                    </div>
                  </div>
                  <h3 className="h5 fw-bold mb-2">Delete Account</h3>
                  <p className="text-muted mb-0">
                    This action cannot be undone. This will permanently delete
                    your SafeLink account and all associated data.
                  </p>
                </div>
              </div>

              <div className="modal-body p-4">
                <form onSubmit={handleDeleteAccount}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
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
                      className={`form-control ${
                        formErrors.delete.password ? "is-invalid" : ""
                      }`}
                      required
                      placeholder="Enter your password"
                    />
                    {formErrors.delete.password && (
                      <div className="invalid-feedback">
                        {formErrors.delete.password}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
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
                      className={`form-control ${
                        formErrors.delete.confirmText ? "is-invalid" : ""
                      }`}
                      placeholder="DELETE"
                      required
                    />
                    {formErrors.delete.confirmText && (
                      <div className="invalid-feedback">
                        {formErrors.delete.confirmText}
                      </div>
                    )}
                  </div>

                  {deleteError && (
                    <div className="alert alert-danger mb-3" role="alert">
                      <small>{deleteError}</small>
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      disabled={loadingStates.delete}
                      className="btn btn-danger flex-fill d-flex align-items-center justify-content-center gap-2"
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
                      className="btn btn-secondary flex-fill"
                      disabled={loadingStates.delete}
                    >
                      Cancel
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
