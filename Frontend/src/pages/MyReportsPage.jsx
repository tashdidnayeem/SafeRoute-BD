import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

// ── Relative time helper ("2 hr ago", "yesterday", etc.) ──────────────
function timeAgo(dateString) {
  if (!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (diff < 0) return "in the future";
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (hrs < 24) return `${hrs} hr ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Status timeline component ─────────────────────────────────────────
function StatusTimeline({ status }) {
  if (status === "Rejected") {
    return (
      <div
        style={{
          marginTop: 10,
          padding: "8px 12px",
          borderRadius: 8,
          background: "#fee2e2",
          color: "#991b1b",
          fontSize: 12,
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        ❌ This report was rejected
      </div>
    );
  }

  const steps = ["Pending", "Verified", "Resolved"];
  const currentIdx = steps.indexOf(status);
  const activeIdx = currentIdx === -1 ? 0 : currentIdx;

  return (
    <div style={{ display: "flex", alignItems: "center", marginTop: 10, gap: 2 }}>
      {steps.map((step, idx) => {
        const done = idx <= activeIdx;
        const isLast = idx === steps.length - 1;
        return (
          <React.Fragment key={step}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto" }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: done ? "#16a34a" : "#e5e7eb",
                  color: done ? "#fff" : "#9ca3af",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {done ? "✓" : idx + 1}
              </div>
              <span
                style={{
                  fontSize: 10,
                  marginTop: 4,
                  color: done ? "#16a34a" : "#9ca3af",
                  fontWeight: idx === activeIdx ? 700 : 500,
                }}
              >
                {step}
              </span>
            </div>
            {!isLast && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: idx < activeIdx ? "#16a34a" : "#e5e7eb",
                  marginBottom: 14,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Skeleton card for loading state ───────────────────────────────────
function SkeletonCard() {
  return (
    <div className="report-card" style={{ opacity: 0.7 }}>
      <div style={{ height: 20, background: "#e5e7eb", borderRadius: 4, marginBottom: 10, width: "60%" }} />
      <div style={{ height: 150, background: "#e5e7eb", borderRadius: 8, marginBottom: 10 }} />
      <div style={{ height: 14, background: "#e5e7eb", borderRadius: 4, marginBottom: 6, width: "70%" }} />
      <div style={{ height: 14, background: "#e5e7eb", borderRadius: 4, marginBottom: 6, width: "90%" }} />
      <div style={{ height: 14, background: "#e5e7eb", borderRadius: 4, width: "50%" }} />
    </div>
  );
}

const MyReportsPage = () => {
  const API = import.meta.env.VITE_API_URL;
  const { token, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchMyReports = async () => {
      try {
        const res = await fetch(`${API}/reports/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch your reports");
        setReports(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyReports();
  }, [API, token, authLoading, navigate]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setLightboxImage(null);
    };
    if (lightboxImage) {
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
  }, [lightboxImage]);

  return (
    <div className="auth-page">
      <div className="auth-card reports-page-card">
        <h2 className="auth-title">Report History</h2>

        <p className="auth-switch reports-home-link">
          Go back to <Link to="/">Home</Link>
        </p>

        {error && <p className="auth-error">{error}</p>}

        {authLoading || loading ? (
          <div className="reports-grid">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : reports.length === 0 ? (
          <div className="reports-empty" style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>📋</div>
            <h3 style={{ color: "#4b5563", marginBottom: 8, fontSize: 20 }}>
              No reports yet
            </h3>
            <p style={{ color: "#6b7280", marginBottom: 24, fontSize: 14, lineHeight: 1.5 }}>
              Help make your community safer by reporting road problems you encounter.
            </p>

            <div className="reports-actions">
              <Link to="/report">
                <button className="auth-button reports-action-btn">
                  + Create Your First Report
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>
              You have submitted <b>{reports.length}</b> report
              {reports.length !== 1 ? "s" : ""}.
            </p>

            <div className="reports-grid">
              {reports.map((report) => (
                <div key={report._id} className="report-card">
                  <h3 className="report-card-title">{report.issueType}</h3>

                  {report.photoUrl && (
                    <img
                      src={report.photoUrl}
                      alt="Report evidence"
                      onClick={() => setLightboxImage(report.photoUrl)}
                      style={{
                        width: "100%",
                        maxHeight: "200px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        marginBottom: "10px",
                        cursor: "pointer",
                        transition: "transform 0.15s",
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                      onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    />
                  )}

                  <p>
                    <b>Severity:</b>{" "}
                    <span
                      style={{
                        color:
                          report.severity === "High"
                            ? "#dc2626"
                            : report.severity === "Medium"
                            ? "#ca8a04"
                            : "#16a34a",
                        fontWeight: 600,
                      }}
                    >
                      {report.severity}
                    </span>
                  </p>

                  <p>
                    <b>Location:</b> {report.location?.address || "N/A"}
                  </p>

                  {/* 🕐 INCIDENT TIME — prominent */}
                  <p style={{ marginBottom: 2 }}>
                    <b>🕐 Incident:</b>{" "}
                    <span style={{ color: "#1f2937" }}>
                      {timeAgo(report.incidentTime)}
                    </span>
                  </p>
                  {report.incidentTime && (
                    <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 0, marginBottom: 6 }}>
                      {new Date(report.incidentTime).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}

                  {/* Small subtext — when the report was submitted */}
                  <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
                    Reported{" "}
                    {report.createdAt ? timeAgo(report.createdAt) : "recently"}
                  </p>

                  {/* Status timeline */}
                  <StatusTimeline status={report.status} />
                </div>
              ))}
            </div>

            <div className="reports-actions">
              <Link to="/report">
                <button className="auth-button reports-action-btn">
                  + Create New Report
                </button>
              </Link>

              <Link to="/">
                <button className="auth-button reports-action-btn">
                  ← Back to Home
                </button>
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Lightbox for photo */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            cursor: "zoom-out",
            padding: 20,
          }}
        >
          <img
            src={lightboxImage}
            alt="Full size"
            style={{
              maxWidth: "95%",
              maxHeight: "95%",
              borderRadius: 8,
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          />
          <button
            onClick={() => setLightboxImage(null)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff",
              width: 44,
              height: 44,
              borderRadius: "50%",
              fontSize: 20,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
          <div
            style={{
              position: "absolute",
              bottom: 20,
              left: "50%",
              transform: "translateX(-50%)",
              color: "rgba(255,255,255,0.7)",
              fontSize: 12,
            }}
          >
            Click anywhere or press Esc to close
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReportsPage;