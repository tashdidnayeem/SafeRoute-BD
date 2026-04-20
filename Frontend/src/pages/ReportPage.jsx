import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import ReportMap from "../views/ReportMap";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

// Format current time for <input type="datetime-local">
const getLocalDateTimeString = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const ReportPage = () => {
  const API = import.meta.env.VITE_API_URL;
  const { token } = useAuth();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [compressing, setCompressing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const [formData, setFormData] = useState({
    issueType: "",
    description: "",
    location: "",
    latitude: "",
    longitude: "",
    severity: "",
    incidentTime: getLocalDateTimeString(),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchBoxRef = useRef(null);
  const debounceTimer = useRef(null);

  const DESCRIPTION_MAX = 500;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // PHOTO — with compression
  const processPhotoFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB");
      return;
    }

    setCompressing(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      setPhoto(compressed);
      setPhotoPreview(URL.createObjectURL(compressed));
      toast.success(`Photo ready (${(compressed.size / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.error("Compression failed:", err);
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    } finally {
      setCompressing(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    processPhotoFile(file);
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview("");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processPhotoFile(file);
  };

  // LOCATION
  const handleLocationSelect = async (coords) => {
    setSelectedLocation(coords);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept": "application/json",
            "User-Agent": "SafeRoute-App",
          },
        }
      );

      const data = await res.json();

      const address =
        data.display_name ||
        `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;

      setFormData((prev) => ({
        ...prev,
        latitude: coords.lat,
        longitude: coords.lng,
        location: address,
      }));
    } catch (error) {
      console.error("Geocoding failed:", error);
      setFormData((prev) => ({
        ...prev,
        latitude: coords.lat,
        longitude: coords.lng,
        location: `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
      }));
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Your browser doesn't support GPS");
      return;
    }

    toast.loading("Getting your location...", { id: "gps" });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        toast.success("Location found!", { id: "gps" });
        handleLocationSelect({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        toast.error("Could not get location. Check browser permissions.", {
          id: "gps",
        });
      }
    );
  };

  // AUTOCOMPLETE
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            q
          )}&countrycodes=bd&limit=6&addressdetails=1`,
          {
            headers: {
              Accept: "application/json",
              "User-Agent": "SafeRoute-App",
            },
          }
        );
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
        setShowSuggestions(true);
        setActiveIndex(-1);
      } catch (err) {
        console.error("Autocomplete error:", err);
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(debounceTimer.current);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (place) => {
    const coords = {
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
    };
    setSearchQuery(place.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    handleLocationSelect(coords);
  };

  const handleSearchKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") e.preventDefault();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) handleSelectSuggestion(suggestions[activeIndex]);
      else if (suggestions.length > 0) handleSelectSuggestion(suggestions[0]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("You must be logged in to submit a report.");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    if (
      !formData.issueType ||
      !formData.description ||
      !formData.location ||
      !formData.latitude ||
      !formData.longitude ||
      !formData.severity ||
      !formData.incidentTime
    ) {
      toast.error("All fields are required");
      return;
    }

    if (new Date(formData.incidentTime) > new Date()) {
      toast.error("Incident time cannot be in the future");
      return;
    }

    if (!photo) {
      toast.error("Photo evidence is required");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Submitting your report...");

    try {
      const fd = new FormData();
      fd.append("issueType", formData.issueType);
      fd.append("description", formData.description);
      fd.append("severity", formData.severity);
      fd.append("incidentTime", new Date(formData.incidentTime).toISOString());
      fd.append(
        "location",
        JSON.stringify({
          address: formData.location,
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
        })
      );
      fd.append("photo", photo);

      const response = await fetch(`${API}/reports`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to create report");

      toast.success("Report submitted successfully!", { id: toastId });
      setAiResult(data.aiClassification || null);

      setFormData({
        issueType: "",
        description: "",
        location: "",
        latitude: "",
        longitude: "",
        severity: "",
        incidentTime: getLocalDateTimeString(),
      });
      setSelectedLocation(null);
      setSearchQuery("");
      setPhoto(null);
      setPhotoPreview("");
    } catch (error) {
      toast.error(error.message, { id: toastId });
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-top-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div className="auth-header">
          <div>
            <h2 className="auth-title">Report Road Problem</h2>
            <p className="auth-subtitle">
              Help improve road safety in your community
            </p>
          </div>
        </div>

        {aiResult && (
          <div
            style={{
              borderRadius: "12px",
              padding: "14px 18px",
              marginBottom: "16px",
              background:
                aiResult.status === "Verified"
                  ? "rgba(39, 174, 96, 0.15)"
                  : aiResult.status === "Rejected"
                  ? "rgba(231, 76, 60, 0.15)"
                  : "rgba(241, 196, 15, 0.15)",
              borderLeft: `5px solid ${
                aiResult.status === "Verified"
                  ? "#27ae60"
                  : aiResult.status === "Rejected"
                  ? "#e74c3c"
                  : "#f1c40f"
              }`,
            }}
          >
            <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: "15px", color: "#12344d" }}>
              🤖 AI Classification Result
            </p>
            <p style={{ margin: "0 0 4px", fontSize: "14px", color: "#12344d" }}>
              <b>Status:</b>{" "}
              <span
                style={{
                  fontWeight: 700,
                  color:
                    aiResult.status === "Verified"
                      ? "#27ae60"
                      : aiResult.status === "Rejected"
                      ? "#e74c3c"
                      : "#e67e22",
                }}
              >
                {aiResult.status}
              </span>
            </p>
            {aiResult.suggestedSeverity && (
              <p style={{ margin: "0 0 4px", fontSize: "14px", color: "#12344d" }}>
                <b>AI Suggested Severity:</b> {aiResult.suggestedSeverity}
              </p>
            )}
            {aiResult.confidence > 0 && (
              <p style={{ margin: "0 0 4px", fontSize: "14px", color: "#12344d" }}>
                <b>Confidence:</b> {(aiResult.confidence * 100).toFixed(1)}%
              </p>
            )}
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#315b81", fontStyle: "italic" }}>
              {aiResult.note}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* 🔍 AUTOCOMPLETE SEARCH */}
          <div className="auth-field" ref={searchBoxRef} style={{ position: "relative" }}>
            <label>Search Location</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="🔍 Search place in Bangladesh (e.g. Dhanmondi)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
                style={{ paddingRight: searchLoading ? "40px" : "12px" }}
              />
              {searchLoading && (
                <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: "#666" }}>
                  ⏳
                </span>
              )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #d1d5db", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 1000, maxHeight: "280px", overflowY: "auto", marginTop: "4px" }}>
                {suggestions.map((place, idx) => {
                  const isActive = idx === activeIndex;
                  const mainName = place.name || place.display_name.split(",")[0] || "Unknown";
                  const subName = place.display_name.split(",").slice(1).join(",").trim();
                  return (
                    <li
                      key={`${place.place_id}-${idx}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(place);
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      style={{ padding: "10px 14px", cursor: "pointer", borderBottom: idx < suggestions.length - 1 ? "1px solid #f3f4f6" : "none", background: isActive ? "#eef2ff" : "#fff", display: "flex", alignItems: "flex-start", gap: "10px", transition: "background 0.1s" }}
                    >
                      <span style={{ fontSize: "16px", marginTop: "2px" }}>📍</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: "#1f2937", fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {mainName}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {subName}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {showSuggestions && !searchLoading && searchQuery.trim().length >= 2 && suggestions.length === 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #d1d5db", borderRadius: "8px", padding: "12px 14px", marginTop: "4px", color: "#6b7280", fontSize: "13px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 1000 }}>
                No places found in Bangladesh. Try a different search.
              </div>
            )}
          </div>

          {/* 📍 Use current location button */}
          <div className="auth-field">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="auth-button"
              style={{ background: "#0ea5e9" }}
            >
              📍 Use My Current Location
            </button>
          </div>

          {/* 🕐 INCIDENT TIME */}
          <div className="auth-field">
            <label>
              When did this happen? <span style={{ color: "#e74c3c" }}>*</span>
            </label>
            <input
              type="datetime-local"
              name="incidentTime"
              value={formData.incidentTime}
              onChange={handleChange}
              max={getLocalDateTimeString()}
            />
            <span style={{ fontSize: 12, color: "#6b7280", marginTop: 4, display: "block" }}>
              Defaults to now · you can pick an earlier time if the incident happened before
            </span>
          </div>

          <div className="auth-field">
            <label>Issue Type</label>
            <select name="issueType" value={formData.issueType} onChange={handleChange}>
              <option value="">Select issue type</option>
              <option value="Accident">🚗 Accident</option>
              <option value="Road Damage">🕳 Road Damage</option>
              <option value="Traffic Jam">🚦 Traffic Jam</option>
              <option value="Construction">🏗 Construction</option>
              <option value="Flooding">🌧 Flooding</option>
            </select>
          </div>

          <div className="auth-field">
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Describe the problem"
              value={formData.description}
              onChange={handleChange}
              maxLength={DESCRIPTION_MAX}
            />
            <span
              style={{
                display: "block",
                textAlign: "right",
                fontSize: 12,
                color:
                  formData.description.length >= DESCRIPTION_MAX
                    ? "#e74c3c"
                    : "#6b7280",
                marginTop: 4,
              }}
            >
              {formData.description.length}/{DESCRIPTION_MAX}
            </span>
          </div>

          {/* PHOTO UPLOAD with drag-and-drop */}
          <div className="auth-field">
            <label>
              Photo Evidence <span style={{ color: "#e74c3c" }}>*</span>
            </label>

            {!photoPreview ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border: dragActive ? "2px dashed #3b82f6" : "2px dashed #d1d5db",
                  borderRadius: 12,
                  padding: "20px 16px",
                  background: dragActive ? "#eff6ff" : "#fafafa",
                  transition: "all 0.2s",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8, color: "#9ca3af" }}>
                  {compressing ? "⏳" : dragActive ? "⬇️" : "📸"}
                </div>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
                  {compressing
                    ? "Processing your photo..."
                    : dragActive
                    ? "Drop it here!"
                    : "Drag & drop a photo here, or use the buttons below"}
                </p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                  <label className="auth-button" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: 1, minWidth: "140px" }}>
                    📷 Take Photo
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} style={{ display: "none" }} disabled={compressing} />
                  </label>
                  <label className="auth-button" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: 1, minWidth: "140px" }}>
                    📁 Choose File
                    <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} disabled={compressing} />
                  </label>
                </div>
                <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "8px", fontStyle: "italic" }}>
                  Required · auto-compressed to ~1 MB
                </p>
              </div>
            ) : (
              <div style={{ marginTop: "10px" }}>
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{ width: "100%", maxHeight: "300px", objectFit: "cover", borderRadius: "12px", border: "2px solid #ddd" }}
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="auth-button"
                  style={{ marginTop: "8px", background: "#e74c3c" }}
                >
                  ❌ Remove Photo
                </button>
              </div>
            )}
          </div>

          {/* MAP */}
          <div className="auth-field">
            <label>Select Location on Map</label>
            <div style={{ width: "100%", height: "400px", marginTop: "10px", borderRadius: "12px", overflow: "hidden", position: "relative", zIndex: 10 }}>
              <ReportMap setLocation={handleLocationSelect} selectMode={true} />
            </div>
          </div>

          <div className="auth-field">
            <label>Location (Address)</label>
            <input type="text" name="location" value={formData.location} onChange={handleChange} />
          </div>

          {/* Hidden lat/lng */}
          <input type="hidden" value={formData.latitude} readOnly />
          <input type="hidden" value={formData.longitude} readOnly />

          <div className="auth-field">
            <label>Severity</label>
            <select name="severity" value={formData.severity} onChange={handleChange}>
              <option value="">Select severity</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={submitting || compressing}
            style={{ opacity: submitting || compressing ? 0.6 : 1 }}
          >
            {submitting ? "Submitting..." : compressing ? "Processing..." : "Submit Report"}
          </button>
        </form>

        <p className="auth-switch">
          Go back to <Link to="/">Home</Link>
        </p>
      </div>
    </div>
  );
};

export default ReportPage;