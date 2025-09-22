import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle,
  Map,
  ClipboardList,
  Bell,
  Laptop,
} from "lucide-react";
import "../styles/LandingPage.css";
import BrandLogo from "../components/BrandLogo";
import HeroIcon from "../assets/hero-devices.png";

const LandingPage = () => {
  const navigate = useNavigate();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  const handleScrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsNavOpen(false); // Close mobile menu after clicking
    }
  };

  const handleButtonClick = (path) => {
    setIsLoading(true);
    setTimeout(() => {
      navigate(path);
      setIsLoading(false);
    }, 500); // Simulate loading for UX
  };

  return (
    <div className="lp-root">
      {/* Skip to Content Link */}
      <a href="#main-content" className="lp-skip-link">
        Skip to content
      </a>

      {/* Header */}
      <header className="lp-header" role="banner">
        <div className="lp-header-left">
          <BrandLogo safe="#1A1A1A" link="#FF5A1F" />
        </div>
        <button
          className="lp-nav-toggle"
          onClick={toggleNav}
          aria-label={
            isNavOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={isNavOpen}
        >
          {isNavOpen ? "✕" : "☰"}
        </button>
        <nav className={`lp-nav ${isNavOpen ? "open" : ""}`} role="navigation">
          <a
            href="#features"
            aria-current={
              window.location.hash === "#features" ? "page" : undefined
            }
            onClick={(e) => {
              e.preventDefault();
              handleScrollTo("features");
            }}
          >
            Features
          </a>
          <a
            href="#how"
            aria-current={window.location.hash === "#how" ? "page" : undefined}
            onClick={(e) => {
              e.preventDefault();
              handleScrollTo("how");
            }}
          >
            How It Works
          </a>
          <a href="/login">Log In</a>
          <button
            className="lp-nav-btn lp-create-btn"
            onClick={() => handleButtonClick("/create-account")}
            aria-label="Create Account"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Create Account"}
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main id="main-content">
        <section className="lp-hero" aria-labelledby="hero-heading">
          <div className="lp-hero-position">
            <div className="lp-hero-content">
              <h1 id="hero-heading">Stay Safe, Stay Connected</h1>
              <p>
                Empower your family with real-time disaster alerts, safety
                check-ins, evacuation maps, and essential planning tools.
              </p>
              <div className="lp-hero-actions">
                <button
                  className="lp-cta-btn"
                  onClick={() => handleButtonClick("/create-account")}
                  aria-label="Get Started with SafeLink"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Get Started"}
                </button>
                <button
                  className="lp-cta-btn lp-demo-btn"
                  onClick={() => handleButtonClick("/demo")}
                  aria-label="Watch SafeLink Demo"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Watch Demo"}
                </button>
              </div>
            </div>
          </div>
          <div className="lp-hero-img">
            <img
              src={HeroIcon}
              alt="SafeLink app on mobile and desktop devices"
              loading="lazy"
              width="400"
              height="300"
            />
          </div>
        </section>

        {/* Features Section */}
        <section
          className="lp-features"
          id="features"
          aria-labelledby="features-heading"
        >
          <h2 id="features-heading" className="lp-section-title">
            Why Choose SafeLink?
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
              <p>Instant updates from PAGASA-PHIVOLCS for timely action.</p>
            </div>
            <div className="lp-feature-card" role="article">
              <CheckCircle
                className="lp-feature-icon"
                aria-label="Family Safe Check-in"
                size={48}
                color="#FF5A1F"
              />
              <h3>Family Check-In</h3>
              <p>Confirm your loved ones' safety with one tap.</p>
            </div>
            <div className="lp-feature-card" role="article">
              <Map
                className="lp-feature-icon"
                aria-label="Evacuation Center Map"
                size={48}
                color="#FF5A1F"
              />
              <h3>Evacuation Maps</h3>
              <p>Find the nearest safe zones instantly.</p>
            </div>
            <div className="lp-feature-card" role="article">
              <ClipboardList
                className="lp-feature-icon"
                aria-label="Go-Bag Checklist"
                size={48}
                color="#FF5A1F"
              />
              <h3>Go-Bag Checklist</h3>
              <p>Prepare with an auto-generated emergency kit.</p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="lp-how" id="how" aria-labelledby="how-heading">
          <h2 id="how-heading" className="lp-section-title">
            How SafeLink Protects You
          </h2>
          <div className="lp-how-steps">
            <div className="lp-how-step" role="listitem">
              <Bell
                className="lp-how-icon"
                aria-label="Receive Alerts"
                size={40}
                color="#FF5A1F"
              />
              <span>Stay Informed</span>
            </div>
            <span className="lp-how-arrow">→</span>
            <div className="lp-how-step" role="listitem">
              <Laptop
                className="lp-how-icon"
                aria-label="Check In Family"
                size={40}
                color="#FF5A1F"
              />
              <span>Connect Family</span>
            </div>
            <span className="lp-how-arrow">→</span>
            <div className="lp-how-step" role="listitem">
              <Map
                className="lp-how-icon"
                aria-label="Find Evacuation"
                size={40}
                color="#FF5A1F"
              />
              <span>Find Safety</span>
            </div>
            <span className="lp-how-arrow">→</span>
            <div className="lp-how-step" role="listitem">
              <ClipboardList
                className="lp-how-icon"
                aria-label="Plan With Go-Bag"
                size={40}
                color="#FF5A1F"
              />
              <span>Be Prepared</span>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section
          className="lp-testimonial"
          aria-labelledby="testimonial-heading"
        >
          <h2 id="testimonial-heading" className="lp-section-title">
            Trusted by Families
          </h2>
          <div className="lp-testimonial-grid">
            <blockquote>
              <p>
                "SafeLink gave us peace of mind during a typhoon. The alerts and
                check-ins kept us connected."
              </p>
              <cite>— Bautista, Z., Cavite</cite>
            </blockquote>
            <blockquote>
              <p>
                "The evacuation maps were a lifesaver. We found a safe zone
                quickly and easily."
              </p>
              <cite>— Atienza, F., Manila</cite>
            </blockquote>
          </div>
        </section>

        {/* CTA Section */}
        <section className="lp-cta" aria-labelledby="cta-heading">
          <h2 id="cta-heading" className="lp-section-title lp-cta-title">
            Be Ready for Anything
          </h2>
          <p>
            Protect your loved ones with SafeLink’s all-in-one safety tools.
          </p>
          <button
            className="lp-cta-btn"
            onClick={() => handleButtonClick("/create-account")}
            aria-label="Get Started with SafeLink Now"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Get Started Now"}
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="lp-footer" role="contentinfo">
        <div className="lp-footer-left">
          <BrandLogo safe="#1A1A1A" link="#FF5A1F" />
          <span className="lp-footer-tagline">
            Uniting families for safety and resilience.
          </span>
        </div>
        <div className="lp-footer-links">
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              handleScrollTo("features");
            }}
          >
            Features
          </a>
          <a href="/contact">Contact</a>
          <a href="/privacy">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
