import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import ReportMap from "../views/ReportMap";
import "../styles/reportMap.css";

const SEVERITY_LABELS = {
  Low: { color: "#2a9d8f", bg: "rgba(42,157,143,0.18)" },
  Medium: { color: "#f1c40f", bg: "rgba(241,196,15,0.18)" },
  High: { color: "#e63946", bg: "rgba(230,57,70,0.18)" },
};

const STATUS_COLORS = {
  Pending: "#f59e0b",
  Verified: "#16a34a",
  Resolved: "#2563eb",
  Rejected: "#dc2626",
};

export default function ReportMapPage() {
  const API = import.meta.env.VITE_API_URL;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch(`${API}/reports`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();
      setReports(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError("Could not load reports. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    fetchReports();
    // Auto-refresh every 30 seconds to catch new reports
    const interval = setInterval(fetchReports, 30000);
    return () => clearInterval(interval);
  }, [fetchReports]);

  const filteredReports = reports.filter((r) => {
    const severityMatch = filterSeverity === "All" || r.severity === filterSeverity;
    const statusMatch = filterStatus === "All" || r.status === filterStatus;
    return severityMatch && statusMatch;
  });

  const stats = {
    total: reports.length,
    high: reports.filter((r) => r.severity === "High").length,
    pending: reports.filter((r) => r.status === "Pending").length,
    verified: reports.filter((r) => r.status === "Verified").length,
  };

  return (
    <div className="rmap-page">
      {/* ── HEADER ── */}
      <div className="rmap-header">
        <div className="rmap-header-left">
          <div className="auth-top-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <h1 className="rmap-title">🗺️ Live Report Map</h1>
          <p className="rmap-subtitle">
            Real-time road issue reports across Bangladesh
          </p>
        </div>
        <div className="rmap-header-right">
          <Link to="/report" className="rmap-btn-primary">
            + New Report
          </Link>
          <Link to="/" className="rmap-btn-ghost">
            ← Home
          </Link>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="rmap-stats">
        <div className="rmap-stat-card">
          <span className="rmap-stat-num">{stats.total}</span>
          <span className="rmap-stat-label">Total Reports</span>
        </div>
        <div className="rmap-stat-card rmap-stat-danger">
          <span className="rmap-stat-num">{stats.high}</span>
          <span className="rmap-stat-label">High Severity</span>
        </div>
        <div className="rmap-stat-card rmap-stat-warning">
          <span className="rmap-stat-num">{stats.pending}</span>
          <span className="rmap-stat-label">Pending</span>
        </div>
        <div className="rmap-stat-card rmap-stat-success">
          <span className="rmap-stat-num">{stats.verified}</span>
          <span className="rmap-stat-label">Verified</span>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="rmap-filters">
        <div className="rmap-filter-group">
          <label>Severity</label>
          <div className="rmap-filter-pills">
            {["All", "High", "Medium", "Low"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterSeverity(s)}
                className={`rmap-pill ${filterSeverity === s ? "rmap-pill-active" : ""}`}
                style={
                  filterSeverity === s && s !== "All"
                    ? {
                        background: SEVERITY_LABELS[s]?.bg,
                        borderColor: SEVERITY_LABELS[s]?.color,
                        color: SEVERITY_LABELS[s]?.color,
                      }
                    : {}
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="rmap-filter-group">
          <label>Status</label>
          <div className="rmap-filter-pills">
            {["All", "Pending", "Verified", "Resolved", "Rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`rmap-pill ${filterStatus === s ? "rmap-pill-active" : ""}`}
                style={
                  filterStatus === s && s !== "All"
                    ? {
                        background: `${STATUS_COLORS[s]}22`,
                        borderColor: STATUS_COLORS[s],
                        color: STATUS_COLORS[s],
                      }
                    : {}
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="rmap-filter-meta">
          <span className="rmap-showing">
            Showing <strong>{filteredReports.length}</strong> of{" "}
            <strong>{reports.length}</strong> reports
          </span>
          {lastUpdated && (
            <button className="rmap-refresh-btn" onClick={fetchReports}>
              ↻ Refresh
            </button>
          )}
        </div>
      </div>

      {/* ── MAP AREA ── */}
      <div className="rmap-map-wrapper">
        {loading ? (
          <div className="rmap-loading">
            <div className="rmap-spinner" />
            <p>Loading reports…</p>
          </div>
        ) : error ? (
          <div className="rmap-error">
            <p>{error}</p>
            <button className="rmap-btn-primary" onClick={fetchReports}>
              Retry
            </button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="rmap-empty">
            <p>No reports match the current filters.</p>
          </div>
        ) : (
          <ReportMap reports={filteredReports} selectMode={false} />
        )}
      </div>

      {/* ── LEGEND ── */}
      <div className="rmap-legend">
        <span className="rmap-legend-title">Severity Legend</span>
        {Object.entries(SEVERITY_LABELS).map(([label, { color }]) => (
          <span key={label} className="rmap-legend-item">
            <span
              className="rmap-legend-dot"
              style={{ background: color }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}