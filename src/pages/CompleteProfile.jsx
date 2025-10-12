import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../config/firebase";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import {
  regions,
  provinces,
  cities,
  barangays,
} from "select-philippines-address";
import BrandLogo from "../components/BrandLogo";
import AlertIcon from "../assets/alert-icon.png";

const CompleteProfile = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [region, setRegion] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [barangay, setBarangay] = useState("");

  const [regionList, setRegionList] = useState([]);
  const [provinceList, setProvinceList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [barangayList, setBarangayList] = useState([]);

  const [regionCode, setRegionCode] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [cityCode, setCityCode] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    loadUserProfile();
    loadRegions();
  }, []);

  useEffect(() => {
    if (regionCode) {
      loadProvinces(regionCode);
    }
  }, [regionCode]);

  useEffect(() => {
    if (provinceCode) {
      loadCities(provinceCode);
    }
  }, [provinceCode]);

  useEffect(() => {
    if (cityCode) {
      loadBarangays(cityCode);
    }
  }, [cityCode]);

  const loadUserProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setFirstName(userData.profile?.firstName || "");
        setLastName(userData.profile?.lastName || "");
        setPhoneNumber(userData.phoneNumber || "");
        setBirthdate(userData.profile?.birthdate || "");

        // Load saved location if exists
        if (userData.profile?.administrativeLocation) {
          const loc = userData.profile.administrativeLocation;
          setRegion(loc.region || "");
          setProvince(loc.province || "");
          setCity(loc.municipality || "");
          setBarangay(loc.barangay || "");
        }
      }
      setIsLoadingProfile(false);
    } catch (error) {
      console.error("Error loading profile:", error);
      setError("Failed to load profile data.");
      setIsLoadingProfile(false);
    }
  };

  const loadRegions = async () => {
    try {
      const regionData = await regions();
      setRegionList(regionData);
    } catch (error) {
      console.error("Error loading regions:", error);
    }
  };

  const loadProvinces = async (regCode) => {
    try {
      const provinceData = await provinces(regCode);
      setProvinceList(provinceData);
      setCityList([]);
      setBarangayList([]);
    } catch (error) {
      console.error("Error loading provinces:", error);
    }
  };

  const loadCities = async (provCode) => {
    try {
      const cityData = await cities(provCode);
      setCityList(cityData);
      setBarangayList([]);
    } catch (error) {
      console.error("Error loading cities:", error);
    }
  };

  const loadBarangays = async (cityCode) => {
    try {
      const barangayData = await barangays(cityCode);
      setBarangayList(barangayData);
    } catch (error) {
      console.error("Error loading barangays:", error);
    }
  };

  const handleRegionChange = (e) => {
    const selectedRegion = regionList.find(
      (r) => r.region_name === e.target.value
    );
    if (selectedRegion) {
      setRegion(selectedRegion.region_name);
      setRegionCode(selectedRegion.region_code);
      setProvince("");
      setProvinceCode("");
      setCity("");
      setCityCode("");
      setBarangay("");
      setFieldErrors((prev) => ({ ...prev, region: "" }));
      setError("");
    }
  };

  const handleProvinceChange = (e) => {
    const selectedProvince = provinceList.find(
      (p) => p.province_name === e.target.value
    );
    if (selectedProvince) {
      setProvince(selectedProvince.province_name);
      setProvinceCode(selectedProvince.province_code);
      setCity("");
      setCityCode("");
      setBarangay("");
      setFieldErrors((prev) => ({ ...prev, province: "" }));
      setError("");
    }
  };

  const handleCityChange = (e) => {
    const selectedCity = cityList.find((c) => c.city_name === e.target.value);
    if (selectedCity) {
      setCity(selectedCity.city_name);
      setCityCode(selectedCity.city_code);
      setBarangay("");
      setFieldErrors((prev) => ({ ...prev, city: "" }));
      setError("");
    }
  };

  const handleBarangayChange = (e) => {
    setBarangay(e.target.value);
    setFieldErrors((prev) => ({ ...prev, barangay: "" }));
    setError("");
  };

  const validatePhoneNumber = (phone) => /^\+?[\d\s-]{10,}$/.test(phone);

  const validateForm = () => {
    const errors = {};
    if (!firstName) errors.firstName = "First name is required.";
    if (!lastName) errors.lastName = "Last name is required.";
    if (!phoneNumber) errors.phoneNumber = "Phone number is required.";
    else if (!validatePhoneNumber(phoneNumber))
      errors.phoneNumber = "Please enter a valid phone number.";
    if (!birthdate) errors.birthdate = "Birthdate is required.";
    if (!region) errors.region = "Please select a region.";
    if (!province) errors.province = "Please select a province.";
    if (!city) errors.city = "Please select a city/municipality.";
    if (!barangay) errors.barangay = "Please select a barangay.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value, setter) => {
    setter(value);
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e) => {
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
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      const updatedProfile = {
        displayName: `${firstName} ${lastName}`,
        phoneNumber: phoneNumber,
        profile: {
          firstName: firstName,
          lastName: lastName,
          birthdate: birthdate,
          administrativeLocation: {
            region: region,
            province: province,
            municipality: city,
            barangay: barangay,
          },
          isVerifiedOfficial: false,
        },
      };

      await updateDoc(doc(db, "users", user.uid), updatedProfile);

      // Update localStorage
      const authInfo = JSON.parse(localStorage.getItem("auth") || "{}");
      const updatedAuthInfo = {
        ...authInfo,
        ...updatedProfile,
      };
      localStorage.setItem("auth", JSON.stringify(updatedAuthInfo));

      setSuccessMessage(
        "Profile completed successfully! Redirecting to dashboard..."
      );
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate("/");
  };

  if (isLoadingProfile) {
    return (
      <div className="complete-root">
        <div className="complete-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          .complete-root {
            min-height: 100vh;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            display: flex;
            flex-direction: column;
          }
          
          .complete-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            gap: 1rem;
          }
          
          .complete-header {
            padding: 1.5rem 0;
            background: white;
            border-bottom: 1px solid #e9ecef;
            text-align: center;
          }
          
          .complete-tagline {
            color: #6c757d;
            font-size: 0.875rem;
            margin: 0.5rem 0 0 0;
          }
          
          .complete-div {
            max-width: 700px;
            margin: 2rem auto;
            padding: 2rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            position: relative;
            flex: 1;
          }
          
          .complete-title {
            text-align: center;
            margin: 0 0 0.5rem 0;
            font-size: 1.75rem;
            font-weight: 600;
            color: #1a1a1a;
          }
          
          .complete-desc {
            text-align: center;
            color: #6c757d;
            margin-bottom: 2rem;
            font-size: 0.95rem;
          }
          
          .complete-success {
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 1rem;
            border-radius: 8px;
            margin: 1.5rem 0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: 500;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          
          .complete-success-icon {
            background: #28a745;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: bold;
            flex-shrink: 0;
          }
          
          .complete-form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.25rem;
            margin-bottom: 1.5rem;
          }
          
          .complete-input-div {
            display: flex;
            flex-direction: column;
          }
          
          .complete-section-title {
            grid-column: 1 / -1;
            font-size: 1.1rem;
            font-weight: 600;
            color: #1a1a1a;
            margin: 1rem 0 0.5rem 0;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e9ecef;
          }
          
          .complete-input-div label {
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #374151;
            font-size: 0.875rem;
          }
          
          .complete-input-div input,
          .complete-input-div select {
            padding: 0.75rem 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.3s ease;
            background-color: #fafafa;
            width: 100%;
          }
          
          .complete-input-div input:focus,
          .complete-input-div select:focus {
            outline: none;
            border-color: #FF5A1F;
            background-color: white;
            box-shadow: 0 0 0 3px rgba(255, 90, 31, 0.1);
          }
          
          .complete-input-div input.is-invalid,
          .complete-input-div select.is-invalid {
            border-color: #dc3545;
            background-color: #fdf2f2;
          }
          
          .complete-input-div select:disabled {
            background-color: #e9ecef;
            cursor: not-allowed;
            opacity: 0.6;
          }
          
          .complete-input-error {
            color: #dc3545;
            font-size: 0.75rem;
            margin-top: 0.25rem;
            display: block;
          }
          
          .complete-error {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 0.75rem;
            border-radius: 6px;
            margin: 1rem 0;
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .complete-error-icon {
            flex-shrink: 0;
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
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
          }
          
          .complete-button-group {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
          }
          
          .complete-skip-btn {
            background: white;
            border: 2px solid #e5e7eb;
            color: #6c757d;
            font-weight: 500;
            transition: all 0.3s ease;
          }
          
          .complete-skip-btn:hover:not(:disabled) {
            border-color: #d1d5db;
            background-color: #f9fafb;
            color: #374151;
            transform: translateY(-2px);
          }
          
          .complete-skip-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          
          .complete-footer {
            text-align: center;
            padding: 2rem 0;
            background: white;
            border-top: 1px solid #e9ecef;
            margin-top: auto;
          }
          
          .complete-footer a {
            color: #6c757d;
            text-decoration: none;
            margin: 0 1rem;
            font-size: 0.875rem;
            transition: color 0.3s ease;
          }
          
          .complete-footer a:hover {
            color: #FF5A1F;
            text-decoration: none;
          }
          
          @media (max-width: 768px) {
            .complete-div {
              margin: 1rem;
              padding: 1.5rem;
            }
            
            .complete-form-grid {
              grid-template-columns: 1fr;
            }
            
            .complete-title {
              font-size: 1.5rem;
            }
            
            .complete-button-group {
              flex-direction: column-reverse;
            }
          }
          
          @media (max-width: 576px) {
            .complete-div {
              margin: 0.5rem;
              padding: 1rem;
            }
          }
        `}
      </style>

      <div className="complete-root">
        <header className="complete-header">
          <div className="container text-center">
            <BrandLogo safe="#1A1A1A" link="#FF5A1F" />
            <p className="complete-tagline">Your Family Safety Dashboard</p>
          </div>
        </header>

        <main className="flex-grow-1 d-flex align-items-center">
          <div className="container">
            <div className="complete-div mx-auto">
              <h1 className="complete-title">Complete Your Profile</h1>
              <p className="complete-desc">
                Help us know you better to provide personalized safety features
              </p>

              {successMessage && (
                <div className="complete-success alert" role="alert">
                  <span className="complete-success-icon">✔</span>
                  {successMessage}
                </div>
              )}

              {!successMessage && (
                <form className="complete-form" onSubmit={handleSubmit}>
                  <div className="complete-form-grid">
                    <div className="complete-section-title">
                      Personal Information
                    </div>

                    <div className="complete-input-div">
                      <label htmlFor="firstName" className="form-label">
                        First Name <span style={{ color: "#dc3545" }}>*</span>
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        className={`form-control ${
                          fieldErrors.firstName ? "is-invalid" : ""
                        }`}
                        placeholder="Enter your first name"
                        value={firstName}
                        onChange={(e) =>
                          handleInputChange(
                            "firstName",
                            e.target.value,
                            setFirstName
                          )
                        }
                        aria-required="true"
                        aria-invalid={!!fieldErrors.firstName}
                        aria-describedby={
                          fieldErrors.firstName ? "firstName-error" : undefined
                        }
                      />
                      {fieldErrors.firstName && (
                        <span
                          id="firstName-error"
                          className="complete-input-error"
                          role="alert"
                        >
                          {fieldErrors.firstName}
                        </span>
                      )}
                    </div>

                    <div className="complete-input-div">
                      <label htmlFor="lastName" className="form-label">
                        Last Name <span style={{ color: "#dc3545" }}>*</span>
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        className={`form-control ${
                          fieldErrors.lastName ? "is-invalid" : ""
                        }`}
                        placeholder="Enter your last name"
                        value={lastName}
                        onChange={(e) =>
                          handleInputChange(
                            "lastName",
                            e.target.value,
                            setLastName
                          )
                        }
                        aria-required="true"
                        aria-invalid={!!fieldErrors.lastName}
                        aria-describedby={
                          fieldErrors.lastName ? "lastName-error" : undefined
                        }
                      />
                      {fieldErrors.lastName && (
                        <span
                          id="lastName-error"
                          className="complete-input-error"
                          role="alert"
                        >
                          {fieldErrors.lastName}
                        </span>
                      )}
                    </div>

                    <div className="complete-input-div">
                      <label htmlFor="phoneNumber" className="form-label">
                        Phone Number <span style={{ color: "#dc3545" }}>*</span>
                      </label>
                      <input
                        id="phoneNumber"
                        type="tel"
                        className={`form-control ${
                          fieldErrors.phoneNumber ? "is-invalid" : ""
                        }`}
                        placeholder="Enter your phone number"
                        value={phoneNumber}
                        onChange={(e) =>
                          handleInputChange(
                            "phoneNumber",
                            e.target.value,
                            setPhoneNumber
                          )
                        }
                        aria-required="true"
                        aria-invalid={!!fieldErrors.phoneNumber}
                        aria-describedby={
                          fieldErrors.phoneNumber
                            ? "phoneNumber-error"
                            : undefined
                        }
                      />
                      {fieldErrors.phoneNumber && (
                        <span
                          id="phoneNumber-error"
                          className="complete-input-error"
                          role="alert"
                        >
                          {fieldErrors.phoneNumber}
                        </span>
                      )}
                    </div>

                    <div className="complete-input-div">
                      <label htmlFor="birthdate" className="form-label">
                        Birthdate <span style={{ color: "#dc3545" }}>*</span>
                      </label>
                      <input
                        id="birthdate"
                        type="date"
                        className={`form-control ${
                          fieldErrors.birthdate ? "is-invalid" : ""
                        }`}
                        value={birthdate}
                        onChange={(e) =>
                          handleInputChange(
                            "birthdate",
                            e.target.value,
                            setBirthdate
                          )
                        }
                        aria-required="true"
                        aria-invalid={!!fieldErrors.birthdate}
                        aria-describedby={
                          fieldErrors.birthdate ? "birthdate-error" : undefined
                        }
                      />
                      {fieldErrors.birthdate && (
                        <span
                          id="birthdate-error"
                          className="complete-input-error"
                          role="alert"
                        >
                          {fieldErrors.birthdate}
                        </span>
                      )}
                    </div>

                    <div className="complete-section-title">Address</div>

                    <div className="complete-input-div">
                      <label htmlFor="region" className="form-label">
                        Region <span style={{ color: "#dc3545" }}>*</span>
                      </label>
                      <select
                        id="region"
                        className={`form-select ${
                          fieldErrors.region ? "is-invalid" : ""
                        }`}
                        value={region}
                        onChange={handleRegionChange}
                        aria-required="true"
                        aria-invalid={!!fieldErrors.region}
                        aria-describedby={
                          fieldErrors.region ? "region-error" : undefined
                        }
                      >
                        <option value="">Select Region</option>
                        {regionList.map((r) => (
                          <option key={r.region_code} value={r.region_name}>
                            {r.region_name}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.region && (
                        <span
                          id="region-error"
                          className="complete-input-error"
                          role="alert"
                        >
                          {fieldErrors.region}
                        </span>
                      )}
                    </div>

                    <div className="complete-input-div">
                      <label htmlFor="province" className="form-label">
                        Province <span style={{ color: "#dc3545" }}>*</span>
                      </label>
                      <select
                        id="province"
                        className={`form-select ${
                          fieldErrors.province ? "is-invalid" : ""
                        }`}
                        value={province}
                        onChange={handleProvinceChange}
                        disabled={!region}
                        aria-required="true"
                        aria-invalid={!!fieldErrors.province}
                        aria-describedby={
                          fieldErrors.province ? "province-error" : undefined
                        }
                      >
                        <option value="">Select Province</option>
                        {provinceList.map((p) => (
                          <option key={p.province_code} value={p.province_name}>
                            {p.province_name}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.province && (
                        <span
                          id="province-error"
                          className="complete-input-error"
                          role="alert"
                        >
                          {fieldErrors.province}
                        </span>
                      )}
                    </div>

                    <div className="complete-input-div">
                      <label htmlFor="city" className="form-label">
                        City/Municipality{" "}
                        <span style={{ color: "#dc3545" }}>*</span>
                      </label>
                      <select
                        id="city"
                        className={`form-select ${
                          fieldErrors.city ? "is-invalid" : ""
                        }`}
                        value={city}
                        onChange={handleCityChange}
                        disabled={!province}
                        aria-required="true"
                        aria-invalid={!!fieldErrors.city}
                        aria-describedby={
                          fieldErrors.city ? "city-error" : undefined
                        }
                      >
                        <option value="">Select City/Municipality</option>
                        {cityList.map((c) => (
                          <option key={c.city_code} value={c.city_name}>
                            {c.city_name}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.city && (
                        <span
                          id="city-error"
                          className="complete-input-error"
                          role="alert"
                        >
                          {fieldErrors.city}
                        </span>
                      )}
                    </div>

                    <div className="complete-input-div">
                      <label htmlFor="barangay" className="form-label">
                        Barangay <span style={{ color: "#dc3545" }}>*</span>
                      </label>
                      <select
                        id="barangay"
                        className={`form-select ${
                          fieldErrors.barangay ? "is-invalid" : ""
                        }`}
                        value={barangay}
                        onChange={handleBarangayChange}
                        disabled={!city}
                        aria-required="true"
                        aria-invalid={!!fieldErrors.barangay}
                        aria-describedby={
                          fieldErrors.barangay ? "barangay-error" : undefined
                        }
                      >
                        <option value="">Select Barangay</option>
                        {barangayList.map((b) => (
                          <option key={b.brgy_code} value={b.brgy_name}>
                            {b.brgy_name}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.barangay && (
                        <span
                          id="barangay-error"
                          className="complete-input-error"
                          role="alert"
                        >
                          {fieldErrors.barangay}
                        </span>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="complete-error alert" role="alert">
                      <img
                        src={AlertIcon}
                        alt="Error icon"
                        className="complete-error-icon"
                        width="16"
                        height="16"
                      />
                      {error}
                    </div>
                  )}

                  <div className="complete-button-group">
                    <button
                      type="button"
                      className="btn complete-skip-btn btn-lg flex-fill"
                      onClick={handleSkip}
                      disabled={isLoading}
                    >
                      Skip for Now
                    </button>
                    <button
                      className="btn btn-safelink btn-lg flex-fill"
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Saving Profile...
                        </>
                      ) : (
                        "Complete Profile"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </main>

        <footer className="complete-footer">
          <div className="container">
            <a href="/help">Need Help?</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </div>
        </footer>
      </div>
    </>
  );
};

export default CompleteProfile;
