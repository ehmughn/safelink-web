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
import "../styles/Account.css";

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
        addNotification("Password is incorrect", "error");
      } else {
        addNotification("Failed to delete account", "error");
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
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <p className="loading-text">Loading account information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header profileData={profileData} />

      <main className="main-content">
        <div className="notification-container">
          {notifications.map((notification) => (
            <div key={notification.id} className={`alert ${notification.type}`}>
              <div className="alert-content">
                {notification.type === "success" ? (
                  <CheckCircle className="icon-small alert-icon" />
                ) : (
                  <AlertTriangle className="icon-small alert-icon" />
                )}
                <p className="alert-text">{notification.message}</p>
                <button
                  className="close-notification"
                  onClick={() =>
                    setNotifications((prev) =>
                      prev.filter((n) => n.id !== notification.id)
                    )
                  }
                >
                  <X className="icon-small" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="page-title">
          <h2 className="title">My Account</h2>
          <p className="subtitle">
            Manage your SafeLink account information and settings
          </p>
        </div>

        <div className="content-grid">
          <div className="profile-section">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <User className="icon-medium icon-blue" />
                  <span>Profile Information</span>
                </h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="edit-button"
                  >
                    <Edit3 className="icon-small" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleProfileUpdate} className="form">
                  <div className="form-grid">
                    <div>
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
                        className={`form-input ${
                          formErrors.profile.firstName ? "input-error" : ""
                        }`}
                        placeholder="Enter your first name"
                      />
                      {formErrors.profile.firstName && (
                        <p className="error-text">
                          {formErrors.profile.firstName}
                        </p>
                      )}
                    </div>
                    <div>
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
                        className={`form-input ${
                          formErrors.profile.lastName ? "input-error" : ""
                        }`}
                        placeholder="Enter your last name"
                      />
                      {formErrors.profile.lastName && (
                        <p className="error-text">
                          {formErrors.profile.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="form-input disabled"
                      placeholder="Email cannot be changed"
                    />
                  </div>
                  <div>
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
                      className={`form-input ${
                        formErrors.profile.phoneNumber ? "input-error" : ""
                      }`}
                      placeholder="Enter your phone number"
                    />
                    {formErrors.profile.phoneNumber && (
                      <p className="error-text">
                        {formErrors.profile.phoneNumber}
                      </p>
                    )}
                  </div>
                  <div>
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
                      className="form-input"
                      placeholder="Enter your address"
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      type="submit"
                      disabled={loadingStates.profile}
                      className="button save-button"
                    >
                      <Save className="icon-small" />
                      <span>
                        {loadingStates.profile ? "Saving..." : "Save Changes"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormErrors((prev) => ({ ...prev, profile: {} }));
                      }}
                      className="button cancel-button"
                    >
                      <X className="icon-small" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="info-list">
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

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Security Settings</h3>
                {!showPasswordChange && (
                  <button
                    onClick={() => setShowPasswordChange(true)}
                    className="action-button"
                  >
                    Change Password
                  </button>
                )}
              </div>

              {showPasswordChange ? (
                <form onSubmit={handlePasswordChange} className="form">
                  <div>
                    <label className="form-label">Current Password</label>
                    <div className="input-group">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          })
                        }
                        className={`form-input ${
                          formErrors.password.currentPassword
                            ? "input-error"
                            : ""
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("current")}
                        className="input-icon"
                      >
                        {showPasswords.current ? (
                          <EyeOff className="icon-small" />
                        ) : (
                          <Eye className="icon-small" />
                        )}
                      </button>
                    </div>
                    {formErrors.password.currentPassword && (
                      <p className="error-text">
                        {formErrors.password.currentPassword}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="form-label">New Password</label>
                    <div className="input-group">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        className={`form-input ${
                          formErrors.password.newPassword ? "input-error" : ""
                        }`}
                        required
                        minLength="6"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("new")}
                        className="input-icon"
                      >
                        {showPasswords.new ? (
                          <EyeOff className="icon-small" />
                        ) : (
                          <Eye className="icon-small" />
                        )}
                      </button>
                    </div>
                    {formErrors.password.newPassword && (
                      <p className="error-text">
                        {formErrors.password.newPassword}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="form-label">Confirm New Password</label>
                    <div className="input-group">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className={`form-input ${
                          formErrors.password.confirmPassword
                            ? "input-error"
                            : ""
                        }`}
                        required
                        minLength="6"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("confirm")}
                        className="input-icon"
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="icon-small" />
                        ) : (
                          <Eye className="icon-small" />
                        )}
                      </button>
                    </div>
                    {formErrors.password.confirmPassword && (
                      <p className="error-text">
                        {formErrors.password.confirmPassword}
                      </p>
                    )}
                  </div>
                  <div className="form-actions">
                    <button
                      type="submit"
                      disabled={loadingStates.password}
                      className="button save-button"
                    >
                      <Save className="icon-small" />
                      <span>
                        {loadingStates.password
                          ? "Updating..."
                          : "Update Password"}
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
                      className="button cancel-button"
                    >
                      <X className="icon-small" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="info-list">
                  <div className="info-item">
                    <Shield className="icon-small icon-green" />
                    <div>
                      <p className="info-value">Password</p>
                      <p className="info-label">
                        Your password is secure and encrypted
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="sidebar">
            <div className="card">
              <h3 className="card-title">Account Information</h3>
              <div className="info-list">
                <div>
                  <div className="info-label-group">
                    <Calendar className="icon-small" />
                    <span className="info-label">Account Created</span>
                  </div>
                  <p className="info-value">
                    {formatDate(user.metadata?.creationTime)}
                  </p>
                </div>
                <div>
                  <div className="info-label-group">
                    <Clock className="icon-small" />
                    <span className="info-label">Last Sign In</span>
                  </div>
                  <p className="info-value">
                    {formatDate(user.metadata?.lastSignInTime)}
                  </p>
                </div>
                <div>
                  <div className="info-label-group">
                    <Shield className="icon-small" />
                    <span className="info-label">Account Status</span>
                  </div>
                  <span className="status-badge">Active</span>
                </div>
              </div>
            </div>

            <div className="card danger-zone">
              <h3 className="card-title danger">
                <AlertTriangle className="icon-small" />
                <span>Danger Zone</span>
              </h3>
              <p className="danger-text">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="button delete-button"
              >
                <Trash2 className="icon-small" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-content">
                <div className="modal-icon">
                  <AlertTriangle className="icon-large alert-icon" />
                </div>
                <h3 className="modal-title">Delete Account</h3>
                <p className="modal-text">
                  This action cannot be undone. This will permanently delete
                  your SafeLink account and all associated data.
                </p>
              </div>
              <form onSubmit={handleDeleteAccount} className="form">
                <div>
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
                    className={`form-input ${
                      formErrors.delete.password ? "input-error" : ""
                    }`}
                    required
                  />
                  {formErrors.delete.password && (
                    <p className="error-text">{formErrors.delete.password}</p>
                  )}
                </div>
                <div>
                  <label className="form-label">Type "DELETE" to confirm</label>
                  <input
                    type="text"
                    value={deleteConfirmation.confirmText}
                    onChange={(e) =>
                      setDeleteConfirmation({
                        ...deleteConfirmation,
                        confirmText: e.target.value,
                      })
                    }
                    className={`form-input ${
                      formErrors.delete.confirmText ? "input-error" : ""
                    }`}
                    placeholder="DELETE"
                    required
                  />
                  {formErrors.delete.confirmText && (
                    <p className="error-text">
                      {formErrors.delete.confirmText}
                    </p>
                  )}
                </div>
                <div className="form-actions">
                  <button
                    type="submit"
                    disabled={loadingStates.delete}
                    className="button delete-button"
                  >
                    {loadingStates.delete ? "Deleting..." : "Delete Account"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmation({ password: "", confirmText: "" });
                      setFormErrors((prev) => ({ ...prev, delete: {} }));
                    }}
                    className="button cancel-button"
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
  );
};

export default Account;
