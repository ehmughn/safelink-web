import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider, db } from "../config/firebase";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import "../styles/CreateAccount.css";
import BrandLogo from "../components/BrandLogo";
import AlertIcon from "../assets/alert-icon.png";

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
  const navigate = useNavigate();

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const createAccount = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !phoneNumber ||
      !address ||
      !birthdate
    ) {
      setError("Please fill in all fields.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const authInfo = {
        userId: result.user.uid,
        email: email,
        passwordHash: password,
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
        isAuth: true,
      };
      localStorage.setItem("auth", JSON.stringify(authInfo));
      await setDoc(doc(db, "users", result.user.uid), authInfo);
      navigate("/");
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
    } finally {
    }
  };

  const createAccountWithGoogle = async () => {
    setError("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log(result.user);

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
        accessToken: user.stsTokenManager?.accessToken || "",
        providerId: user.providerId || "google",
        profile: {
          address: "",
          birthdate: "",
          firstName: firstName,
          lastName: lastName,
          role: "family_member",
        },
        profilePhoto: user.photoURL || "",
        isAuth: true,
      };
      localStorage.setItem("auth", JSON.stringify(authInfo));
      await setDoc(doc(db, "users", result.user.uid), authInfo);
      navigate("/");
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user") {
        setError("Google sign up was cancelled.");
      } else if (error.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else {
        setError("Failed to sign up with Google. Please try again.");
      }
    }
  };

  const logIn = () => {
    navigate("../login");
  };

  const goBack = () => {
    navigate("../");
  };

  return (
    <div className="create-root">
      <header className="create-header">
        <BrandLogo safe="#1A1A1A" link="#FF5A1F" />
        <p className="create-tagline">Your Family Safety Dashboard</p>
      </header>
      <div className="create-div">
        <button
          className="create-back-btn"
          onClick={goBack}
          aria-label="Back to Home"
        >
          ←
        </button>
        <p className="create-title">Create Account</p>
        <p className="create-desc">Join SafeLink to protect your family</p>
        <form className="create-form" onSubmit={createAccount}>
          <div className="create-input-div">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              type="text"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onFocus={() => setError("")}
              aria-required="true"
            />
          </div>
          <div className="create-input-div">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              type="text"
              placeholder="Enter your last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onFocus={() => setError("")}
              aria-required="true"
            />
          </div>
          <div className="create-input-div">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setError("")}
              aria-required="true"
            />
          </div>
          <div className="create-input-div">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              id="phoneNumber"
              type="text"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onFocus={() => setError("")}
              aria-required="true"
            />
          </div>
          <div className="create-input-div">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              type="text"
              placeholder="Enter your address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onFocus={() => setError("")}
              aria-required="true"
            />
          </div>
          <div className="create-input-div">
            <label htmlFor="birthdate">Birthdate</label>
            <input
              id="birthdate"
              type="date"
              placeholder="Enter your birthdate"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              onFocus={() => setError("")}
              aria-required="true"
            />
          </div>
          <div className="create-input-div">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setError("")}
              aria-required="true"
            />
          </div>
          <div className="create-input-div">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setError("")}
              aria-required="true"
            />
          </div>
          <div className="create-input-div">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onFocus={() => setError("")}
            >
              <option value="family_member">Family Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && (
            <div className="create-error" role="alert">
              <img src={AlertIcon} alt="" className="create-error-icon" />
              {error}
            </div>
          )}
          <button
            className="create-btn"
            type="submit"
            aria-label="Create Account"
          >
            Create Account
          </button>
        </form>
        <div className="create-divider">
          <span>or Sign up with</span>
        </div>
        <button
          className="create-google-btn"
          onClick={createAccountWithGoogle}
          aria-label="Sign up with Google"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt=""
            className="create-google-icon"
          />
          Google Account
        </button>
        <div className="create-bottom">
          Already have an account?{" "}
          <span
            className="create-login-link"
            onClick={logIn}
            role="button"
            tabIndex="0"
            onKeyPress={(e) => e.key === "Enter" && logIn()}
          >
            Sign In
          </span>
        </div>
      </div>
      <footer className="create-footer">
        <a href="#">Need Help?</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
      </footer>
    </div>
  );
};

export default CreateAccount;
