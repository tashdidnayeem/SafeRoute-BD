import React, { useEffect, useState } from "react";
import "../styles/auth.css";

const MyReportsPage = () => {

  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetch("http://localhost:1715/api/reports")
      .then((res) => res.json())
      .then((data) => setReports(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: "900px" }}>

        <h2 className="auth-title">My Submitted Reports</h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginTop: "20px"
        }}>

          {reports.map((report) => (
            <div
              key={report._id}
              style={{
                background: "rgba(3,7,18,0.6)",
                padding: "16px",
                borderRadius: "14px",
                color: "white"
              }}
            >

              <h3>{report.issueType}</h3>

              <p><b>Severity:</b> {report.severity}</p>

              <p><b>Location:</b> {report.location}</p>

              <p>
                <b>Date:</b> {new Date(report.createdAt).toLocaleDateString()}
              </p>

              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "8px",
                  background:
                    report.status === "Pending"
                      ? "orange"
                      : report.status === "Verified"
                      ? "green"
                      : report.status === "Resolved"
                      ? "blue"
                      : "red",
                  color: "white"
                }}
              >
                {report.status}
              </span>

            </div>
          ))}

        </div>

      </div>
    </div>
  );
};

export default MyReportsPage;