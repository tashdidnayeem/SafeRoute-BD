import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  severityColor,
  severityRadiusMeters,
  calcRiskScore,
} from "../utils/map";
import "./map.css";

const defaultCenter = [23.8103, 90.4125];

// ── Status badge colours ──────────────────────────────────────────────────
const STATUS_COLORS = {
  Pending:  { bg: "#fef3c7", text: "#92400e", border: "#fbbf24" },
  Verified: { bg: "#dcfce7", text: "#166534", border: "#4ade80" },
  Resolved: { bg: "#dbeafe", text: "#1e40af", border: "#60a5fa" },
  Rejected: { bg: "#fee2e2", text: "#991b1b", border: "#f87171" },
};

const SEVERITY_COLORS = {
  High:   { bg: "#fee2e2", text: "#991b1b", border: "#f87171" },
  Medium: { bg: "#fef9c3", text: "#854d0e", border: "#fde047" },
  Low:    { bg: "#dcfce7", text: "#166534", border: "#4ade80" },
};

// ── Risk score gauge bar ──────────────────────────────────────────────────
function RiskGauge({ score, band, color, label, nearbyCount }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.4px" }}>
          Zone Risk Score
        </span>
        <span style={{
          fontSize: 11, fontWeight: 800, color,
          background: color + "18",
          border: `1.5px solid ${color}55`,
          borderRadius: 99,
          padding: "1px 8px",
        }}>
          {label}
        </span>
      </div>

      <div style={{ background: "#e5e7eb", borderRadius: 99, height: 8, overflow: "hidden" }}>
        <div style={{
          width: `${score}%`,
          height: "100%",
          borderRadius: 99,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          transition: "width 0.6s ease",
        }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 10, color: "#6b7280" }}>
          {nearbyCount > 0
            ? `+${nearbyCount} nearby report${nearbyCount > 1 ? "s" : ""} in 500 m`
            : "No other reports in 500 m"}
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, color }}>{score}/100</span>
      </div>
    </div>
  );
}

// ── Rich popup content ────────────────────────────────────────────────────
function ReportPopup({ p, risk }) {
  const sevStyle = SEVERITY_COLORS[p.severity] || SEVERITY_COLORS.Low;
  const statStyle = STATUS_COLORS[p.status] || STATUS_COLORS.Pending;
  const markerColor = severityColor(p.severity);

  return (
    <div style={{
      width: 290,
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      fontSize: 13,
      color: "#1f2937",
      lineHeight: 1.5,
    }}>
      <div style={{
        background: markerColor,
        margin: "-8px -12px 10px",
        padding: "8px 12px",
        borderRadius: "8px 8px 0 0",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <span style={{ fontSize: 18 }}>🚧</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#fff", lineHeight: 1.2 }}>
            {p.label}
          </div>
          {p.locationLabel && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.80)" }}>
              📍 {p.locationLabel}
            </div>
          )}
        </div>
      </div>

      <p style={{
        margin: "0 0 10px",
        fontSize: 12.5,
        color: "#374151",
        background: "#f9fafb",
        borderRadius: 6,
        padding: "7px 9px",
        border: "1px solid #e5e7eb",
        lineHeight: 1.55,
      }}>
        {p.description || "No description provided."}
      </p>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 10 }}>
        <span style={{
          fontSize: 11, fontWeight: 700,
          background: sevStyle.bg, color: sevStyle.text,
          border: `1.5px solid ${sevStyle.border}`,
          borderRadius: 99, padding: "2px 10px",
        }}>
          ⚡ {p.severity} Severity
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700,
          background: statStyle.bg, color: statStyle.text,
          border: `1.5px solid ${statStyle.border}`,
          borderRadius: 99, padding: "2px 10px",
        }}>
          {p.status === "Verified" ? "✅" : p.status === "Resolved" ? "🔵" : p.status === "Rejected" ? "❌" : "⏳"} {p.status}
        </span>
      </div>

      {p.createdAt && (
        <div style={{
          fontSize: 11, color: "#6b7280",
          display: "flex", alignItems: "center", gap: 5,
          marginBottom: 6,
        }}>
          <span>🕐</span>
          <span>{new Date(p.createdAt).toLocaleString("en-GB", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}</span>
        </div>
      )}

      <div style={{ height: 1, background: "#e5e7eb", margin: "8px 0" }} />

      <RiskGauge {...risk} />
    </div>
  );
}

// ── Map click handler ─────────────────────────────────────────────────────
function MapClickHandler({ setLocation, setSelectedPosition, selectMode }) {
  const map = useMap();
  useMapEvents({
    click(e) {
      if (!selectMode) return;
      const coords = [e.latlng.lat, e.latlng.lng];
      setSelectedPosition(coords);
      map.flyTo(coords, 15);
      if (setLocation) setLocation({ lat: coords[0], lng: coords[1] });
    },
  });
  return null;
}

// ── Main component ────────────────────────────────────────────────────────
export default function ReportMap({
  reports = [],
  setLocation,
  selectMode = false,
}) {
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [gpsLoaded, setGpsLoaded] = useState(false);
  const mapRef = useRef(null);

  // Build normalised points (with coordinate validation)
  const points = useMemo(() => {
    return (reports || [])
      .filter((r) => r.location)
      .map((r) => {
        const [lat, lng] =
          typeof r.location === "string"
            ? r.location.split(",").map(Number)
            : [r.location.latitude, r.location.longitude];

        return {
          id: r._id || r.id,
          lat: Number(lat),
          lng: Number(lng),
          severity: r.severity ?? "Low",
          status: r.status ?? "Pending",
          label: r.issueCategory?.name || r.issueType || "Issue",
          description: r.description || "",
          locationLabel: `${r.location?.upazila || ""} ${r.location?.district || ""}`.trim(),
          createdAt: r.createdAt,
        };
      })
      // ✅ FILTER OUT any point with invalid coordinates (NaN, undefined, etc.)
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  }, [reports]);

  // Compute risk scores for every point (memoised — only recalc when points change)
  const riskScores = useMemo(() => {
    const map = {};
    for (const p of points) {
      map[p.id] = calcRiskScore(p, points);
    }
    return map;
  }, [points]);

  // ✅ FIXED GPS (LOAD ONCE + MOVE MAP)
  useEffect(() => {
    if (!selectMode || gpsLoaded) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setSelectedPosition(coords);
        if (mapRef.current) mapRef.current.flyTo(coords, 15);
        if (setLocation) setLocation({ lat: coords[0], lng: coords[1] });
        setGpsLoaded(true);
      },
      () => console.log("GPS permission denied")
    );
  }, [selectMode, gpsLoaded, setLocation]);

  const center =
    selectedPosition ||
    (points.length ? [points[0].lat, points[0].lng] : defaultCenter);

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={13}
        className="leaflet-map"
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
        }}
      >
        <MapClickHandler
          setLocation={setLocation}
          setSelectedPosition={setSelectedPosition}
          selectMode={selectMode}
        />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ── Zone circles ── */}
        {points.map((p) => {
          const color = severityColor(p.severity);
          const radius = severityRadiusMeters(p.severity);
          return (
            <Circle
              key={`zone-${p.id}`}
              center={[p.lat, p.lng]}
              radius={radius}
              pathOptions={{ color, weight: 2, opacity: 0.8, fillColor: color, fillOpacity: 0.25 }}
            />
          );
        })}

        {/* ── Markers with rich popup ── */}
        {points.map((p) => {
          const color = severityColor(p.severity);
          const risk = riskScores[p.id] || { score: 0, band: "Minimal", color: "#2563eb", label: "Minimal", nearbyCount: 0 };
          return (
            <CircleMarker
              key={`marker-${p.id}`}
              center={[p.lat, p.lng]}
              radius={8}
              pathOptions={{ color: "#ffffff", weight: 2.5, fillColor: color, fillOpacity: 1 }}
            >
              <Popup minWidth={300} maxWidth={320}>
                <ReportPopup p={p} risk={risk} />
              </Popup>
            </CircleMarker>
          );
        })}

        {/* ── Selected location pin (select mode) ── */}
        {selectMode && selectedPosition && (
          <CircleMarker
            center={selectedPosition}
            radius={10}
            pathOptions={{ color: "#000", weight: 2, fillColor: "#3388ff", fillOpacity: 1 }}
          >
            <Popup>Selected Location</Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}