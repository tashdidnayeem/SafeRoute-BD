import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/latestAlertPanel.css";

const API_BASE = import.meta.env.VITE_API_URL;
const STORAGE_MODE_KEY = "alertNotificationMode";

const LatestAlertPanel = () => {
  const [alertData, setAlertData] = useState(null);
  const [mode, setMode] = useState(
    localStorage.getItem(STORAGE_MODE_KEY) || "all"
  );
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLatestAlert = async () => {
      try {
        const response = await fetch(`${API_BASE}/alerts/latest`);
        const data = await response.json();
        setAlertData(data);
      } catch (error) {
        console.error("Failed to fetch latest alert:", error);
      }
    };

    fetchLatestAlert();
  }, []);

  useEffect(() => {
    const handleModeChange = () => {
      setMode(localStorage.getItem(STORAGE_MODE_KEY) || "all");
    };

    window.addEventListener("alert-mode-changed", handleModeChange);

    return () => {
      window.removeEventListener("alert-mode-changed", handleModeChange);
    };
  }, []);

  if (!alertData) return null;
  if (mode === "off") return null;
  if (mode === "high" && alertData.severity !== "High") return null;

  const severityClass =
    alertData.severity === "High"
      ? "alert-high"
      : alertData.severity === "Moderate"
      ? "alert-moderate"
      : "alert-low";

  return (
    <div className={`latest-alert-panel ${severityClass}`}>
      <div className="latest-alert-left">
        <h3>{alertData.title}</h3>
        <p>{alertData.description}</p>
          {alertData.location?.address && (
            <p className="alert-panel-location">📍 {alertData.location.address}</p>
          )}
        <span className="severity-tag">{alertData.severity} Alert</span>
      </div>

      <div className="latest-alert-right">
        <button type="button" onClick={() => navigate("/alerts")}>
          View All
        </button>
      </div>
    </div>
  );
};

export default LatestAlertPanel;