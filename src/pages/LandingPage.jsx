import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle,
  Map,
  ClipboardList,
  Bell,
  Laptop,
  Shield,
  Users,
  MapPin,
  Smartphone,
  ArrowRight,
  Star,
  Clock,
  Heart,
} from "lucide-react";

import BrandLogo from "../components/BrandLogo";
import HeroIcon from "../assets/hero-devices.png";

const LandingPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleScrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleButtonClick = (path) => {
    setIsLoading(true);
    setTimeout(() => {
      navigate(path);
      setIsLoading(false);
    }, 500);
  };

  const features = [
    {
      icon: Shield,
      title: "Family Safety Alerts",
      description:
        "Instant notifications during emergencies to keep your loved ones informed and safe.",
    },
    {
      icon: Users,
      title: "Family Connections",
      description:
        "Create family groups and stay connected with real-time status updates.",
    },
    {
      icon: MapPin,
      title: "Location Sharing",
      description:
        "Share your location with family members during emergencies.",
    },
    {
      icon: Smartphone,
      title: "Mobile Ready",
      description: "Access SafeLink anywhere, anytime from your mobile device.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Mother of 3",
      content:
        "SafeLink gives me peace of mind knowing I can quickly check on my family's safety during emergencies.",
      rating: 5,
    },
    {
      name: "Mike Chen",
      role: "Emergency Responder",
      content:
        "This app has revolutionized how families stay connected during crisis situations.",
      rating: 5,
    },
    {
      name: "Lisa Rodriguez",
      role: "Teacher",
      content:
        "Simple, effective, and reliable. SafeLink is exactly what every family needs.",
      rating: 5,
    },
  ];

  // Custom styles for hover effects
  const buttonHoverStyle = {
    backgroundColor: "#FF5A1F",
    transition: "all 0.3s ease",
  };

  const cardHoverStyle = {
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
  };

  return (
    <>
      {/* CSS for hover effects */}
      <style>
        {`
          .btn-safelink {
            background-color: #FF5A1F;
            border-color: #FF5A1F;
            transition: all 0.3s ease;
          }

          .btn-safelink:hover {
            background-color: #E64A0F;
            border-color: #E64A0F;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(255, 90, 31, 0.3);
          }

          .btn-safelink:focus {
            background-color: #E64A0F;
            border-color: #E64A0F;
            box-shadow: 0 0 0 0.25rem rgba(255, 90, 31, 0.25);
          }

          .btn-outline-light:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(255, 255, 255, 0.2);
          }

          .feature-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }

          .feature-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
          }

          .nav-link:hover {
            color: #FF5A1F !important;
            transition: color 0.3s ease;
          }

          .testimonial-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }

          .testimonial-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12) !important;
          }

          .cta-btn {
            transition: all 0.3s ease;
          }

          .cta-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
          }

          .footer-link:hover {
            color: #FF5A1F !important;
            transition: color 0.3s ease;
          }

          .step-icon {
            transition: transform 0.3s ease;
          }

          .step-icon:hover {
            transform: scale(1.1);
          }

          .min-vh-75 {
            min-height: 75vh;
          }

          .card-hover {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }

          .card-hover:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          }

          .bg-primary {
            background-color: #FF5A1F !important;
          }

          .text-primary {
            color: #FF5A1F !important;
          }

          .btn-safelink {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            border: 2px solid #FF5A1F;
            color: white;
            font-weight: 600;
            transition: all 0.3s ease;
          }

          .btn-safelink:hover {
            background: linear-gradient(135deg, #E63946 0%, #c82333 100%);
            border-color: #E63946;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 90, 31, 0.3);
          }
        `}
      </style>

      <div className="bg-light min-vh-100">
        {/* Skip to Content Link */}
        <a
          href="#main-content"
          className="visually-hidden-focusable position-absolute top-0 start-0 btn m-2 btn-safelink text-white"
        >
          Skip to content
        </a>

        {/* Header - Bootstrap Navbar */}
        <header
          className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top"
          role="banner"
        >
          <div className="container-fluid px-4">
            <div className="navbar-brand">
              <BrandLogo safe="#1A1A1A" link="#FF5A1F" />
            </div>

            <button
              className="navbar-toggler border-0"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
              aria-controls="navbarNav"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="navbarNav">
              <nav
                className="navbar-nav ms-auto align-items-center"
                role="navigation"
              >
                <li className="nav-item">
                  <a
                    className="nav-link text-dark fw-medium"
                    href="#features"
                    onClick={(e) => {
                      e.preventDefault();
                      handleScrollTo("features");
                    }}
                  >
                    Features
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className="nav-link text-dark fw-medium"
                    href="#how"
                    onClick={(e) => {
                      e.preventDefault();
                      handleScrollTo("how");
                    }}
                  >
                    How It Works
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link text-dark fw-medium" href="/login">
                    Log In
                  </a>
                </li>
                <li className="nav-item ms-2">
                  <button
                    className="btn btn-safelink text-white px-4 fw-medium"
                    onClick={() => handleButtonClick("/create-account")}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Loading...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </li>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main id="main-content">
          <section
            className="py-5"
            style={{
              background: "linear-gradient(0deg, #FF5A1F 0%, #fff 120%)",
              minHeight: "70vh",
            }}
            aria-labelledby="hero-heading"
          >
            <div className="container h-100">
              <div className="row align-items-center h-100 py-5">
                <div className="col-lg-6 text-white">
                  <h1 id="hero-heading" className="display-4 fw-bold mb-4">
                    Stay Safe, Stay Connected
                  </h1>
                  <p className="lead mb-4 fs-5">
                    Empower your family with real-time disaster alerts, safety
                    check-ins, evacuation maps, and essential planning tools.
                  </p>
                  <div className="d-flex flex-column flex-sm-row gap-3">
                    <button
                      className="btn btn-safelink btn-lg px-4 py-3 fw-medium text-white"
                      onClick={() => handleButtonClick("/create-account")}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Loading...
                        </>
                      ) : (
                        "Get Started"
                      )}
                    </button>
                    <button
                      className="btn btn-outline-light btn-lg px-4 py-3 fw-medium"
                      onClick={() => handleButtonClick("/demo")}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Loading...
                        </>
                      ) : (
                        "Watch Demo"
                      )}
                    </button>
                  </div>
                </div>
                <div className="col-lg-6 text-center">
                  <img
                    src={HeroIcon}
                    alt="SafeLink app on mobile and desktop devices"
                    className="img-fluid"
                    loading="lazy"
                    style={{ maxHeight: "400px", borderRadius: "24px" }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section
            className="py-5 bg-white"
            id="features"
            aria-labelledby="features-heading"
          >
            <div className="container">
              <h2
                id="features-heading"
                className="text-center display-5 fw-bold text-dark mb-5"
              >
                Why Choose SafeLink?
              </h2>
              <div className="row g-4">
                <div className="col-md-6 col-lg-3">
                  <div className="card h-100 border-0 shadow-sm text-center p-4 feature-card">
                    <div className="card-body">
                      <AlertTriangle
                        className="mb-3"
                        size={48}
                        color="#FF5A1F"
                      />
                      <h3 className="h5 fw-bold mb-3">Real-Time Alerts</h3>
                      <p className="text-muted">
                        Instant updates from PAGASA-PHIVOLCS for timely action.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3">
                  <div className="card h-100 border-0 shadow-sm text-center p-4 feature-card">
                    <div className="card-body">
                      <CheckCircle className="mb-3" size={48} color="#FF5A1F" />
                      <h3 className="h5 fw-bold mb-3">Family Check-In</h3>
                      <p className="text-muted">
                        Confirm your loved ones' safety with one tap.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3">
                  <div className="card h-100 border-0 shadow-sm text-center p-4 feature-card">
                    <div className="card-body">
                      <Map className="mb-3" size={48} color="#FF5A1F" />
                      <h3 className="h5 fw-bold mb-3">Evacuation Maps</h3>
                      <p className="text-muted">
                        Find the nearest safe zones instantly.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3">
                  <div className="card h-100 border-0 shadow-sm text-center p-4 feature-card">
                    <div className="card-body">
                      <ClipboardList
                        className="mb-3"
                        size={48}
                        color="#FF5A1F"
                      />
                      <h3 className="h5 fw-bold mb-3">Go-Bag Checklist</h3>
                      <p className="text-muted">
                        Prepare with an auto-generated emergency kit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section
            className="py-5 bg-light"
            id="how"
            aria-labelledby="how-heading"
          >
            <div className="container">
              <h2
                id="how-heading"
                className="text-center display-5 fw-bold text-dark mb-5"
              >
                How SafeLink Protects You
              </h2>
              <div className="row justify-content-center">
                <div className="col-lg-10">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                    <div className="text-center mb-4 mb-md-0">
                      <div
                        className="bg-white rounded-circle p-3 shadow-sm d-inline-flex align-items-center justify-content-center mb-3 step-icon"
                        style={{ width: "80px", height: "80px" }}
                      >
                        <Bell size={40} color="#FF5A1F" />
                      </div>
                      <p className="fw-semibold text-dark">Stay Informed</p>
                    </div>
                    <div
                      className="d-none d-md-block fs-2 mx-3"
                      style={{ color: "#FF5A1F" }}
                    >
                      →
                    </div>
                    <div className="text-center mb-4 mb-md-0">
                      <div
                        className="bg-white rounded-circle p-3 shadow-sm d-inline-flex align-items-center justify-content-center mb-3 step-icon"
                        style={{ width: "80px", height: "80px" }}
                      >
                        <Laptop size={40} color="#FF5A1F" />
                      </div>
                      <p className="fw-semibold text-dark">Connect Family</p>
                    </div>
                    <div
                      className="d-none d-md-block fs-2 mx-3"
                      style={{ color: "#FF5A1F" }}
                    >
                      →
                    </div>
                    <div className="text-center mb-4 mb-md-0">
                      <div
                        className="bg-white rounded-circle p-3 shadow-sm d-inline-flex align-items-center justify-content-center mb-3 step-icon"
                        style={{ width: "80px", height: "80px" }}
                      >
                        <Map size={40} color="#FF5A1F" />
                      </div>
                      <p className="fw-semibold text-dark">Find Safety</p>
                    </div>
                    <div
                      className="d-none d-md-block fs-2 mx-3"
                      style={{ color: "#FF5A1F" }}
                    >
                      →
                    </div>
                    <div className="text-center">
                      <div
                        className="bg-white rounded-circle p-3 shadow-sm d-inline-flex align-items-center justify-content-center mb-3 step-icon"
                        style={{ width: "80px", height: "80px" }}
                      >
                        <ClipboardList size={40} color="#FF5A1F" />
                      </div>
                      <p className="fw-semibold text-dark">Be Prepared</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section
            className="py-5 bg-white"
            aria-labelledby="testimonial-heading"
          >
            <div className="container">
              <h2
                id="testimonial-heading"
                className="text-center display-5 fw-bold text-dark mb-5"
              >
                Trusted by Families
              </h2>
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="card border-0 shadow-sm h-100 testimonial-card">
                    <div className="card-body p-4">
                      <blockquote className="blockquote mb-0">
                        <p className="mb-3 fs-6">
                          "SafeLink gave us peace of mind during a typhoon. The
                          alerts and check-ins kept us connected."
                        </p>
                        <footer className="blockquote-footer">
                          <cite>Bautista, Z., Cavite</cite>
                        </footer>
                      </blockquote>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card border-0 shadow-sm h-100 testimonial-card">
                    <div className="card-body p-4">
                      <blockquote className="blockquote mb-0">
                        <p className="mb-3 fs-6">
                          "The evacuation maps were a lifesaver. We found a safe
                          zone quickly and easily."
                        </p>
                        <footer className="blockquote-footer">
                          <cite>Atienza, F., Manila</cite>
                        </footer>
                      </blockquote>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section
            className="py-5 text-white text-center"
            style={{ backgroundColor: "#FF5A1F" }}
            aria-labelledby="cta-heading"
          >
            <div className="container">
              <h2 id="cta-heading" className="display-5 fw-bold mb-4">
                Be Ready for Anything
              </h2>
              <p className="lead mb-4 fs-5">
                Protect your loved ones with SafeLink's all-in-one safety tools.
              </p>
              <button
                className="btn btn-light btn-lg fw-bold px-5 py-3 cta-btn"
                style={{ color: "#FF5A1F" }}
                onClick={() => handleButtonClick("/create-account")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Loading...
                  </>
                ) : (
                  "Get Started Now"
                )}
              </button>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-dark text-light py-4" role="contentinfo">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-md-6 d-flex align-items-center mb-3 mb-md-0">
                <BrandLogo safe="#FFFFFF" link="#FF5A1F" />
                <span className="ms-3">
                  Uniting families for safety and resilience.
                </span>
              </div>
              <div className="col-md-6">
                <div className="d-flex justify-content-md-end gap-4">
                  <a
                    href="#features"
                    className="text-light text-decoration-none footer-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleScrollTo("features");
                    }}
                  >
                    Features
                  </a>
                  <a
                    href="/contact"
                    className="text-light text-decoration-none footer-link"
                  >
                    Contact
                  </a>
                  <a
                    href="/privacy"
                    className="text-light text-decoration-none footer-link"
                  >
                    Privacy Policy
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
