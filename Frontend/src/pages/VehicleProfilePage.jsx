import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, buildQrImage, buildQrTarget } from "../utils/api";
import busImage from "../assets/prototype-vehicles/bus.png";
import trainImage from "../assets/prototype-vehicles/train.png";
import taxiImage from "../assets/prototype-vehicles/taxi.png";
import "../styles/vehiclePages.css";

const ratingFields = [
  { key: "driverBehavior",  label: "Driver behavior" },
  { key: "vehicleCondition", label: "Vehicle condition" },
  { key: "cleanliness",     label: "Cleanliness" },
];

const getPrototypeDisplay = (vehicle) => {
  const normalized = vehicle?.vehicleType?.toLowerCase?.() || "bus";
  if (normalized === "taxi")                     return { title: "Taxi",  image: taxiImage };
  if (["train", "metro"].includes(normalized))   return { title: "Train", image: trainImage };
  return { title: "Bus", image: busImage };
};

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString("en-BD", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const incidentSeverityLabel = (score) => {
  if (score < 1.5) return { label: "Critical",  color: "#b02020", bg: "#ffd4d4" };
  if (score < 2.0) return { label: "Severe",    color: "#c05000", bg: "#ffe0cc" };
  if (score < 2.5) return { label: "High",      color: "#b07a00", bg: "#fff3cc" };
  return             { label: "Moderate",  color: "#5a6e00", bg: "#eef5c0" };
};

const StarRow = ({ label, name, value, onChange }) => (
  <div className="vehicle-rating-row">
    <span className="vehicle-rating-label">{label}</span>
    <div className="vehicle-rating-stars" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`vehicle-rating-star ${star <= value ? "is-active" : ""}`}
          onClick={() => onChange(name, star)}
          aria-label={`${label}: ${star} star${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  </div>
);

const VehicleProfilePage = () => {
  const { id }            = useParams();
  const [searchParams]    = useSearchParams();
  const { user }          = useAuth();

  const [vehicle,        setVehicle]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [showQrCard,     setShowQrCard]     = useState(false);
  const [showIncidents,  setShowIncidents]  = useState(false);
  const [message,        setMessage]        = useState("");
  const [error,          setError]          = useState("");
  const [formData,       setFormData]       = useState({
    userName:        user?.name  || "",
    userEmail:       user?.email || "",
    driverBehavior:  5,
    vehicleCondition: 5,
    cleanliness:     5,
    comment:         "",
  });

  const qrDetected      = searchParams.get("source") === "qr";
  const localQrTarget   = useMemo(() => buildQrTarget(id), [id]);
  const localQrImage    = useMemo(() => buildQrImage(localQrTarget), [localQrTarget]);
  const prototypeDisplay = useMemo(() => getPrototypeDisplay(vehicle), [vehicle]);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/vehicles/${id}`);
        const data     = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load vehicle profile");
        setVehicle(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [id]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      userName:  user?.name  || prev.userName,
      userEmail: user?.email || prev.userEmail,
    }));
  }, [user]);

  const handleFieldChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleStarChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const payload = {
        ...formData,
        driverBehavior:  Number(formData.driverBehavior),
        vehicleCondition: Number(formData.vehicleCondition),
        cleanliness:     Number(formData.cleanliness),
      };

      const response = await fetch(`${API_BASE_URL}/vehicles/${id}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to submit rating");

      // If new rating is below 3 it becomes an incident — refresh vehicle
      const newRating = data.rating;
      setVehicle((prev) => ({
        ...prev,
        ...(data.vehicle || {}),
        ratings: newRating ? [newRating, ...(prev?.ratings || [])].slice(0, 8) : prev?.ratings || [],
        incidents: newRating && newRating.safetyScore < 3
          ? [newRating, ...(prev?.incidents || [])].slice(0, 5)
          : prev?.incidents || [],
      }));
      setMessage("Vehicle rating submitted successfully.");
      setFormData((prev) => ({
        ...prev,
        driverBehavior: 5, vehicleCondition: 5, cleanliness: 5, comment: "",
      }));
      setShowRatingForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(vehicle?.qrTarget || localQrTarget);
      setMessage("Vehicle QR link copied.");
      setError("");
    } catch {
      setError("Could not copy QR link.");
    }
  };

  if (loading) {
    return (
      <div className="vehicle-shell">
        <div className="vehicle-detail-device vehicle-loading-state">Loading vehicle profile...</div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="vehicle-shell">
        <div className="vehicle-detail-device vehicle-loading-state">{error || "Vehicle not found"}</div>
      </div>
    );
  }

  const incidents = vehicle.incidents || [];

  return (
    <div className="vehicle-shell">
      <div className="vehicle-detail-device">
        <header className="vehicle-detail-header">
          <Link to="/vehicles" className="vehicle-detail-back" aria-label="Back to vehicle list">◀</Link>
          <h1>{prototypeDisplay.title}</h1>
          <span className="vehicle-detail-back vehicle-detail-back-placeholder">◀</span>
        </header>

        <main className="vehicle-detail-content">
          {qrDetected && <div className="vehicle-inline-alert">Opened from QR scan.</div>}
          {(message || error) && (
            <div className={`vehicle-inline-alert ${error ? "is-error" : "is-success"}`}>{error || message}</div>
          )}

          {/* ── Vehicle info card ── */}
          <section className="vehicle-main-card">
            <div className="vehicle-main-image-box">
              <img src={prototypeDisplay.image} alt={prototypeDisplay.title} className="vehicle-main-image" />
            </div>
            <div className="vehicle-main-info">
              <p><strong>Name:</strong> {vehicle.name}</p>
              <p><strong>Route:</strong> {vehicle.route}</p>
              <p><strong>City:</strong> {vehicle.city}</p>
              <p><strong>Avg Safety Score:</strong> {(vehicle.averageSafetyScore || 0).toFixed(1)} / 5</p>
              <p><strong>Total Ratings:</strong> {vehicle.totalRatings || 0}</p>
            </div>
          </section>

          {/* ── Action pills ── */}
          <div className="vehicle-pill-actions">
            <button
              type="button"
              className="vehicle-action-pill"
              onClick={() => { setShowQrCard((p) => !p); setShowRatingForm(false); setShowIncidents(false); }}
            >
              {showQrCard ? "Hide QR" : "Show QR"}
            </button>

            <button
              type="button"
              className="vehicle-action-pill"
              onClick={() => { setShowRatingForm((p) => !p); setShowQrCard(false); setShowIncidents(false); }}
            >
              {showRatingForm ? "Hide rating" : "Rate vehicle"}
            </button>

            <button
              type="button"
              className={`vehicle-action-pill ${incidents.length > 0 ? "vp-incident-pill" : ""}`}
              onClick={() => { setShowIncidents((p) => !p); setShowQrCard(false); setShowRatingForm(false); }}
            >
              {showIncidents ? "Hide incidents" : `⚠ Incidents ${incidents.length > 0 ? `(${incidents.length})` : ""}`}
            </button>

            <Link to="/feedback" className="vehicle-action-pill vehicle-action-link">
              Feedback
            </Link>
          </div>

          {/* ── QR Card ── */}
          {showQrCard && (
            <section className="vehicle-secondary-card vehicle-qr-card">
              <div className="vehicle-qr-image-wrap">
                <img
                  src={localQrImage}
                  alt={`${vehicle.name} QR code`}
                  className="vehicle-qr-image"
                />
              </div>
              <p className="vp-qr-hint">Scan this QR code to open this vehicle profile directly.</p>
              <div className="vehicle-qr-copy-row">
                <button type="button" className="vehicle-submit-button" onClick={handleCopyLink}>
                  Copy QR Link
                </button>
              </div>
            </section>
          )}

          {/* ── Rating form ── */}
          {showRatingForm && (
            <section className="vehicle-secondary-card">
              <form className="vehicle-rating-form" onSubmit={handleSubmit}>
                <div className="vehicle-hidden-fields">
                  <input
                    name="userName"
                    value={formData.userName}
                    onChange={handleFieldChange}
                    className="vehicle-input"
                    placeholder="Your name"
                  />
                  <input
                    name="userEmail"
                    value={formData.userEmail}
                    onChange={handleFieldChange}
                    className="vehicle-input"
                    type="email"
                    placeholder="Your email"
                  />
                </div>

                {ratingFields.map((field) => (
                  <StarRow
                    key={field.key}
                    label={field.label}
                    name={field.key}
                    value={formData[field.key]}
                    onChange={handleStarChange}
                  />
                ))}

                <textarea
                  name="comment"
                  value={formData.comment}
                  onChange={handleFieldChange}
                  className="vehicle-textarea"
                  placeholder="Write your trip experience"
                />

                <div className="vehicle-submit-row">
                  <button type="submit" className="vehicle-submit-button">Submit</button>
                </div>
              </form>
            </section>
          )}

          {/* ── Recent Incidents with QR ── */}
          {showIncidents && (
            <section className="vehicle-secondary-card vp-incidents-card">
              <div className="vp-incidents-header">
                <h3>⚠ Recent Safety Incidents</h3>
                <span className="vp-incidents-sub">Ratings with safety score below 3.0</span>
              </div>

              {incidents.length === 0 ? (
                <div className="vp-incidents-empty">
                  <span className="vp-incidents-empty-icon">✅</span>
                  <p>No safety incidents reported for this vehicle.</p>
                </div>
              ) : (
                <>
                  {/* QR panel at the top — scan to report directly */}
                  <div className="vp-incident-qr-row">
                    <div className="vp-incident-qr-label">
                      <strong>Report via QR</strong>
                      <span>Scan to open this vehicle and submit a safety report instantly.</span>
                    </div>
                    <img
                      src={localQrImage}
                      alt="Vehicle QR"
                      className="vp-incident-qr-img"
                    />
                  </div>

                  <div className="vp-incidents-list">
                    {incidents.map((inc, idx) => {
                      const sev = incidentSeverityLabel(inc.safetyScore);
                      return (
                        <article key={inc._id || idx} className="vp-incident-item">
                          <div className="vp-incident-item-top">
                            <span
                              className="vp-severity-tag"
                              style={{ background: sev.bg, color: sev.color }}
                            >
                              {sev.label}
                            </span>
                            <span className="vp-incident-score">
                              Score: {inc.safetyScore?.toFixed(1) ?? "—"}/5
                            </span>
                            <span className="vp-incident-date">{formatDate(inc.createdAt)}</span>
                          </div>

                          <div className="vp-incident-scores">
                            <span>🧑 Driver: {inc.driverBehavior}/5</span>
                            <span>🔧 Condition: {inc.vehicleCondition}/5</span>
                            <span>🧹 Clean: {inc.cleanliness}/5</span>
                          </div>

                          {inc.comment && (
                            <p className="vp-incident-comment">"{inc.comment}"</p>
                          )}

                          <div className="vp-incident-reporter">
                            Reported by: <strong>{inc.userName || "Anonymous"}</strong>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default VehicleProfilePage;
