import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider, db } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
} from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import "../styles/CreateAccount.css";
import BrandLogo from "../components/BrandLogo";
import AlertIcon from "../assets/alert-icon.png";
import { Eye, EyeOff } from "lucide-react";

const CreateAccount = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [role, setRole] = useState("family_member");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePhoneNumber = (phone) => /^\+?[\d\s-]{10,}$/.test(phone);

  const validateForm = () => {
    const errors = {};
    if (!firstName) errors.firstName = "First name is required.";
    if (!lastName) errors.lastName = "Last name is required.";
    if (!email) errors.email = "Email is required.";
    else if (!validateEmail(email))
      errors.email = "Please enter a valid email address.";
    if (!phoneNumber) errors.phoneNumber = "Phone number is required.";
    else if (!validatePhoneNumber(phoneNumber))
      errors.phoneNumber = "Please enter a valid phone number.";
    if (!address) errors.address = "Address is required.";
    if (!birthdate) errors.birthdate = "Birthdate is required.";
    if (!password) errors.password = "Password is required.";
    else if (password.length < 6)
      errors.password = "Password must be at least 6 characters.";
    if (!confirmPassword)
      errors.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword)
      errors.confirmPassword = "Passwords do not match.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value, setter) => {
    setter(value);
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    setError("");
    setSuccessMessage("");
  };

  const createAccount = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    if (!validateForm()) {
      setError("Please correct the errors in the form.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Send email verification
      await sendEmailVerification(result.user, {
        url: window.location.origin + "/verify-email",
        handleCodeInApp: true,
      });

      const authInfo = {
        userId: result.user.uid,
        email: email,
        phoneNumber: phoneNumber,
        createdAt: new Date().toLocaleString("en-US", {
          timeZone: "Asia/Manila",
        }),
        profile: {
          address: address,
          birthdate: birthdate,
          firstName: firstName,
          lastName: lastName,
          role: role,
        },
        profilePhoto: "",
        isAuth: false, // Set to false until email is verified
        emailVerified: false,
      };
      localStorage.setItem("auth", JSON.stringify(authInfo));
      await setDoc(doc(db, "users", result.user.uid), authInfo);

      setSuccessMessage(
        "A verification email has been sent to your email address. Please verify your email to continue."
      );
      setAccountCreated(true);
      setIsLoading(false);
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak.");
      } else {
        setError("Failed to create account. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const createAccountWithGoogle = async () => {
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      let firstName = "";
      let lastName = "";
      if (user.displayName) {
        const nameParts = user.displayName.split(" ");
        firstName = nameParts[0] || "";
        lastName = nameParts.slice(1).join(" ") || "";
      }
      const authInfo = {
        userId: user.uid,
        email: user.email,
        phoneNumber: user.phoneNumber || "",
        createdAt:
          user.metadata?.creationTime ||
          new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }),
        profile: {
          address: "",
          birthdate: "",
          firstName: firstName,
          lastName: lastName,
          role: "family_member",
        },
        profilePhoto: user.photoURL || "",
        isAuth: user.emailVerified, // Set based on email verification status
        emailVerified: user.emailVerified,
      };
      localStorage.setItem("auth", JSON.stringify(authInfo));

      try {
        const { doc, getDoc, setDoc } = await import("firebase/firestore");
        const { db } = await import("../config/firebase");
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, authInfo);
        }
      } catch (firestoreError) {
        console.error("Firestore error:", firestoreError);
      }

      if (user.emailVerified) {
        setSuccessMessage("Account created successfully!");
      } else {
        setSuccessMessage(
          "A verification email has been sent to your email address. Please verify your email to continue."
        );
      }
      setAccountCreated(true);
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user") {
        setError("Google sign-up was cancelled.");
      } else if (error.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else {
        setError("Failed to sign up with Google. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const logIn = () => {
    navigate("/login");
  };

  const goBack = () => {
    navigate("/");
  };

  const handleKeyDown = (e, action) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="create-root">
      <a href="#main-content" className="create-skip-link">
        Skip to content
      </a>
      <header className="create-header">
        <BrandLogo safe="#1A1A1A" link="#E63946" />
        <p className="create-tagline">Your Family Safety Dashboard</p>
      </header>
      <main id="main-content" className="create-div">
        <button
          className="create-back-btn"
          onClick={goBack}
          aria-label="Back to Home"
          disabled={isLoading}
        >
          ←
        </button>
        <h1 className="create-title">Create Account</h1>
        <p className="create-desc">Join SafeLink to protect your family</p>
        {successMessage && (
          <div className="create-success" role="alert">
            <span className="create-success-icon">✔</span>
            {successMessage}
          </div>
        )}
        {!accountCreated && (
          <>
            <form className="create-form" onSubmit={createAccount}>
              <div className="create-form-grid">
                <div className="create-input-div">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Enter your first name"
                    value={firstName}
                    onChange={(e) =>
                      handleInputChange(
                        "firstName",
                        e.target.value,
                        setFirstName
                      )
                    }
                    onFocus={() => {
                      setError("");
                      setSuccessMessage("");
                    }}
                    aria-required="true"
                    aria-invalid={!!fieldErrors.firstName}
                    aria-describedby={
                      fieldErrors.firstName ? "firstName-error" : undefined
                    }
                  />
                  {fieldErrors.firstName && (
                    <span
                      id="firstName-error"
                      className="create-input-error"
                      role="alert"
                    >
                      {fieldErrors.firstName}
                    </span>
                  )}
                </div>
                <div className="create-input-div">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    value={lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value, setLastName)
                    }
                    onFocus={() => {
                      setError("");
                      setSuccessMessage("");
                    }}
                    aria-required="true"
                    aria-invalid={!!fieldErrors.lastName}
                    aria-describedby={
                      fieldErrors.lastName ? "lastName-error" : undefined
                    }
                  />
                  {fieldErrors.lastName && (
                    <span
                      id="lastName-error"
                      className="create-input-error"
                      role="alert"
                    >
                      {fieldErrors.lastName}
                    </span>
                  )}
                </div>
                <div className="create-input-div">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) =>
                      handleInputChange("email", e.target.value, setEmail)
                    }
                    onFocus={() => {
                      setError("");
                      setSuccessMessage("");
                    }}
                    aria-required="true"
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={
                      fieldErrors.email ? "email-error" : undefined
                    }
                  />
                  {fieldErrors.email && (
                    <span
                      id="email-error"
                      className="create-input-error"
                      role="alert"
                    >
                      {fieldErrors.email}
                    </span>
                  )}
                </div>
                <div className="create-input-div">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) =>
                      handleInputChange(
                        "phoneNumber",
                        e.target.value,
                        setPhoneNumber
                      )
                    }
                    onFocus={() => {
                      setError("");
                      setSuccessMessage("");
                    }}
                    aria-required="true"
                    aria-invalid={!!fieldErrors.phoneNumber}
                    aria-describedby={
                      fieldErrors.phoneNumber ? "phoneNumber-error" : undefined
                    }
                  />
                  {fieldErrors.phoneNumber && (
                    <span
                      id="phoneNumber-error"
                      className="create-input-error"
                      role="alert"
                    >
                      {fieldErrors.phoneNumber}
                    </span>
                  )}
                </div>
                <div className="create-input-div">
                  <label htmlFor="address">Address</label>
                  <input
                    id="address"
                    type="text"
                    placeholder="Enter your address"
                    value={address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value, setAddress)
                    }
                    onFocus={() => {
                      setError("");
                      setSuccessMessage("");
                    }}
                    aria-required="true"
                    aria-invalid={!!fieldErrors.address}
                    aria-describedby={
                      fieldErrors.address ? "address-error" : undefined
                    }
                  />
                  {fieldErrors.address && (
                    <span
                      id="address-error"
                      className="create-input-error"
                      role="alert"
                    >
                      {fieldErrors.address}
                    </span>
                  )}
                </div>
                <div className="create-input-div">
                  <label htmlFor="birthdate">Birthdate</label>
                  <input
                    id="birthdate"
                    type="date"
                    placeholder="Enter your birthdate"
                    value={birthdate}
                    onChange={(e) =>
                      handleInputChange(
                        "birthdate",
                        e.target.value,
                        setBirthdate
                      )
                    }
                    onFocus={() => {
                      setError("");
                      setSuccessMessage("");
                    }}
                    aria-required="true"
                    aria-invalid={!!fieldErrors.birthdate}
                    aria-describedby={
                      fieldErrors.birthdate ? "birthdate-error" : undefined
                    }
                  />
                  {fieldErrors.birthdate && (
                    <span
                      id="birthdate-error"
                      className="create-input-error"
                      role="alert"
                    >
                      {fieldErrors.birthdate}
                    </span>
                  )}
                </div>
                <div className="create-input-div">
                  <label htmlFor="password">Password</label>
                  <div className="create-password-wrapper">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) =>
                        handleInputChange(
                          "password",
                          e.target.value,
                          setPassword
                        )
                      }
                      onFocus={() => {
                        setError("");
                        setSuccessMessage("");
                      }}
                      aria-required="true"
                      aria-invalid={!!fieldErrors.password}
                      aria-describedby={
                        fieldErrors.password ? "password-error" : undefined
                      }
                    />
                    <button
                      type="button"
                      className="create-toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <span
                      id="password-error"
                      className="create-input-error"
                      role="alert"
                    >
                      {fieldErrors.password}
                    </span>
                  )}
                </div>
                <div className="create-input-div">
                  <label htmlFor="confirm-password">Confirm Password</label>
                  <div className="create-password-wrapper">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) =>
                        handleInputChange(
                          "confirmPassword",
                          e.target.value,
                          setConfirmPassword
                        )
                      }
                      onFocus={() => {
                        setError("");
                        setSuccessMessage("");
                      }}
                      aria-required="true"
                      aria-invalid={!!fieldErrors.confirmPassword}
                      aria-describedby={
                        fieldErrors.confirmPassword
                          ? "confirm-password-error"
                          : undefined
                      }
                    />
                    <button
                      type="button"
                      className="create-toggle-password"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <span
                      id="confirm-password-error"
                      className="create-input-error"
                      role="alert"
                    >
                      {fieldErrors.confirmPassword}
                    </span>
                  )}
                </div>
                <div className="create-input-div create-role-div">
                  <label htmlFor="role">Role</label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) =>
                      handleInputChange("role", e.target.value, setRole)
                    }
                    onFocus={() => {
                      setError("");
                      setSuccessMessage("");
                    }}
                    aria-required="true"
                  >
                    <option value="family_member">Family Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              {error && (
                <div className="create-error" role="alert">
                  <img
                    src={AlertIcon}
                    alt="Error icon"
                    className="create-error-icon"
                    width="16"
                    height="16"
                  />
                  {error}
                </div>
              )}
              <button
                className="create-btn"
                type="submit"
                aria-label="Create Account"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
            <div className="create-divider">
              <span>or Sign up with</span>
            </div>
            <button
              className="create-google-btn"
              onClick={createAccountWithGoogle}
              aria-label="Sign up with Google"
              disabled={isLoading}
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google logo"
                className="create-google-icon"
                width="24"
                height="24"
              />
              {isLoading ? "Loading..." : "Google Account"}
            </button>
          </>
        )}
        <div className="create-bottom">
          Already have an account?{" "}
          <span
            className="create-login-link"
            onClick={logIn}
            onKeyDown={(e) => handleKeyDown(e, logIn)}
            role="button"
            tabIndex={0}
            aria-label="Sign In"
          >
            Sign In
          </span>
        </div>
      </main>
      <footer className="create-footer">
        <a href="/help">Need Help?</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
      </footer>
    </div>
  );
};

export default CreateAccount;
