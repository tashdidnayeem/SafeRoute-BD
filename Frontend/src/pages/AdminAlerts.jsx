import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/adminAlerts.css";
import alertMap from "../assets/feature-bg/alertMap.png";

const API_BASE = import.meta.env.VITE_API_URL;

// --- Map click + flyTo handler ---
function MapClickHandler({ onLocationSelect, setSelectedPosition }) {
  const map = useMap();
  useMapEvents({
    click(e) {
      const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
      setSelectedPosition([coords.lat, coords.lng]);
      map.flyTo([coords.lat, coords.lng], 15);
      onLocationSelect(coords);
    },
  });
  return null;
}

const AdminAlerts = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("Low");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Location states ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [locationAddress, setLocationAddress] = useState("");
  const [locationLat, setLocationLat] = useState("");
  const [locationLng, setLocationLng] = useState("");

  const token = localStorage.getItem("token");
  const defaultCenter = [23.8103, 90.4125];

  // --- Reverse geocode when map is clicked ---
  const handleLocationSelect = async (coords) => {
    setSelectedPosition([coords.lat, coords.lng]);
    setLocationLat(coords.lat);
    setLocationLng(coords.lng);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      const address = data.display_name || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
      setLocationAddress(address);
    } catch (error) {
      console.error("Geocoding failed:", error);
      setLocationAddress(`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
    }
  };

  // --- Search location ---
  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        { headers: { "Accept": "application/json", "User-Agent": "SafeRoute-App" } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const place = data[0];
        handleLocationSelect({ lat: parseFloat(place.lat), lng: parseFloat(place.lon) });
      } else {
        alert("Location not found");
      }
    } catch (err) {
      console.error("Search error:", err);
      alert("Search failed. Try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Please log in as admin first.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title,
        description,
        severity,
        ...(locationLat && locationLng && {
          location: {
            address: locationAddress,
            latitude: Number(locationLat),
            longitude: Number(locationLng),
          },
        }),
      };

      if (expiresAt) payload.expiresAt = expiresAt;

      const response = await fetch(`${API_BASE}/alerts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create alert");

      alert("Alert created successfully");
      setTitle("");
      setDescription("");
      setSeverity("Low");
      setExpiresAt("");
      setSearchQuery("");
      setLocationAddress("");
      setLocationLat("");
      setLocationLng("");
      setSelectedPosition(null);
    } catch (error) {
      console.error("Create alert error:", error);
      alert(error.message || "Failed to create alert");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityClass = () => {
    if (severity === "High") return "severity-preview high";
    if (severity === "Moderate") return "severity-preview moderate";
    return "severity-preview low";
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h1>SafeRoute BD</h1>
        <p>Admin Panel</p>
        <nav>
          <button className="sidebar-btn" onClick={() => navigate("/")}>Homepage</button>
          <button className="sidebar-btn" onClick={() => navigate("/admin")}>Verify Reports</button>
          <button className="sidebar-btn active">Alerts</button>
          <button className="sidebar-btn" onClick={() => navigate("/admin/analytics")}>Analytics</button>
          <button className="sidebar-btn">Settings</button>
        </nav>
      </aside>

      <main className="admin-main">
        <h2>Create Alert</h2>
        <p>Create a public safety alert for users.</p>

        <div className="alerts-banner">
          <div className="alerts-banner-overlay">
            <div className="alerts-banner-text">
              <h3>Public Alert Management</h3>
              <p>Publish road safety alerts with severity level and expiry time so users can see the latest risk updates instantly.</p>
            </div>
          </div>
        </div>

        <div className="alerts-content-grid">
          <div className="alert-form-card">
            <form className="alert-form" onSubmit={handleSubmit}>

              <div className="form-group">
                <label>Alert Name</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter alert title"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="5"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write alert details"
                  required
                />
              </div>

              {/* ── SEARCH LOCATION ── */}
              <div className="form-group">
                <label>Search Location</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="text"
                    placeholder="Search place (e.g. Dhanmondi)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); handleSearchLocation(); }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSearchLocation}
                    className="create-alert-btn"
                    style={{ width: "120px", padding: "10px 16px", fontSize: "15px" }}
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* ── MAP ── */}
              <div className="form-group">
                <label>Select Location on Map <span style={{ fontWeight: 400, fontSize: "13px", color: "#486b89" }}>(optional)</span></label>
                <div style={{ width: "100%", height: "320px", borderRadius: "14px", overflow: "hidden", marginTop: "8px" }}>
                  <MapContainer
                    center={selectedPosition || defaultCenter}
                    zoom={13}
                    style={{ width: "100%", height: "100%" }}
                  >
                    <MapClickHandler
                      onLocationSelect={handleLocationSelect}
                      setSelectedPosition={setSelectedPosition}
                    />
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {selectedPosition && (
                      <CircleMarker
                        center={selectedPosition}
                        radius={10}
                        pathOptions={{ color: "#000", weight: 2, fillColor: "#3388ff", fillOpacity: 1 }}
                      >
                        <Popup>Alert Location</Popup>
                      </CircleMarker>
                    )}
                  </MapContainer>
                </div>
              </div>

              {/* ── ADDRESS TEXT BAR (auto-filled from map) ── */}
              <div className="form-group">
                <label>Location (Address)</label>
                <input
                  type="text"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  placeholder="Click on map to auto-fill, or type manually"
                />
              </div>

              <div className="form-group">
                <label>Severity</label>
                <div className="severity-options">
                  {["High", "Moderate", "Low"].map((s) => (
                    <label key={s} className={`severity-card ${severity === s ? "selected" : ""}`}>
                      <input type="radio" name="severity" value={s} checked={severity === s} onChange={(e) => setSeverity(e.target.value)} />
                      <span className={`severity-dot ${s.toLowerCase()}`}></span>
                      <span>{s}</span>
                    </label>
                  ))}
                </div>
                <div className={getSeverityClass()}>Selected Severity: {severity}</div>
              </div>

              <div className="form-group">
                <label>Expiry Date & Time (optional)</label>
                <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
                <small>If left empty, validity will be 24 hours by default.</small>
              </div>

              <button type="submit" className="create-alert-btn" disabled={loading}>
                {loading ? "Creating..." : "Create Alert"}
              </button>
            </form>
          </div>

          <div className="alert-visual-card">
            <img src={alertMap} alt="Alert Map" className="alert-visual-image" />
            <div className="visual-info">
              <h3>Alert Preview Guide</h3>
              <div className="visual-badge high"><span className="badge-dot"></span>High Alert</div>
              <div className="visual-badge moderate"><span className="badge-dot"></span>Moderate Alert</div>
              <div className="visual-badge low"><span className="badge-dot"></span>Low Alert</div>
              <p>High alerts appear in red, moderate in yellow, and low in green on the user side.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminAlerts;