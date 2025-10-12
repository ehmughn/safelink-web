import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../config/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Users, MapPin, Phone, Mail, Search, ChevronLeft } from "lucide-react";
import Header from "../components/Header";

const BarangayMembers = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        await loadBarangayMembers(user.uid);
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const loadBarangayMembers = async (userId) => {
    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);

      const currentUserDoc = usersSnapshot.docs.find(
        (doc) => doc.id === userId
      );
      if (!currentUserDoc) return;

      const currentUserData = currentUserDoc.data();
      const userBarangay =
        currentUserData?.profile?.administrativeLocation?.barangay;

      if (!userBarangay) {
        setLoading(false);
        return;
      }

      const barangayMembers = usersSnapshot.docs
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
        }));

      setMembers(barangayMembers);
    } catch (error) {
      console.error("Error loading barangay members:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter((member) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${member.profile?.firstName || ""} ${
      member.profile?.lastName || ""
    }`.toLowerCase();
    const email = (member.email || "").toLowerCase();
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

          * {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }

          .barangay-members-container {
            background: #f8f9fc;
            min-height: 100vh;
          }

          .barangay-hero {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            padding: 3rem 0;
            color: white;
          }

          .barangay-title {
            font-size: 2.5rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
          }

          .barangay-subtitle {
            font-size: 1.1rem;
            opacity: 0.95;
          }

          .search-box {
            background: white;
            border-radius: 16px;
            padding: 1rem 1.5rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            box-shadow: 0 4px 14px rgba(0,0,0,0.08);
            margin: 2rem 0;
          }

          .search-box input {
            border: none;
            outline: none;
            flex: 1;
            font-size: 1rem;
            color: #1a202c;
          }

          .search-box input::placeholder {
            color: #94a3b8;
          }

          .member-card {
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            border: 2px solid #e2e8f0;
            transition: all 0.3s ease;
            cursor: pointer;
          }

          .member-card:hover {
            border-color: #FF5A1F;
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          }

          .member-avatar {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 1.5rem;
            box-shadow: 0 4px 14px rgba(255, 90, 31, 0.3);
          }

          .member-info h5 {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 0.5rem;
          }

          .member-detail {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #64748b;
            font-size: 0.95rem;
            margin-bottom: 0.25rem;
          }

          .badge-verified {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            padding: 0.375rem 0.75rem;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
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
          }

          .back-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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

          @media (max-width: 768px) {
            .barangay-title {
              font-size: 2rem;
            }
            
            .member-card {
              padding: 1rem;
            }
          }
        `}
      </style>

      <div className="barangay-members-container">
        <Header />

        <section className="barangay-hero">
          <div className="container">
            <button
              className="back-button mb-3"
              onClick={() => navigate("/home")}
            >
              <ChevronLeft size={20} />
              Back to Dashboard
            </button>
            <h1 className="barangay-title">Barangay Members</h1>
            <p className="barangay-subtitle">
              Connect with your community members
            </p>
          </div>
        </section>

        <div className="container py-4">
          <div className="search-box">
            <Search size={20} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="loading-spinner"></div>
          ) : filteredMembers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Users size={40} className="text-muted" />
              </div>
              <h5 style={{ fontWeight: 600, color: "#64748b" }}>
                {searchTerm ? "No Members Found" : "No Barangay Members"}
              </h5>
              <p className="text-muted">
                {searchTerm
                  ? "Try adjusting your search"
                  : "Be the first to connect with your community"}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-muted mb-3">
                Showing {filteredMembers.length} member
                {filteredMembers.length !== 1 ? "s" : ""}
              </p>
              {filteredMembers.map((member) => (
                <div key={member.id} className="member-card">
                  <div className="d-flex align-items-start gap-3">
                    <div className="member-avatar">
                      {member.profile?.firstName?.[0]?.toUpperCase() || "U"}
                      {member.profile?.lastName?.[0]?.toUpperCase() || ""}
                    </div>
                    <div className="member-info flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <h5 className="mb-0">
                          {member.profile?.firstName || ""}{" "}
                          {member.profile?.lastName || "Unknown User"}
                        </h5>
                        {member.profile?.isVerifiedOfficial && (
                          <span className="badge-verified">✓ Official</span>
                        )}
                      </div>
                      {member.email && (
                        <div className="member-detail">
                          <Mail size={16} />
                          <span>{member.email}</span>
                        </div>
                      )}
                      {member.phoneNumber && (
                        <div className="member-detail">
                          <Phone size={16} />
                          <span>{member.phoneNumber}</span>
                        </div>
                      )}
                      {member.profile?.administrativeLocation?.barangay && (
                        <div className="member-detail">
                          <MapPin size={16} />
                          <span>
                            {member.profile.administrativeLocation.barangay}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BarangayMembers;
