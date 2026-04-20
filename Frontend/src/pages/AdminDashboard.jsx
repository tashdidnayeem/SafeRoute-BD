import React, { useEffect, useState } from "react";
import "../styles/adminDashboard.css";
import banner from "../assets/feature-bg/adminPanel.png";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  const token = localStorage.getItem("token");

  const fetchReports = async () => {
    try {
      const response = await fetch(`${API_BASE}/reports`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch reports");
      }

      setReports(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleReviewClick = (report) => {
    setSelectedReport(report);
    setAdminNote(report.adminNote || "");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedReport(null);
    setAdminNote("");
    setIsModalOpen(false);
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedReport) return;

    if (!token) {
      alert("You are not logged in. Please log in as admin first.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/reports/${selectedReport._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
            adminNote: adminNote,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update report status");
      }

      await fetchReports();
      handleCloseModal();
      alert(data.message || `Report updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating report:", error);
      alert(error.message || "Failed to update report status");
    }
  };

  const handleDeleteReport = async (reportId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this report?"
    );

    if (!confirmed) return;

    if (!token) {
      alert("You are not logged in. Please log in as admin first.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/reports/${reportId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete report");
      }

      setReports((prevReports) =>
        prevReports.filter((report) => report._id !== reportId)
      );

      if (selectedReport && selectedReport._id === reportId) {
        handleCloseModal();
      }

      alert("Report deleted successfully");
    } catch (error) {
      console.error("Error deleting report:", error);
      alert(error.message || "Failed to delete report");
    }
  };

  const pendingCount = reports.filter((r) => r.status === "Pending").length;
  const verifiedCount = reports.filter((r) => r.status === "Verified").length;
  const resolvedCount = reports.filter((r) => r.status === "Resolved").length;
  const rejectedCount = reports.filter((r) => r.status === "Rejected").length;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h1>SafeRoute BD</h1>
        <p>Admin Panel</p>

        <nav>
          <button className="sidebar-btn" onClick={() => navigate("/")}>
            Homepage
          </button>
          <button className="sidebar-btn active">     
            Verify Reports
          </button>
          <button className="sidebar-btn" onClick={() => navigate("/admin/alerts")}>
            Alerts
          </button>
          <button className="sidebar-btn" onClick={() => navigate("/admin/analytics")}>Analytics</button>
          <button className="sidebar-btn">Settings</button>
        </nav>
      </aside>

      <main className="admin-main">
        <h2>Admin Dashboard</h2>
        <p>Review submitted reports here.</p>

        <div
          className="admin-banner"
          style={{ backgroundImage: `url(${banner})` }}
        >
          <div className="banner-overlay">
            <h3>Road Safety Monitoring</h3>
            <p>Track and manage road safety reports across Bangladesh</p>
          </div>
        </div>

        <div className="summary-cards">
          <div className="summary-card pending">
            <div className="summary-icon">⏳</div>
            <h3>Pending Reports</h3>
            <p>{pendingCount}</p>
          </div>

          <div className="summary-card verified">
            <div className="summary-icon">✔</div>
            <h3>Verified Reports</h3>
            <p>{verifiedCount}</p>
          </div>

          <div className="summary-card resolved">
            <div className="summary-icon">🛠</div>
            <h3>Resolved Reports</h3>
            <p>{resolvedCount}</p>
          </div>

          <div className="summary-card rejected">
            <div className="summary-icon">✖</div>
            <h3>Rejected Reports</h3>
            <p>{rejectedCount}</p>
          </div>
        </div>

        <div className="report-table-container">
          <h2>All Reports</h2>

          {reports.length === 0 ? (
            <p>No reports found.</p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Issue Type</th>
                  <th>Location</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Admin Note</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {reports.map((report) => (
                  <tr key={report._id}>
                    <td>{report.issueType}</td>
                    <td>{report.location?.address}</td>

                    <td>
                      <span
                        className={`badge severity-${report.severity.toLowerCase()}`}
                      >
                        {report.severity}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`badge status-${report.status.toLowerCase()}`}
                      >
                        {report.status}
                      </span>
                    </td>

                    <td className="admin-note-cell">
                      {report.adminNote ? report.adminNote : "—"}
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          className="review-btn"
                          onClick={() => handleReviewClick(report)}
                        >
                          Review
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteReport(report._id)}
                          title="Delete report"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {isModalOpen && selectedReport && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h2>Review Report</h2>
              <button onClick={handleCloseModal}>×</button>
            </div>

            <div className="modal-content">
              <p>
                <b>Issue Type:</b> {selectedReport.issueType}
              </p>
              <p>
                <b>Location:</b> {selectedReport.location?.address}
              </p>
              <p>
                <b>Severity:</b> {selectedReport.severity}
              </p>
              <p>
                <b>Status:</b> {selectedReport.status}
              </p>
              <p>
                <b>Description:</b> {selectedReport.description}
              </p>
              <p>
                <b>Current Admin Note:</b>{" "}
                {selectedReport.adminNote || "No note yet"}
              </p>
              {selectedReport.photoUrl && (
                <div style={{ marginTop: "12px" }}>
                  <p>
                    <b>Media Evidence:</b>
                  </p>
                  <img
                    src={selectedReport.photoUrl}
                    alt="Report evidence"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "250px",
                      borderRadius: "8px",
                      marginTop: "8px",
                      objectFit: "contain",
                      display: "block"
                    }}
                  />
                  <a
                    href={selectedReport.photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      marginTop: "5px",
                      fontSize: "13px",
                      color: "#3b82f6",
                      textDecoration: "underline",
                    }}
                  >
                    View Full Image
                  </a>
                </div>
              )}
            </div>

            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote( e.target.value)}
              placeholder="Write admin note..."
              className="admin-textarea"
            />

            <div className="modal-actions">
              <button
                className="reject-btn"
                onClick={() => handleStatusUpdate("Rejected")}
              >
                Reject
              </button>

              <button
                className="verify-btn"
                onClick={() => handleStatusUpdate("Verified")}
              >
                Verify
              </button>

              <button
                className="resolve-btn"
                onClick={() => handleStatusUpdate("Resolved")}
              >
                Resolve
              </button>

              <button className="close-btn" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;