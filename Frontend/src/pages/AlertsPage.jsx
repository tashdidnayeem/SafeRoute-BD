import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/alertsPage.css";
import alertMap from "../assets/feature-bg/alertMap.png";

const API_BASE = import.meta.env.VITE_API_URL;

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch(`${API_BASE}/alerts`);
        const data = await response.json();
        setAlerts(data);
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
      }
    };

    fetchAlerts();
  }, []);

  const getSeverityClass = (severity) => {
    if (severity === "High") return "alert-card high";
    if (severity === "Moderate") return "alert-card moderate";
    return "alert-card low";
  };

  const getSeverityBadgeClass = (severity) => {
    if (severity === "High") return "severity-badge high";
    if (severity === "Moderate") return "severity-badge moderate";
    return "severity-badge low";
  };

  return (
    <div className="alerts-page">
      <div className="alerts-page-overlay">
        <section className="alerts-hero">
          <div className="alerts-hero-text">
            <span className="alerts-mini-tag">Public Safety Updates</span>
            <h1>All Active Alerts</h1>
            <p>
              View all currently active public safety alerts published by admins.
              Stay updated on road risks, congestion, and urgent travel warnings.
            </p>

            <button
              className="alerts-back-btn"
              onClick={() => navigate("/")}
            >
              Back to Homepage
            </button>
          </div>

          <div className="alerts-hero-image-wrap">
            <img src={alertMap} alt="Alerts Map" className="alerts-hero-image" />
          </div>
        </section>

        <section className="alerts-list-section">
          <div className="alerts-list-head">
            <h2>Current Alerts</h2>
            <span className="alerts-count">{alerts.length} active</span>
          </div>

          {alerts.length === 0 ? (
            <div className="empty-alerts">
              <h3>No active alerts right now</h3>
              <p>Everything looks calm at the moment.</p>
            </div>
          ) : (
            <div className="alerts-grid">
              {alerts.map((alert) => (
                <div key={alert._id} className={getSeverityClass(alert.severity)}>
                  <div className="alert-card-top">
                    <span className={getSeverityBadgeClass(alert.severity)}>
                      {alert.severity}
                    </span>
                    <span className="alert-expiry">
                      Expires: {new Date(alert.expiresAt).toLocaleString()}
                    </span>
                  </div>

                  <h3>{alert.title}</h3>
                  <p>{alert.description}</p>
                  {alert.location?.address && (
                    <p className="alert-location">
                      📍 {alert.location.address}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AlertsPage;