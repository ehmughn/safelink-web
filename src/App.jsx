import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import { auth } from "./config/firebase";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={user ? <Home /> : <LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route
          path="/create-account"
          element={user ? <Navigate to="/" /> : <CreateAccount />}
        />
      </Routes>
    </>
  );
}

export default App;
