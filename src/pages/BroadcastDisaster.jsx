import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth, storage } from "../config/firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Radio, AlertTriangle, Send, ChevronLeft } from "lucide-react";
import Header from "../components/Header";

const BroadcastDisaster = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [formData, setFormData] = useState({
    alertType: "",
    description: "",
    emergencyType: "typhoon",
    barangay: "",
    barangayAssignment: "",
    image: null,
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.profile?.isVerifiedOfficial) {
            setIsVerified(true);
            // Pre-fill barangay information
            const barangay =
              userData.profile?.administrativeLocation?.barangay || "";
            const municipality =
              userData.profile?.administrativeLocation?.municipality || "";
            const province =
              userData.profile?.administrativeLocation?.province || "";
            const barangayAssignment = `${barangay}, ${municipality}, ${province}`;

            setFormData((prev) => ({
              ...prev,
              barangay,
              barangayAssignment,
            }));
          } else {
            navigate("/home");
          }
        }
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      const userData = userDoc.data();

      const broadcasterName =
        userData?.displayName ||
        `${userData?.profile?.firstName || ""} ${
          userData?.profile?.lastName || ""
        }`.trim() ||
        userData?.email ||
        "Unknown";

      // Get coordinates from user profile if available
      const coordinates = userData?.profile?.coordinates || null;

      let imageUrl = null;
      if (formData.image) {
        const imageRef = ref(
          storage,
          `broadcasts/${currentUser.uid}/${Date.now()}_${formData.image.name}`
        );
        await uploadBytes(imageRef, formData.image);
        imageUrl = await getDownloadURL(imageRef);
      }

      // Create broadcast document
      const broadcastData = {
        alertType: formData.alertType,
        barangay: formData.barangay,
        barangayAssignment: formData.barangayAssignment,
        broadcasterId: currentUser.uid,
        broadcasterName: broadcasterName,
        coordinates: coordinates
          ? {
              latitude: coordinates.latitude || 0,
              longitude: coordinates.longitude || 0,
            }
          : {
              latitude: 0,
              longitude: 0,
            },
        createdAt: new Date().toISOString(),
        deliveredCount: 0,
        description: formData.description,
        emergencyType: formData.emergencyType,
        isOfficialBroadcast: true,
        status: "active",
        imageUrl: imageUrl,
      };

      await addDoc(collection(db, "broadcasts"), broadcastData);

      setSuccess(true);
      setTimeout(() => {
        navigate("/home");
      }, 2000);
    } catch (error) {
      console.error("Error broadcasting disaster:", error);
      alert("Failed to broadcast disaster: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isVerified) {
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

          .broadcast-container {
            background: #f8f9fc;
            min-height: 100vh;
          }

          .broadcast-hero {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            padding: 3rem 0;
            color: white;
          }

          .broadcast-title {
            font-size: 2.5rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
          }

          .broadcast-form-card {
            background: white;
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 8px 30px rgba(0,0,0,0.08);
            margin: 2rem 0;
          }

          .form-group {
            margin-bottom: 1.5rem;
          }

          .form-group label {
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 0.5rem;
            display: block;
          }

          .form-control, .form-select {
            width: 100%;
            padding: 0.875rem 1rem;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            font-size: 1rem;
            transition: all 0.3s ease;
          }

          .form-control:focus, .form-select:focus {
            outline: none;
            border-color: #dc2626;
            box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
          }

          textarea.form-control {
            min-height: 120px;
            resize: vertical;
          }

          .btn-broadcast {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            border: none;
            color: white;
            padding: 1rem 2rem;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
          }

          .btn-broadcast:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(220, 38, 38, 0.3);
          }

          .btn-broadcast:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .success-message {
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 1.5rem;
            border-radius: 12px;
            margin-bottom: 2rem;
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .back-button {
            background: white;
            border: none;
            border-radius: 12px;
            padding: 0.75rem 1.5rem;
            color: #dc2626;
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

          .image-preview {
            max-width: 200px;
            border-radius: 8px;
            margin-top: 0.5rem;
          }
        `}
      </style>

      <div className="broadcast-container">
        <Header />

        <section className="broadcast-hero">
          <div className="container">
            <button
              className="back-button mb-3"
              onClick={() => navigate("/home")}
            >
              <ChevronLeft size={20} />
              Back to Dashboard
            </button>
            <h1 className="broadcast-title">Broadcast Disaster Alert</h1>
            <p style={{ fontSize: "1.1rem", opacity: 0.95 }}>
              Notify your barangay about upcoming disasters
            </p>
          </div>
        </section>

        <div className="container">
          {success && (
            <div className="success-message">
              <AlertTriangle size={24} />
              <span>Disaster alert broadcasted successfully!</span>
            </div>
          )}

          <div className="broadcast-form-card">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="alertType">Alert Title</label>
                <input
                  id="alertType"
                  type="text"
                  className="form-control"
                  placeholder="e.g., Typhoon Warning"
                  value={formData.alertType}
                  onChange={(e) =>
                    setFormData({ ...formData, alertType: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="emergencyType">Disaster Type</label>
                <select
                  id="emergencyType"
                  className="form-select"
                  value={formData.emergencyType}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyType: e.target.value })
                  }
                  required
                >
                  <option value="typhoon">Typhoon</option>
                  <option value="flood">Flood</option>
                  <option value="earthquake">Earthquake</option>
                  <option value="fire">Fire</option>
                  <option value="landslide">Landslide</option>
                  <option value="tsunami">Tsunami</option>
                  <option value="volcanic_eruption">Volcanic Eruption</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="barangayAssignment">Barangay Assignment</label>
                <input
                  id="barangayAssignment"
                  type="text"
                  className="form-control"
                  value={formData.barangayAssignment}
                  readOnly
                  style={{ backgroundColor: "#f1f5f9" }}
                />
                <small className="text-muted">
                  This broadcast will be sent to residents in your assigned
                  barangay
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description & Instructions</label>
                <textarea
                  id="description"
                  className="form-control"
                  placeholder="Provide detailed information and safety instructions..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="image">Attach Image (Optional)</label>
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={handleImageChange}
                />
                {formData.image && (
                  <img
                    src={URL.createObjectURL(formData.image)}
                    alt="Preview"
                    className="image-preview"
                  />
                )}
              </div>

              <button
                type="submit"
                className="btn-broadcast w-100"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                    ></span>
                    Broadcasting...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Broadcast Alert
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default BroadcastDisaster;
