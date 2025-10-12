import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../config/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  Shield,
  UserX,
  UserCheck,
  Trash2,
  AlertTriangle,
  MoreVertical,
} from "lucide-react";
import Header from "../components/Header";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBarangay, setFilterBarangay] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [barangays, setBarangays] = useState([]);
  const [regions, setRegions] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [profileData, setProfileData] = useState({
    profile: { firstName: "", lastName: "", address: "" },
    email: "",
    phoneNumber: "",
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
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
            if (userData.profile?.isAdmin) {
              setIsAdmin(true);
              await loadUsers();
            } else {
              navigate("/home", { replace: true });
            }
          }
        } else {
          navigate("/login", { replace: true });
        }
      } finally {
        setIsChecking(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);

      const usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUsers(usersList);

      const uniqueBarangays = [
        ...new Set(
          usersList
            .map((u) => u.profile?.administrativeLocation?.barangay)
            .filter(Boolean)
        ),
      ];
      const uniqueRegions = [
        ...new Set(
          usersList
            .map((u) => u.profile?.administrativeLocation?.region)
            .filter(Boolean)
        ),
      ];

      setBarangays(uniqueBarangays);
      setRegions(uniqueRegions);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToOfficial = async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        "profile.isVerifiedOfficial": true,
      });
      await loadUsers();
    } catch (error) {
      console.error("Error promoting user:", error);
      alert("Failed to promote user");
    }
  };

  const handleDemoteOfficial = async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        "profile.isVerifiedOfficial": false,
      });
      await loadUsers();
    } catch (error) {
      console.error("Error demoting user:", error);
      alert("Failed to demote user");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await deleteDoc(doc(db, "users", userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
      await loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${user.profile?.firstName || ""} ${
      user.profile?.lastName || ""
    }`.toLowerCase();
    const email = (user.email || "").toLowerCase();
    const matchesSearch =
      fullName.includes(searchLower) || email.includes(searchLower);

    const matchesBarangay =
      !filterBarangay ||
      user.profile?.administrativeLocation?.barangay === filterBarangay;
    const matchesRegion =
      !filterRegion ||
      user.profile?.administrativeLocation?.region === filterRegion;

    return matchesSearch && matchesBarangay && matchesRegion;
  });

  if (isChecking) {
    return null;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

          * {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }

          .admin-container {
            background: #f8f9fc;
            min-height: 100vh;
          }

          .admin-hero {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            padding: 3rem 0;
            color: white;
            position: relative;
            overflow: hidden;
          }

          .admin-hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            opacity: 0.3;
          }

          .admin-title {
            font-size: 2.5rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
            position: relative;
            z-index: 1;
          }

          .admin-subtitle {
            font-size: 1.1rem;
            opacity: 0.95;
            position: relative;
            z-index: 1;
          }

          .filters-section {
            background: white;
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 8px 30px rgba(0,0,0,0.08);
            margin: 2rem 0;
          }

          .search-box {
            background: linear-gradient(135deg, #f6f8fb 0%, #ffffff 100%);
            border-radius: 14px;
            padding: 1.25rem 1.5rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
            border: 2px solid #e2e8f0;
            transition: all 0.3s ease;
          }

          .search-box:focus-within {
            border-color: #FF5A1F;
            box-shadow: 0 4px 14px rgba(255, 90, 31, 0.15);
          }

          .search-box input {
            border: none;
            outline: none;
            flex: 1;
            font-size: 1rem;
            background: transparent;
            color: #1a202c;
          }

          .search-box input::placeholder {
            color: #cbd5e1;
          }

          .filters-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
          }

          .filter-select {
            padding: 0.875rem 1rem;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            font-size: 0.95rem;
            transition: all 0.3s ease;
            background: white;
            cursor: pointer;
            color: #1a202c;
          }

          .filter-select:focus {
            outline: none;
            border-color: #FF5A1F;
            box-shadow: 0 4px 14px rgba(255, 90, 31, 0.15);
          }

          .filter-select:hover {
            border-color: #FF5A1F;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
          }

          .stat-card {
            background: white;
            border-radius: 16px;
            padding: 1.75rem;
            border: 2px solid #e2e8f0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          }

          .stat-card:hover {
            border-color: #FF5A1F;
            transform: translateY(-4px);
            box-shadow: 0 12px 30px rgba(255, 90, 31, 0.15);
          }

          .stat-number {
            font-size: 2.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.5rem;
          }

          .stat-label {
            color: #64748b;
            font-weight: 600;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .user-card {
            background: white;
            border-radius: 16px;
            padding: 1.75rem;
            margin-bottom: 1rem;
            border: 2px solid #e2e8f0;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 4px 12px rgba(0,0,0,0.06);
            position: relative;
            overflow: hidden;
          }

          .user-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #FF5A1F, #E63946);
            transform: scaleX(0);
            transition: transform 0.3s ease;
          }

          .user-card:hover::before {
            transform: scaleX(1);
          }

          .user-card:hover {
            border-color: #FF5A1F;
            transform: translateY(-4px);
            box-shadow: 0 12px 30px rgba(255, 90, 31, 0.15);
          }

          .user-avatar {
            width: 56px;
            height: 56px;
            border-radius: 14px;
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 1.25rem;
            box-shadow: 0 4px 14px rgba(255, 90, 31, 0.3);
            flex-shrink: 0;
          }

          .action-btn {
            padding: 0.6rem 1.25rem;
            border-radius: 10px;
            border: none;
            font-weight: 600;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }

          .btn-promote {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
          }

          .btn-promote:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(34, 197, 94, 0.3);
          }

          .btn-demote {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
          }

          .btn-demote:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(245, 158, 11, 0.3);
          }

          .btn-delete {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
          }

          .btn-delete:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(239, 68, 68, 0.3);
          }

          .badge-admin {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
            padding: 0.4rem 0.9rem;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
          }

          .badge-official {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            padding: 0.4rem 0.9rem;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
          }

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            backdrop-filter: blur(4px);
          }

          .modal-content {
            background: white;
            border-radius: 20px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: slideInUp 0.3s ease-out;
          }

          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .modal-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 1rem;
          }

          .modal-actions {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
          }

          .btn-cancel {
            flex: 1;
            padding: 0.875rem;
            border-radius: 12px;
            border: 2px solid #e2e8f0;
            background: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            color: #64748b;
          }

          .btn-cancel:hover {
            border-color: #FF5A1F;
            color: #FF5A1F;
            background: #fff5f1;
          }

          .btn-confirm {
            flex: 1;
            padding: 0.875rem;
            border-radius: 12px;
            border: none;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .btn-confirm:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(239, 68, 68, 0.3);
          }

          .back-button {
            background: white;
            border: none;
            border-radius: 12px;
            padding: 0.75rem 1.5rem;
            color: #FF5A1F;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            position: relative;
            z-index: 2;
          }

          .back-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 14px rgba(0,0,0,0.15);
            background: #fff5f1;
          }

          .loading-spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #f3f4f6;
            border-top-color: #FF5A1F;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 3rem auto;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .user-info {
            flex: 1;
          }

          .user-name {
            font-weight: 700;
            font-size: 1.1rem;
            color: #1a202c;
            margin-bottom: 0.5rem;
          }

          .user-email {
            color: #64748b;
            margin-bottom: 0.5rem;
            font-size: 0.95rem;
          }

          .user-location {
            color: #94a3b8;
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .action-buttons {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
          }

          @media (max-width: 768px) {
            .admin-title {
              font-size: 2rem;
            }

            .stats-grid {
              grid-template-columns: 1fr 1fr;
            }

            .action-buttons {
              flex-direction: column;
            }

            .action-btn {
              width: 100%;
              justify-content: center;
            }

            .user-card {
              flex-direction: column;
            }
          }
        `}
      </style>

      <div className="admin-container">
        <Header profileData={profileData} />

        <section className="admin-hero">
          <div className="container">
            <button
              className="back-button mb-4"
              onClick={() => navigate("/home")}
            >
              <ChevronLeft size={20} />
              Back to Dashboard
            </button>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">
              Manage users, officials, and system operations
            </p>
          </div>
        </section>

        <div className="container py-5 px-4">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{users.length}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {users.filter((u) => u.profile?.isVerifiedOfficial).length}
              </div>
              <div className="stat-label">Verified Officials</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{barangays.length}</div>
              <div className="stat-label">Barangays</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{filteredUsers.length}</div>
              <div className="stat-label">Search Results</div>
            </div>
          </div>

          <div className="filters-section">
            <div className="search-box">
              <Search size={20} color="#FF5A1F" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filters-grid">
              <select
                className="filter-select"
                value={filterBarangay}
                onChange={(e) => setFilterBarangay(e.target.value)}
              >
                <option value="">All Barangays</option>
                {barangays.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <select
                className="filter-select"
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
              >
                <option value="">All Regions</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-spinner"></div>
          ) : (
            <div>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted" style={{ fontSize: "1.1rem" }}>
                    No users found matching your criteria
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="user-card">
                    <div className="d-flex align-items-start gap-3 w-100">
                      <div className="user-avatar">
                        {user.profile?.firstName?.[0]?.toUpperCase() || "U"}
                        {user.profile?.lastName?.[0]?.toUpperCase() || ""}
                      </div>
                      <div className="user-info">
                        <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                          <h5 className="user-name mb-0">
                            {user.profile?.firstName || ""}{" "}
                            {user.profile?.lastName || "Unknown"}
                          </h5>
                          {user.isAdmin && (
                            <span className="badge-admin">Admin</span>
                          )}
                          {user.profile?.isVerifiedOfficial && (
                            <span className="badge-official">✓ Official</span>
                          )}
                        </div>
                        <p className="user-email mb-1">{user.email}</p>
                        {user.profile?.administrativeLocation?.barangay && (
                          <p className="user-location">
                            <span>📍</span>
                            {user.profile.administrativeLocation.barangay},{" "}
                            {user.profile.administrativeLocation.municipality}
                          </p>
                        )}
                      </div>
                      <div className="action-buttons ms-auto">
                        {!user.profile?.isVerifiedOfficial && !user.isAdmin && (
                          <button
                            className="action-btn btn-promote"
                            onClick={() => handlePromoteToOfficial(user.id)}
                          >
                            <UserCheck size={16} />
                            Promote
                          </button>
                        )}
                        {user.profile?.isVerifiedOfficial && !user.isAdmin && (
                          <button
                            className="action-btn btn-demote"
                            onClick={() => handleDemoteOfficial(user.id)}
                          >
                            <UserX size={16} />
                            Demote
                          </button>
                        )}
                        {!user.isAdmin && (
                          <button
                            className="action-btn btn-delete"
                            onClick={() => {
                              setUserToDelete(user);
                              setShowDeleteModal(true);
                            }}
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {showDeleteModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowDeleteModal(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <AlertTriangle size={32} color="#ef4444" />
                <h3 className="modal-title mb-0">Confirm Deletion</h3>
              </div>
              <p style={{ color: "#64748b", marginBottom: "1rem" }}>
                Are you sure you want to delete{" "}
                <strong>
                  {userToDelete?.profile?.firstName}{" "}
                  {userToDelete?.profile?.lastName}
                </strong>
                ? This action cannot be undone and all associated data will be
                permanently removed.
              </p>
              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button className="btn-confirm" onClick={handleDeleteUser}>
                  Delete User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminDashboard;
