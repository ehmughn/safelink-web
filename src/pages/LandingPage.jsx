import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle,
  Map,
  ClipboardList,
  Bell,
  Laptop,
  Smartphone,
} from "lucide-react";
import "../styles/LandingPage.css";
import BrandLogo from "../components/BrandLogo";
import HeroIcon from "../assets/hero-devices.png";

const LandingPage = () => {
  const navigate = useNavigate();
  const [isNavOpen, setIsNavOpen] = useState(false);

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  return (
    <div className="lp-root">
      {/* Header */}
      <header className="lp-header" role="banner">
        <div className="lp-header-left">
          <BrandLogo safe="#1A1A1A" link="#FF5A1F" />
        </div>
        <button
          className="lp-nav-toggle"
          onClick={toggleNav}
          aria-label="Toggle navigation menu"
          aria-expanded={isNavOpen}
        >
          ☰
        </button>
        <nav className={`lp-nav ${isNavOpen ? "open" : ""}`} role="navigation">
          <a href="#features">Features</a>
          <a href="#how">How It Works</a>
          <a href="/login">Log In</a>
          <button
            className="lp-nav-btn lp-create-btn"
            onClick={() => navigate("/create-account")}
            aria-label="Create Account"
          >
            Create Account
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="lp-hero" aria-labelledby="hero-heading">
        <div className="lp-hero-position">
          <div className="lp-hero-content">
            <h1 id="hero-heading">Disaster Preparedness & Family Safety</h1>
            <p>
              Stay safe and connected with real-time alerts, family check-ins,
              evacuation maps, and emergency planning tools.
            </p>
            <div className="lp-hero-actions">
              <button
                className="lp-cta-btn"
                onClick={() => navigate("/create-account")}
                aria-label="Get Started"
              >
                Get Started
              </button>
              <button className="lp-cta-btn lp-demo-btn" aria-label="See Demo">
                See Demo
              </button>
            </div>
          </div>
        </div>
        <div className="lp-hero-img">
          <img src={HeroIcon} alt="SafeLink Devices" loading="lazy" />
        </div>
      </section>

      {/* Features Section */}
      <section
        className="lp-features"
        id="features"
        aria-labelledby="features-heading"
      >
        <h2 id="features-heading" className="lp-section-title">
          Key Features
        </h2>
        <div className="lp-features-grid">
          <div className="lp-feature-card" role="article">
            <AlertTriangle
              className="lp-feature-icon"
              aria-label="Real-Time Alerts"
              size={48}
              color="#FF5A1F"
            />
            <h3>Real-Time Alerts</h3>
            <p>Receive instant updates from PAGASA-PHIVOLCS.</p>
          </div>
          <div className="lp-feature-card" role="article">
            <CheckCircle
              className="lp-feature-icon"
              aria-label="Family Safe Check-in"
              size={48}
              color="#FF5A1F"
            />
            <h3>Family Check-In</h3>
            <p>Quickly confirm safety with one-tap check-ins.</p>
          </div>
          <div className="lp-feature-card" role="article">
            <Map
              className="lp-feature-icon"
              aria-label="Evacuation Center Map"
              size={48}
              color="#FF5A1F"
            />
            <h3>Evacuation Maps</h3>
            <p>Locate the nearest safe evacuation zones.</p>
          </div>
          <div className="lp-feature-card" role="article">
            <ClipboardList
              className="lp-feature-icon"
              aria-label="Go-Bag Checklist"
              size={48}
              color="#FF5A1F"
            />
            <h3>Go-Bag Checklist</h3>
            <p>Auto-generated emergency kit checklist.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="lp-how" id="how" aria-labelledby="how-heading">
        <h2 id="how-heading" className="lp-section-title">
          How It Works
        </h2>
        <div className="lp-how-steps">
          <div className="lp-how-step" role="listitem">
            <Bell
              className="lp-how-icon"
              aria-label="Receive Alerts"
              size={40}
              color="#FF5A1F"
            />
            <span>Receive Alerts</span>
          </div>
          <span className="lp-how-arrow">→</span>
          <div className="lp-how-step" role="listitem">
            <Laptop
              className="lp-how-icon"
              aria-label="Check In Family"
              size={40}
              color="#FF5A1F"
            />
            <span>Check In Family</span>
          </div>
          <span className="lp-how-arrow">→</span>
          <div className="lp-how-step" role="listitem">
            <Map
              className="lp-how-icon"
              aria-label="Find Evacuation"
              size={40}
              color="#FF5A1F"
            />
            <span>Find Evacuation</span>
          </div>
          <span className="lp-how-arrow">→</span>
          <div className="lp-how-step" role="listitem">
            <ClipboardList
              className="lp-how-icon"
              aria-label="Plan With Go-Bag"
              size={40}
              color="#FF5A1F"
            />
            <span>Plan With Go-Bag</span>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="lp-testimonial" aria-labelledby="testimonial-heading">
        <h2 id="testimonial-heading" className="lp-section-title">
          What Our Users Say
        </h2>
        <blockquote>
          <p>
            "SafeLink helped my family stay connected during a typhoon. We knew
            where to go and felt reassured."
          </p>
          <cite>— Bautista, Z., Cavite</cite>
        </blockquote>
      </section>

      {/* CTA Section */}
      <section className="lp-cta" aria-labelledby="cta-heading">
        <h2 id="cta-heading" className="lp-section-title lp-cta-title">
          Prepare Today
        </h2>
        <p>Every second counts. Protect your family with SafeLink.</p>
        <button
          className="lp-cta-btn"
          onClick={() => navigate("/create-account")}
          aria-label="Get Started Now"
        >
          Get Started Now
        </button>
      </section>

      {/* Footer */}
      <footer className="lp-footer" role="contentinfo">
        <div className="lp-footer-left">
          <BrandLogo safe="#1A1A1A" link="#FF5A1F" />
          <span className="lp-footer-tagline">
            Uniting families and communities for safety and communication.
          </span>
        </div>
        <div className="lp-footer-links">
          <a href="#features">Features</a>
          <a href="#">Contact</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
