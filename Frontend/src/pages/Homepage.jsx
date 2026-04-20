import React from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import logo from "../assets/Saferoute_Logo.png";
import { useAuth } from "../context/AuthContext";
import "../styles/home.css";

import mapImg from "../assets/feature-bg/map.png";
import reportImg from "../assets/feature-bg/report.png";
import historyImg from "../assets/feature-bg/history.png";
import qrImg from "../assets/feature-bg/qr.png";
import alertsImg from "../assets/feature-bg/alertMap.png";

import LatestAlertPanel from "../components/LatestAlertPanel";
import AlertNotifications from "../components/AlertNotifications";

const Homepage = () => {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    signOut();
    navigate("/login");
  };

  return (
    <div className="home-page">
      <div className="home-overlay">
        <section className="hero-card">
          <div className="hero-glow hero-glow-1"></div>
          <div className="hero-glow hero-glow-2"></div>

          <div className="hero-top">
            <div className="hero-tags">
              <span>Bangladesh Road Safety</span>
              <span>Community Reporting</span>
              <span>Map Heat Zones</span>
              <span>QR Vehicle Ratings</span>
            </div>

            <div className="hero-user">
              <span className="user-pill">
                Logged in as {user?.name || "User"}
              </span>

              <AlertNotifications />

              {user?.role === "admin" && (
                <button
                  className="gradient-btn small-btn"
                  onClick={() => navigate("/admin")}
                >
                  Admin Panel
                </button>
              )}

              <button className="gradient-btn small-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>

          <div className="hero-main">
            <div className="hero-text">
              <div className="brand-row">
                <img src={logo} alt="SafeRoute BD Logo" className="brand-logo" />
                <div>
                  <h1>SafeRoute BD</h1>
                  <p className="hero-welcome">
                    Welcome back, {user?.name || "User"}
                  </p>
                </div>
              </div>

              <p className="hero-description">
                Report unsafe roads, view hotspots on an interactive map, and
                improve accountability through community verification and driver
                ratings. Built for faster reporting and safer journeys across
                Bangladesh.
              </p>
            </div>
          </div>
        </section>

        <LatestAlertPanel />

        <section className="feature-summary">
          <div className="summary-item">
            <h4>Map Zones</h4>
            <strong>Red / Yellow / Green</strong>
            <p>Visual risk overview by severity.</p>
          </div>

          <div className="summary-item">
            <h4>Clickable Markers</h4>
            <strong>Issue Details</strong>
            <p>Type, time, and status on click.</p>
          </div>

          <div className="summary-item">
            <h4>Smart Filters</h4>
            <strong>City • Category</strong>
            <p>Find reports faster in your area.</p>
          </div>

          <div className="summary-item">
            <h4>Community Ratings</h4>
            <strong>QR Profiles</strong>
            <p>Local transport ratings and history.</p>
          </div>
        </section>

        <section className="feature-grid">
          <div className="feature-card large">
            <img src={mapImg} className="feature-bg" alt="Map Feature" />
            <div className="feature-content">
              <h3>Interactive Safety Map</h3>
              <p>
                See unsafe areas instantly with color-coded zones and markers
                based on severity and verification.
              </p>
              <button
                className="gradient-btn"
                onClick={() => navigate("/map-test")}
              >
                Explore Map
              </button>
            </div>
          </div>

          <div className="feature-card large">
            <img src={reportImg} className="feature-bg" alt="Report Feature" />
            <div className="feature-content">
              <h3>Report an Incident</h3>
              <p>
                Submit road safety issues and let admins review reports to keep
                information trustworthy.
              </p>
              <div className="report-buttons">
                <Link to="/report">
                  <button className="gradient-btn">Create Report</button>
                </Link>
              </div>
            </div>
          </div>

          <div className="feature-card large">
            <img src={historyImg} className="feature-bg" alt="History Feature" />
            <div className="feature-content">
              <h3>Report History</h3>
              <p>
                View all previously submitted reports and track their status in
                real time.
              </p>
              <div className="history-buttons">
                <Link to="/reports">
                  <button className="feature-btn">View My Reports</button>
                </Link>
              </div>
            </div>
          </div>

          <div className="feature-card qr-card">
            <img src={qrImg} className="feature-bg" alt="QR Feature" />
            <div className="feature-content">
              <h3>QR Transport Profiles</h3>
              <p>
                Scan QR to view a driver's community rating, vehicle safety
                score, and report history.
              </p>
              <button
                className="gradient-btn"
                onClick={() => navigate("/scan")}
              >
                Open QR
              </button>
            </div>
          </div>

          <div className="feature-card alert-card">
            <img src={alertsImg} className="feature-bg" alt="Alerts Feature" />
            <div className="feature-content">
              <h3>Alert Updates</h3>
              <p>
                Read road safety tips and alert updates published by admins.
              </p>
              <button
                className="gradient-btn"
                onClick={() => navigate("/alerts")}
              >
                View Alerts
              </button>
            </div>
          </div>
        </section>

        <section className="how-section">
          <div className="section-head">
            <h2>How it works</h2>
            <p>
              A simple flow designed for quick reporting and meaningful
              community insight.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <span className="step-badge">Step 1</span>
              <h3>Report</h3>
              <p>Submit a safety issue with location and severity.</p>
            </div>

            <div className="step-card">
              <span className="step-badge">Step 2</span>
              <h3>Review</h3>
              <p>Reports appear in lists and on the map instantly.</p>
            </div>

            <div className="step-card">
              <span className="step-badge">Step 3</span>
              <h3>Verify</h3>
              <p>Admins verify to reduce misinformation.</p>
            </div>

            <div className="step-card">
              <span className="step-badge">Step 4</span>
              <h3>Act</h3>
              <p>Use data to plan safer routes and raise awareness.</p>
            </div>
          </div>
        </section>

        <section className="feedback-section">
          <div className="feedback-top">
            <div>
              <h2>Feedback & Transport Rating</h2>
              <p>
                Rate the platform, open transport profiles, and test the QR-based
                vehicle flow.
              </p>
            </div>

            <div className="feedback-actions">
              <button
                className="gradient-btn small-btn"
                onClick={() => navigate("/feedback")}
              >
                Platform Feedback
              </button>
              <button
                className="gradient-btn small-btn"
                onClick={() => navigate("/vehicles")}
              >
                Vehicle Profiles
              </button>
            </div>
          </div>

          <div className="feedback-grid">
            <div className="feedback-card">
              <div className="feedback-header">
                <h4>Vehicle Profile</h4>
                <span>QR Ready</span>
              </div>
              <p>
                Each vehicle page now shows name, route, city, and average safety
                score with a generated QR code.
              </p>
            </div>

            <div className="feedback-card">
              <div className="feedback-header">
                <h4>Passenger Rating</h4>
                <span>Live Score</span>
              </div>
              <p>
                Passengers can rate driver behavior, vehicle condition, and
                cleanliness after scanning the QR code.
              </p>
            </div>

            <div className="feedback-card">
              <div className="feedback-header">
                <h4>Platform Review</h4>
                <span>Usability</span>
              </div>
              <p>
                Users can submit overall feedback on platform experience,
                usability, and safety feature effectiveness.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Homepage;