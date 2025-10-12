import { useState } from "react";
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
  Zap,
  Activity,
  Radio,
  Package,
  TrendingUp,
  Globe,
  ChevronRight,
} from "lucide-react";

const LandingPage = () => {
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
      window.location.href = path;
    }, 500);
  };

  const features = [
    {
      icon: Shield,
      title: "Family Safety Alerts",
      description:
        "Instant notifications during emergencies to keep your loved ones informed and safe.",
      color: "#FF5A1F",
      bgColor: "#fff5f1",
    },
    {
      icon: Users,
      title: "Family Connections",
      description:
        "Create family groups and stay connected with real-time status updates.",
      color: "#E63946",
      bgColor: "#ffe8e1",
    },
    {
      icon: MapPin,
      title: "Location Sharing",
      description:
        "Share your location with family members during emergencies.",
      color: "#22c55e",
      bgColor: "#f0fdf4",
    },
    {
      icon: Smartphone,
      title: "Mobile Ready",
      description: "Access SafeLink anywhere, anytime from your mobile device.",
      color: "#3b82f6",
      bgColor: "#eff6ff",
    },
  ];

  const testimonials = [
    {
      name: "Zeus Angelo Bautista",
      role: "Father of 3",
      content:
        "SafeLink gave us peace of mind during the typhoon. The alerts and check-ins kept us connected when we needed it most.",
      rating: 5,
      location: "Cavite",
    },
    {
      name: "Jesenhower Nachor",
      role: "Emergency Responder",
      content:
        "This app has revolutionized how families coordinate during crisis situations. A must-have for every Filipino family.",
      rating: 5,
      location: "Manila",
    },
    {
      name: "Moises Napicol",
      role: "Teacher",
      content:
        "Simple, effective, and reliable. SafeLink is exactly what every family needs for disaster preparedness.",
      rating: 5,
      location: "Quezon City",
    },
  ];

  const stats = [
    { number: "50K+", label: "Active Users", icon: Users },
    { number: "99.9%", label: "Uptime", icon: Activity },
    { number: "24/7", label: "Monitoring", icon: Clock },
    { number: "10K+", label: "Families Protected", icon: Heart },
  ];

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

          * {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }

          body {
            background: #ffffff;
            overflow-x: hidden;
          }

          .hero-gradient {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            position: relative;
            overflow: hidden;
          }

          .hero-gradient::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            opacity: 0.3;
          }

          .hero-gradient::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 200px;
            background: linear-gradient(to top, #ffffff, transparent);
          }

          .navbar-custom {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            box-shadow: 0 2px 20px rgba(0,0,0,0.08);
            position: sticky;
            top: 0;
            z-index: 1030;
            transition: all 0.3s ease;
          }

          .navbar-custom.scrolled {
            box-shadow: 0 4px 30px rgba(0,0,0,0.12);
          }

          .brand-logo {
            font-size: 1.75rem;
            font-weight: 900;
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: -0.5px;
          }

          .nav-link-custom {
            color: #475569;
            font-weight: 600;
            font-size: 0.95rem;
            padding: 0.75rem 1.25rem;
            border-radius: 12px;
            transition: all 0.3s ease;
            position: relative;
          }

          .nav-link-custom::before {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%) scaleX(0);
            width: 80%;
            height: 3px;
            background: linear-gradient(90deg, #FF5A1F, #E63946);
            border-radius: 3px 3px 0 0;
            transition: transform 0.3s ease;
          }

          .nav-link-custom:hover {
            color: #FF5A1F;
            background: linear-gradient(135deg, #fff5f1 0%, #ffe8e1 100%);
          }

          .nav-link-custom:hover::before {
            transform: translateX(-50%) scaleX(1);
          }

          .btn-primary-custom {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            border: none;
            color: white;
            padding: 0.875rem 2rem;
            border-radius: 14px;
            font-weight: 700;
            font-size: 1rem;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 8px 20px rgba(255, 90, 31, 0.3);
            position: relative;
            overflow: hidden;
          }

          .btn-primary-custom::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
          }

          .btn-primary-custom:hover::before {
            width: 300px;
            height: 300px;
          }

          .btn-primary-custom:hover {
            transform: translateY(-4px) scale(1.02);
            box-shadow: 0 12px 35px rgba(255, 90, 31, 0.4);
          }

          .btn-secondary-custom {
            background: white;
            border: 2px solid rgba(255,255,255,0.3);
            color: white;
            padding: 0.875rem 2rem;
            border-radius: 14px;
            font-weight: 700;
            font-size: 1rem;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
          }

          .btn-secondary-custom:hover {
            background: rgba(255,255,255,0.2);
            border-color: white;
            transform: translateY(-4px);
          }

          .hero-title {
            font-size: 4.5rem;
            font-weight: 900;
            letter-spacing: -2px;
            line-height: 1.1;
            margin-bottom: 1.5rem;
            animation: fadeInUp 0.8s ease-out;
          }

          .hero-subtitle {
            font-size: 1.5rem;
            font-weight: 400;
            line-height: 1.6;
            opacity: 0.95;
            animation: fadeInUp 1s ease-out;
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .hero-image {
            animation: float 6s ease-in-out infinite;
            position: relative;
            z-index: 2;
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }

          .feature-card {
            background: white;
            border-radius: 24px;
            padding: 2.5rem;
            border: 2px solid #e2e8f0;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            height: 100%;
            position: relative;
            overflow: hidden;
          }

          .feature-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #FF5A1F, #E63946);
            transform: scaleX(0);
            transition: transform 0.3s ease;
          }

          .feature-card:hover::before {
            transform: scaleX(1);
          }

          .feature-card:hover {
            transform: translateY(-12px);
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
            border-color: #FF5A1F;
          }

          .feature-icon-wrapper {
            width: 80px;
            height: 80px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.5rem;
            transition: transform 0.3s ease;
          }

          .feature-card:hover .feature-icon-wrapper {
            transform: scale(1.1) rotate(5deg);
          }

          .stat-card {
            background: white;
            border-radius: 20px;
            padding: 2rem;
            text-align: center;
            box-shadow: 0 8px 30px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
            border: 2px solid #e2e8f0;
          }

          .stat-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
            border-color: #FF5A1F;
          }

          .stat-number {
            font-size: 3rem;
            font-weight: 900;
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1;
            margin-bottom: 0.5rem;
          }

          .stat-label {
            font-size: 1rem;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .step-card {
            background: white;
            border-radius: 24px;
            padding: 2rem;
            box-shadow: 0 8px 30px rgba(0,0,0,0.08);
            position: relative;
            transition: all 0.3s ease;
          }

          .step-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          }

          .step-number {
            position: absolute;
            top: -20px;
            left: 30px;
            width: 50px;
            height: 50px;
            border-radius: 15px;
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 1.5rem;
            color: white;
            box-shadow: 0 8px 20px rgba(255, 90, 31, 0.3);
          }

          .step-icon-wrapper {
            width: 80px;
            height: 80px;
            border-radius: 20px;
            background: linear-gradient(135deg, #fff5f1 0%, #ffe8e1 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            transition: transform 0.3s ease;
          }

          .step-card:hover .step-icon-wrapper {
            transform: scale(1.1) rotate(5deg);
          }

          .testimonial-card {
            background: white;
            border-radius: 24px;
            padding: 2.5rem;
            box-shadow: 0 8px 30px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
            height: 100%;
            border: 2px solid #e2e8f0;
            position: relative;
          }

          .testimonial-card::before {
            content: '"';
            position: absolute;
            top: 20px;
            left: 30px;
            font-size: 6rem;
            font-weight: 900;
            color: #fff5f1;
            line-height: 1;
            font-family: Georgia, serif;
          }

          .testimonial-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
            border-color: #FF5A1F;
          }

          .testimonial-content {
            position: relative;
            z-index: 1;
            font-size: 1.1rem;
            line-height: 1.7;
            color: #475569;
            margin-bottom: 1.5rem;
          }

          .testimonial-author {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .author-avatar {
            width: 60px;
            height: 60px;
            border-radius: 16px;
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 900;
            font-size: 1.5rem;
            box-shadow: 0 4px 14px rgba(255, 90, 31, 0.3);
          }

          .rating-stars {
            display: flex;
            gap: 0.25rem;
            margin-top: 0.5rem;
          }

          .cta-section {
            background: linear-gradient(135deg, #FF5A1F 0%, #E63946 100%);
            position: relative;
            overflow: hidden;
          }

          .cta-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            opacity: 0.3;
          }

          .footer-custom {
            background: #0f172a;
            color: #94a3b8;
          }

          .footer-link {
            color: #94a3b8;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
          }

          .footer-link:hover {
            color: #FF5A1F;
          }

          @media (max-width: 768px) {
            .hero-title {
              font-size: 2.5rem;
            }

            .hero-subtitle {
              font-size: 1.1rem;
            }

            .stat-number {
              font-size: 2rem;
            }

            .feature-card {
              padding: 2rem;
            }
          }
        `}
      </style>

      <div className="bg-white min-vh-100">
        {/* Navigation */}
        <nav className="navbar-custom">
          <div className="container py-3">
            <div className="d-flex justify-content-between align-items-center w-100">
              <div className="brand-logo">SafeLink</div>

              <div className="d-none d-lg-flex align-items-center gap-2">
                <a
                  href="#features"
                  className="nav-link-custom"
                  onClick={(e) => {
                    e.preventDefault();
                    handleScrollTo("features");
                  }}
                >
                  Features
                </a>
                <a
                  href="#how"
                  className="nav-link-custom"
                  onClick={(e) => {
                    e.preventDefault();
                    handleScrollTo("how");
                  }}
                >
                  How It Works
                </a>
                <a
                  href="#testimonials"
                  className="nav-link-custom"
                  onClick={(e) => {
                    e.preventDefault();
                    handleScrollTo("testimonials");
                  }}
                >
                  Testimonials
                </a>
                <a href="/login" className="nav-link-custom">
                  Log In
                </a>
                <button
                  className="btn-primary-custom"
                  onClick={() => handleButtonClick("/create-account")}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Get Started"}
                </button>
              </div>

              <button className="d-lg-none btn btn-link text-dark">
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero-gradient text-white py-5 position-relative">
          <div className="container py-5">
            <div className="row align-items-center py-5">
              <div className="col-lg-6 position-relative" style={{ zIndex: 2 }}>
                <h1 className="hero-title">
                  Stay Safe,
                  <br />
                  Stay Connected
                </h1>
                <p className="hero-subtitle mb-5">
                  Empower your family with real-time disaster alerts, safety
                  check-ins, and emergency planning tools.
                </p>
                <div className="d-flex gap-3 flex-wrap">
                  <button
                    className="btn-primary-custom"
                    onClick={() => handleButtonClick("/create-account")}
                    disabled={isLoading}
                    style={{
                      background: "white",
                      color: "#FF5A1F",
                      boxShadow: "0 8px 30px rgba(255,255,255,0.3)",
                    }}
                  >
                    Get Started Free
                    <ArrowRight
                      size={20}
                      style={{ marginLeft: "0.5rem", verticalAlign: "middle" }}
                    />
                  </button>
                  <button
                    className="btn-secondary-custom"
                    onClick={() => handleButtonClick("/demo")}
                    disabled={isLoading}
                    style={{
                      background: "white",
                      color: "#FF5A1F",
                      boxShadow: "0 8px 30px rgba(255,255,255,0.3)",
                    }}
                  >
                    Watch Demo
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="d-flex gap-4 mt-5 flex-wrap">
                  <div className="d-flex align-items-center gap-2">
                    <CheckCircle size={20} />
                    <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                      Trusted by 50K+ Users
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Shield size={20} />
                    <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                      Bank-Level Security
                    </span>
                  </div>
                </div>
              </div>

              <div className="col-lg-6 text-center mt-5 mt-lg-0">
                <div className="hero-image">
                  <div
                    style={{
                      width: "500px",
                      height: "500px",
                      maxWidth: "100%",
                      margin: "0 auto",
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: "40px",
                      backdropFilter: "blur(20px)",
                      border: "2px solid rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                    }}
                  >
                    <Smartphone size={200} strokeWidth={1} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-5 bg-light">
          <div className="container">
            <div className="row g-4">
              {stats.map((stat, index) => (
                <div key={index} className="col-6 col-lg-3">
                  <div className="stat-card">
                    <stat.icon
                      size={40}
                      style={{ color: "#FF5A1F", marginBottom: "1rem" }}
                    />
                    <div className="stat-number">{stat.number}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-5 bg-white" id="features">
          <div className="container py-5">
            <div className="text-center mb-5">
              <h2
                style={{
                  fontSize: "3rem",
                  fontWeight: 900,
                  marginBottom: "1rem",
                  color: "#1a202c",
                }}
              >
                Why Choose SafeLink?
              </h2>
              <p
                style={{
                  fontSize: "1.25rem",
                  color: "#64748b",
                  maxWidth: "600px",
                  margin: "0 auto",
                }}
              >
                Everything you need to keep your family safe during emergencies
              </p>
            </div>

            <div className="row g-4">
              {features.map((feature, index) => (
                <div key={index} className="col-md-6 col-lg-3">
                  <div className="feature-card">
                    <div
                      className="feature-icon-wrapper"
                      style={{ background: feature.bgColor }}
                    >
                      <feature.icon
                        size={40}
                        style={{ color: feature.color }}
                      />
                    </div>
                    <h3
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        marginBottom: "1rem",
                        color: "#1a202c",
                      }}
                    >
                      {feature.title}
                    </h3>
                    <p
                      style={{
                        color: "#64748b",
                        lineHeight: 1.7,
                        fontSize: "1rem",
                      }}
                    >
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-5 bg-light" id="how">
          <div className="container py-5">
            <div className="text-center mb-5">
              <h2
                style={{
                  fontSize: "3rem",
                  fontWeight: 900,
                  marginBottom: "1rem",
                  color: "#1a202c",
                }}
              >
                How SafeLink Works
              </h2>
              <p
                style={{
                  fontSize: "1.25rem",
                  color: "#64748b",
                  maxWidth: "600px",
                  margin: "0 auto",
                }}
              >
                Four simple steps to protect your family
              </p>
            </div>

            <div className="row g-4">
              {[
                {
                  icon: Bell,
                  title: "Get Instant Alerts",
                  description:
                    "Receive real-time notifications about disasters and emergencies in your area",
                },
                {
                  icon: Users,
                  title: "Connect Your Family",
                  description:
                    "Create family groups and invite members to join your safety network",
                },
                {
                  icon: MapPin,
                  title: "Share Location",
                  description:
                    "Automatically share your location during emergencies so family knows you're safe",
                },
                {
                  icon: Package,
                  title: "Stay Prepared",
                  description:
                    "Access emergency checklists and evacuation centers nearby",
                },
              ].map((step, index) => (
                <div key={index} className="col-md-6 col-lg-3">
                  <div className="step-card text-center">
                    <div className="step-number">{index + 1}</div>
                    <div className="step-icon-wrapper">
                      <step.icon size={40} style={{ color: "#FF5A1F" }} />
                    </div>
                    <h3
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: 700,
                        marginBottom: "0.75rem",
                        color: "#1a202c",
                      }}
                    >
                      {step.title}
                    </h3>
                    <p
                      style={{
                        color: "#64748b",
                        lineHeight: 1.6,
                        fontSize: "0.95rem",
                      }}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-5 bg-white" id="testimonials">
          <div className="container py-5">
            <div className="text-center mb-5">
              <h2
                style={{
                  fontSize: "3rem",
                  fontWeight: 900,
                  marginBottom: "1rem",
                  color: "#1a202c",
                }}
              >
                Trusted by Families
              </h2>
              <p
                style={{
                  fontSize: "1.25rem",
                  color: "#64748b",
                  maxWidth: "600px",
                  margin: "0 auto",
                }}
              >
                See what families are saying about SafeLink
              </p>
            </div>

            <div className="row g-4">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="col-lg-4">
                  <div className="testimonial-card">
                    <div className="testimonial-content">
                      {testimonial.content}
                    </div>
                    <div className="testimonial-author">
                      <div className="author-avatar">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "1.1rem",
                            color: "#1a202c",
                          }}
                        >
                          {testimonial.name}
                        </div>
                        <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                          {testimonial.role} • {testimonial.location}
                        </div>
                        <div className="rating-stars">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              fill="#FF5A1F"
                              color="#FF5A1F"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section text-white text-center py-5 position-relative">
          <div
            className="container py-5 position-relative"
            style={{ zIndex: 2 }}
          >
            <h2
              style={{
                fontSize: "3.5rem",
                fontWeight: 900,
                marginBottom: "1.5rem",
              }}
            >
              Ready to Protect Your Family?
            </h2>
            <p
              style={{
                fontSize: "1.5rem",
                marginBottom: "3rem",
                opacity: 0.95,
                maxWidth: "700px",
                margin: "0 auto 3rem",
              }}
            >
              Join thousands of families who trust SafeLink for emergency
              preparedness
            </p>
            <button
              className="btn-primary-custom"
              onClick={() => handleButtonClick("/create-account")}
              disabled={isLoading}
              style={{
                background: "white",
                color: "#FF5A1F",
                fontSize: "1.25rem",
                padding: "1.25rem 3rem",
                boxShadow: "0 12px 40px rgba(255,255,255,0.3)",
              }}
            >
              Get Started Free
              <ArrowRight
                size={24}
                style={{ marginLeft: "0.75rem", verticalAlign: "middle" }}
              />
            </button>
            <div className="mt-4" style={{ fontSize: "1rem", opacity: 0.9 }}>
              No credit card required • Free forever
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer-custom py-5">
          <div className="container">
            <div className="row g-4">
              <div className="col-lg-4">
                <div className="brand-logo mb-3" style={{ color: "white" }}>
                  SafeLink
                </div>
                <p style={{ color: "#64748b", lineHeight: 1.7 }}>
                  Uniting families for safety and resilience during emergencies.
                </p>
                <div className="d-flex gap-3 mt-4">
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "#1e293b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <Globe size={20} color="#94a3b8" />
                  </div>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "#1e293b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <Shield size={20} color="#94a3b8" />
                  </div>
                </div>
              </div>

              <div className="col-lg-2 col-6">
                <h4
                  style={{
                    color: "white",
                    fontSize: "1rem",
                    fontWeight: 700,
                    marginBottom: "1.5rem",
                  }}
                >
                  Product
                </h4>
                <div className="d-flex flex-column gap-2">
                  <a
                    href="#features"
                    className="footer-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleScrollTo("features");
                    }}
                  >
                    Features
                  </a>
                  <a
                    href="#how"
                    className="footer-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleScrollTo("how");
                    }}
                  >
                    How It Works
                  </a>
                  <a href="/pricing" className="footer-link">
                    Pricing
                  </a>
                  <a href="/demo" className="footer-link">
                    Demo
                  </a>
                </div>
              </div>

              <div className="col-lg-2 col-6">
                <h4
                  style={{
                    color: "white",
                    fontSize: "1rem",
                    fontWeight: 700,
                    marginBottom: "1.5rem",
                  }}
                >
                  Company
                </h4>
                <div className="d-flex flex-column gap-2">
                  <a href="/about" className="footer-link">
                    About Us
                  </a>
                  <a href="/contact" className="footer-link">
                    Contact
                  </a>
                  <a href="/careers" className="footer-link">
                    Careers
                  </a>
                  <a href="/blog" className="footer-link">
                    Blog
                  </a>
                </div>
              </div>

              <div className="col-lg-2 col-6">
                <h4
                  style={{
                    color: "white",
                    fontSize: "1rem",
                    fontWeight: 700,
                    marginBottom: "1.5rem",
                  }}
                >
                  Resources
                </h4>
                <div className="d-flex flex-column gap-2">
                  <a href="/help" className="footer-link">
                    Help Center
                  </a>
                  <a href="/guides" className="footer-link">
                    Guides
                  </a>
                  <a href="/api" className="footer-link">
                    API Docs
                  </a>
                  <a href="/status" className="footer-link">
                    System Status
                  </a>
                </div>
              </div>

              <div className="col-lg-2 col-6">
                <h4
                  style={{
                    color: "white",
                    fontSize: "1rem",
                    fontWeight: 700,
                    marginBottom: "1.5rem",
                  }}
                >
                  Legal
                </h4>
                <div className="d-flex flex-column gap-2">
                  <a href="/privacy" className="footer-link">
                    Privacy Policy
                  </a>
                  <a href="/terms" className="footer-link">
                    Terms of Service
                  </a>
                  <a href="/cookies" className="footer-link">
                    Cookie Policy
                  </a>
                  <a href="/security" className="footer-link">
                    Security
                  </a>
                </div>
              </div>
            </div>

            <hr style={{ borderColor: "#1e293b", margin: "3rem 0" }} />

            <div className="row align-items-center">
              <div className="col-md-6">
                <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0 }}>
                  © 2024 SafeLink. All rights reserved.
                </p>
              </div>
              <div className="col-md-6 text-md-end mt-3 mt-md-0">
                <div className="d-flex justify-content-md-end gap-4">
                  <a
                    href="/privacy"
                    className="footer-link"
                    style={{ fontSize: "0.9rem" }}
                  >
                    Privacy
                  </a>
                  <a
                    href="/terms"
                    className="footer-link"
                    style={{ fontSize: "0.9rem" }}
                  >
                    Terms
                  </a>
                  <a
                    href="/cookies"
                    className="footer-link"
                    style={{ fontSize: "0.9rem" }}
                  >
                    Cookies
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
