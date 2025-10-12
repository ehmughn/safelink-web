import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import Family from "./pages/Family";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyEmail from "./pages/VerifyEmail";
import CompleteProfile from "./pages/CompleteProfile";
import Account from "./pages/Account";
import Alerts from "./pages/Alerts";
import BarangayMembers from "./pages/BarangayMembers";
import BroadcastDisaster from "./pages/BroadcastDisaster";
import AdminDashboard from "./pages/AdminDashboard";
import { auth } from "./config/firebase";
import "./styles/Account.css"; // Import Account.css for loading styles

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // New loading state

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      // if (firebaseUser && firebaseUser.emailVerified) {
      //   setUser(firebaseUser);
      // } else {
      //   setUser(null);
      // }
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <p className="loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={user ? <Home /> : <LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/home" element={<Navigate to="/" />} />
        <Route
          path="/create-account"
          element={user ? <Navigate to="/" /> : <CreateAccount />}
        />
        <Route
          path="/verify-email"
          element={user ? <Navigate to="/" /> : <VerifyEmail />}
        />
        <Route path="/family" element={<Family />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/account" element={<Account />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/barangay-members" element={<BarangayMembers />} />
        <Route path="/broadcast-disaster" element={<BroadcastDisaster />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </>
  );
}

export default App;
