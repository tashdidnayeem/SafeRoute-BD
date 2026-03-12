// src/views/ReportMap.jsx
import { useMemo } from "react";
import { MapContainer, TileLayer, Circle, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { severityColor, severityRadiusMeters } from "../utils/map";
import "./map.css";

const defaultCenter = { lat: 23.8103, lng: 90.4125 }; // Dhaka

export default function ReportMap({ reports = [] }) {
  const points = useMemo(() => {
    return (reports || [])
      .filter(r => r.location?.latitude && r.location?.longitude)
      .map(r => {
        const lat = Number(r.location.latitude);
        const lng = Number(r.location.longitude);

        return {
          id: r._id || r.id || `${lat}-${lng}-${r.createdAt}`,
          lat,
          lng,
          severity: Number(r.severity ?? 3),
          status: r.status ?? "PENDING",
          label: r.issueCategory?.name || "Issue",
          description: r.description || "",
          locationLabel: r.location?.upazila
            ? `${r.location.upazila}, ${r.location.district || r.location.city || ""}`
            : r.location?.district || r.location?.city || "",
          createdAt: r.createdAt
        };
      });
  }, [reports]);

  const center = points.length
    ? { lat: points[0].lat, lng: points[0].lng }
    : defaultCenter;

  return (
    <div className="map-container">
      <MapContainer center={center} zoom={12} className="leaflet-map">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Color-coded zones (circles) */}
        {points.map(p => {
          const color = severityColor(p.severity);
          const radius = severityRadiusMeters(p.severity);
          return (
            <Circle
              key={`zone-${p.id}`}
              center={[p.lat, p.lng]}
              radius={radius}
              pathOptions={{
                color,
                weight: 2,
                opacity: 0.8,
                fillColor: color,
                fillOpacity: 0.25
              }}
            />
          );
        })}

        {/* Color-coded markers */}
        {points.map(p => {
          const color = severityColor(p.severity);
          return (
            <CircleMarker
              key={`marker-${p.id}`}
              center={[p.lat, p.lng]}
              radius={7}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: color,
                fillOpacity: 1
              }}
            >
              <Popup>
                <div className="map-info">
                  <strong>{p.label}</strong>
                  <div className="muted">{p.locationLabel}</div>
                  <div>{p.description || "No description."}</div>
                  <div className="muted">Severity: {p.severity} | Status: {p.status}</div>
                  {p.createdAt && (
                    <div className="muted">{new Date(p.createdAt).toLocaleString()}</div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}