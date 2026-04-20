import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import "../styles/alertNotifications.css";

const API_BASE = import.meta.env.VITE_API_URL;

const STORAGE_MODE_KEY = "alertNotificationMode";
const STORAGE_UNREAD_KEY = "alertNotificationUnread";
const STORAGE_LIST_KEY = "alertNotificationList";
const STORAGE_SEEN_IDS_KEY = "alertNotificationSeenIds";

const AlertNotifications = () => {
  const navigate = useNavigate();
  const bellRef = useRef(null);
  const panelRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const [mode, setMode] = useState(
    localStorage.getItem(STORAGE_MODE_KEY) || "all"
  );

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem(STORAGE_LIST_KEY);
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [unreadCount, setUnreadCount] = useState(() =>
    Number(localStorage.getItem(STORAGE_UNREAD_KEY) || 0)
  );

  const [showPanel, setShowPanel] = useState(false);
  const [toastAlert, setToastAlert] = useState(null);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    localStorage.setItem(STORAGE_MODE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_LIST_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_UNREAD_KEY, String(unreadCount));
  }, [unreadCount]);

  // Initial fetch so badge works even after refresh / returning later
  useEffect(() => {
    const loadExistingAlerts = async () => {
      try {
        const response = await fetch(`${API_BASE}/alerts`);
        const data = await response.json();

        if (!Array.isArray(data)) return;

        const seenIds = JSON.parse(
          localStorage.getItem(STORAGE_SEEN_IDS_KEY) || "[]"
        );

        const filteredByMode =
          mode === "off"
            ? []
            : mode === "high"
            ? data.filter((item) => item.severity === "High")
            : data;

        const newestTen = filteredByMode.slice(0, 10);

        setNotifications(newestTen);

        const unseen = newestTen.filter((item) => !seenIds.includes(item._id));
        setUnreadCount(unseen.length);
      } catch (error) {
        console.error("Failed to load existing alerts:", error);
      }
    };

    loadExistingAlerts();
  }, [mode]);

  useEffect(() => {
    const handleNewAlert = (alert) => {
      console.log("Received new alert:", alert);

      const currentMode = localStorage.getItem(STORAGE_MODE_KEY) || "all";

      if (currentMode === "off") return;
      if (currentMode === "high" && alert.severity !== "High") return;

      setNotifications((prev) => {
        const exists = prev.some((item) => item._id === alert._id);
        if (exists) return prev;
        return [alert, ...prev].slice(0, 10);
      });

      setUnreadCount((prev) => prev + 1);
      setToastAlert(alert);

      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }

      toastTimeoutRef.current = setTimeout(() => {
        setToastAlert(null);
      }, 5000);
    };

    socket.on("new-alert", handleNewAlert);

    return () => {
      socket.off("new-alert", handleNewAlert);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const updatePanelPosition = () => {
    if (!bellRef.current) return;

    const rect = bellRef.current.getBoundingClientRect();
    const panelWidth = 340;
    const gap = 10;

    let left = rect.right - panelWidth;
    let top = rect.bottom + gap;

    if (left < 12) left = 12;
    if (left + panelWidth > window.innerWidth - 12) {
      left = window.innerWidth - panelWidth - 12;
    }

    setPanelPos({ top, left });
  };

  useEffect(() => {
    if (!showPanel) return;

    updatePanelPosition();

    const handleResize = () => updatePanelPosition();
    const handleScroll = () => updatePanelPosition();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showPanel]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const clickedBell = bellRef.current?.contains(event.target);
      const clickedPanel = panelRef.current?.contains(event.target);

      if (!clickedBell && !clickedPanel) {
        setShowPanel(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleBellClick = () => {
    if (!showPanel) {
      updatePanelPosition();
    }

    setShowPanel((prev) => !prev);

    // mark current notifications as seen
    const seenIds = notifications.map((item) => item._id);
    localStorage.setItem(STORAGE_SEEN_IDS_KEY, JSON.stringify(seenIds));

    setUnreadCount(0);
  };

  const updateMode = (newMode) => {
    setMode(newMode);
    localStorage.setItem(STORAGE_MODE_KEY, newMode);
    window.dispatchEvent(new Event("alert-mode-changed"));
  };

  const openAlertsPage = () => {
    const seenIds = notifications.map((item) => item._id);
    localStorage.setItem(STORAGE_SEEN_IDS_KEY, JSON.stringify(seenIds));

    setUnreadCount(0);
    setToastAlert(null);
    setShowPanel(false);
    navigate("/alerts");
  };

  const getToastClass = (severity) => {
    if (severity === "High") return "notification-toast high";
    if (severity === "Moderate") return "notification-toast moderate";
    return "notification-toast low";
  };

  const panel = showPanel
    ? createPortal(
        <div
          ref={panelRef}
          className="notification-portal-panel"
          style={{
            top: `${panelPos.top}px`,
            left: `${panelPos.left}px`,
          }}
        >
          <div className="notification-dropdown-header">
            <h4>Alert Notifications</h4>
          </div>

          <div className="notification-mode-group">
            <button
              type="button"
              className={`mode-btn ${mode === "all" ? "active" : ""}`}
              onClick={() => updateMode("all")}
            >
              All
            </button>

            <button
              type="button"
              className={`mode-btn ${mode === "high" ? "active" : ""}`}
              onClick={() => updateMode("high")}
            >
              High only
            </button>

            <button
              type="button"
              className={`mode-btn ${mode === "off" ? "active" : ""}`}
              onClick={() => updateMode("off")}
            >
              Off
            </button>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="notification-empty">No recent alerts</p>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  className={`notification-item ${item.severity.toLowerCase()}`}
                  onClick={openAlertsPage}
                >
                  <div className="notification-item-top">
                    <span className="notification-severity">
                      {item.severity}
                    </span>
                  </div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
              ))
            )}
          </div>

          <button
            type="button"
            className="view-all-alerts-btn"
            onClick={openAlertsPage}
          >
            View all alerts
          </button>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={bellRef}
        type="button"
        className="notification-bell"
        onClick={handleBellClick}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {panel}

      {toastAlert && (
        <div className={getToastClass(toastAlert.severity)}>
          <div className="toast-top">
            <span className="toast-label">{toastAlert.severity} Alert</span>
          </div>
          <h4>{toastAlert.title}</h4>
          <p>{toastAlert.description}</p>
          <button type="button" onClick={openAlertsPage}>
            View
          </button>
        </div>
      )}
    </>
  );
};

export default AlertNotifications;