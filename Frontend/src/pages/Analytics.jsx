import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/analytics.css";
import banner from "../assets/feature-bg/adminPanel.png";

const API_BASE = import.meta.env.VITE_API_URL;

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─────────────────────────────────────────────────────────────────────────────
// CHART HELPERS  (pure SVG, zero dependencies)
// ─────────────────────────────────────────────────────────────────────────────

/** Animated horizontal bar chart */
function BarChart({ data, colorFn }) {
  // data: [{ label, value }]
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="chart-bar-list">
      {data.map(({ label, value }, i) => (
        <div key={i} className="chart-bar-row">
          <span className="chart-bar-label">{label}</span>
          <div className="chart-bar-track">
            <div
              className="chart-bar-fill"
              style={{
                width: `${(value / max) * 100}%`,
                background: colorFn ? colorFn(i, label) : "linear-gradient(90deg,#2fc3ff,#765cff)",
                animationDelay: `${i * 60}ms`,
              }}
            />
          </div>
          <span className="chart-bar-val">{value}</span>
        </div>
      ))}
    </div>
  );
}

/** Donut / pie chart in pure SVG */
function DonutChart({ slices, size = 160 }) {
  // slices: [{ label, value, color }]
  const total = slices.reduce((s, d) => s + d.value, 0) || 1;
  const r = 56, cx = size / 2, cy = size / 2, stroke = 22;

  let cum = 0;
  const arcs = slices.map((s) => {
    const frac = s.value / total;
    const start = cum;
    cum += frac;
    return { ...s, frac, start };
  });

  function describeArc(start, frac) {
    if (frac >= 1) frac = 0.9999;
    const startAngle = start * 2 * Math.PI - Math.PI / 2;
    const endAngle = (start + frac) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = frac > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        {arcs.map((arc, i) =>
          arc.value > 0 ? (
            <path
              key={i}
              d={describeArc(arc.start, arc.frac)}
              fill="none"
              stroke={arc.color}
              strokeWidth={stroke}
              strokeLinecap="butt"
              style={{ filter: `drop-shadow(0 0 4px ${arc.color}88)` }}
            />
          ) : null
        )}
        {/* Centre label */}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="22" fontWeight="800">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="10" fontWeight="600">TOTAL</text>
      </svg>

      {/* Legend */}
      <div className="donut-legend">
        {slices.map((s, i) => (
          <div key={i} className="donut-legend-item">
            <span className="donut-legend-dot" style={{ background: s.color }} />
            <span className="donut-legend-label">{s.label}</span>
            <span className="donut-legend-val">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Sparkline / area chart — reports per day in the selected month */
function DailyTrendChart({ dailyData, monthLabel }) {
  const W = 560, H = 140, PAD = { t: 14, r: 16, b: 32, l: 36 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  const max = Math.max(...dailyData.map((d) => d.count), 1);

  const xScale = (i) => PAD.l + (i / (dailyData.length - 1 || 1)) * innerW;
  const yScale = (v) => PAD.t + innerH - (v / max) * innerH;

  const polyline = dailyData.map((d, i) => `${xScale(i)},${yScale(d.count)}`).join(" ");
  const areaPath =
    `M ${xScale(0)},${yScale(0)} ` +
    dailyData.map((d, i) => `L ${xScale(i)},${yScale(d.count)}`).join(" ") +
    ` L ${xScale(dailyData.length - 1)},${yScale(0)} Z`;

  // Show every ~5th day label
  const step = Math.ceil(dailyData.length / 8);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", minWidth: 280, height: "auto" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2fc3ff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2fc3ff" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={PAD.l} y1={PAD.t + innerH * (1 - f)}
            x2={PAD.l + innerW} y2={PAD.t + innerH * (1 - f)}
            stroke="rgba(255,255,255,0.08)" strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <polyline points={polyline} fill="none" stroke="#2fc3ff" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Data dots */}
        {dailyData.map((d, i) =>
          d.count > 0 ? (
            <circle key={i} cx={xScale(i)} cy={yScale(d.count)} r="3.5" fill="#2fc3ff" stroke="#fff" strokeWidth="1.5" />
          ) : null
        )}

        {/* X axis labels */}
        {dailyData.map((d, i) =>
          i % step === 0 ? (
            <text key={i} x={xScale(i)} y={H - 6} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="9.5">
              {d.day}
            </text>
          ) : null
        )}

        {/* Y axis labels */}
        {[0, Math.round(max / 2), max].map((v, i) => (
          <text key={i} x={PAD.l - 6} y={yScale(v) + 4} textAnchor="end" fill="rgba(255,255,255,0.40)" fontSize="9">
            {v}
          </text>
        ))}
      </svg>
    </div>
  );
}

/** 12-month rolling bar chart */
function MonthlyTrendChart({ monthlyData }) {
  const max = Math.max(...monthlyData.map((d) => d.count), 1);
  const W = 560, H = 130, PAD = { t: 12, r: 12, b: 28, l: 34 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const barW = Math.max(4, (innerW / monthlyData.length) * 0.55);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", minWidth: 280, height: "auto" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#765cff" />
            <stop offset="100%" stopColor="#2fc3ff" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0.5, 1].map((f) => (
          <line key={f}
            x1={PAD.l} y1={PAD.t + innerH * (1 - f)}
            x2={PAD.l + innerW} y2={PAD.t + innerH * (1 - f)}
            stroke="rgba(255,255,255,0.07)" strokeWidth="1"
          />
        ))}

        {monthlyData.map((d, i) => {
          const x = PAD.l + (i / monthlyData.length) * innerW + (innerW / monthlyData.length - barW) / 2;
          const bH = (d.count / max) * innerH;
          const y = PAD.t + innerH - bH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={Math.max(bH, 2)} rx="3" fill="url(#barGrad)" opacity={d.isSelected ? 1 : 0.55} />
              {d.isSelected && (
                <rect x={x - 1} y={y - 1} width={barW + 2} height={Math.max(bH, 2) + 2} rx="4" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.6" />
              )}
              <text x={x + barW / 2} y={H - 6} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="9">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch(`${API_BASE}/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setReports(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // ── Filtered by selected month/year ──────────────────────────────────────
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const d = new Date(r.createdAt);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [reports, selectedMonth, selectedYear]);

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalReports = filteredReports.length;
  const highSeverity = filteredReports.filter((r) => r.severity === "High").length;
  const verified = filteredReports.filter((r) => r.status === "Verified").length;
  const resolved = filteredReports.filter((r) => r.status === "Resolved").length;

  // ── City breakdown ────────────────────────────────────────────────────────
  const cityMap = useMemo(() => {
    const map = {};
    filteredReports.forEach((r) => {
      const addr = r.location?.address || "";
      const parts = addr.split(",").map((s) => s.trim()).filter(Boolean);
      const city = parts.length >= 2 ? parts[parts.length - 2] : parts[0] || "Unknown";
      map[city] = (map[city] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredReports]);

  // ── High-risk zones ───────────────────────────────────────────────────────
  const highRiskZones = useMemo(() => {
    return filteredReports
      .filter((r) => r.severity === "High")
      .map((r) => ({
        address: r.location?.address || "Unknown location",
        issueType: r.issueType,
        status: r.status,
        date: new Date(r.createdAt).toLocaleDateString(),
      }));
  }, [filteredReports]);

  // ── Issue type breakdown ──────────────────────────────────────────────────
  const issueBreakdown = useMemo(() => {
    const map = {};
    filteredReports.forEach((r) => {
      const key = r.issueCategory?.name || r.issueType || "Unknown";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredReports]);

  // ── CHART DATA ─────────────────────────────────────────────────────────────

  // Severity donut
  const severitySlices = useMemo(() => {
    const high = filteredReports.filter((r) => r.severity === "High").length;
    const medium = filteredReports.filter((r) => r.severity === "Medium").length;
    const low = filteredReports.filter((r) => r.severity === "Low").length;
    return [
      { label: "High",   value: high,   color: "#e63946" },
      { label: "Medium", value: medium, color: "#f1c40f" },
      { label: "Low",    value: low,    color: "#2a9d8f" },
    ];
  }, [filteredReports]);

  // Status donut
  const statusSlices = useMemo(() => {
    const counts = { Pending: 0, Verified: 0, Resolved: 0, Rejected: 0 };
    filteredReports.forEach((r) => { if (counts[r.status] !== undefined) counts[r.status]++; });
    return [
      { label: "Pending",  value: counts.Pending,  color: "#f59e0b" },
      { label: "Verified", value: counts.Verified, color: "#16a34a" },
      { label: "Resolved", value: counts.Resolved, color: "#2563eb" },
      { label: "Rejected", value: counts.Rejected, color: "#dc2626" },
    ];
  }, [filteredReports]);

  // Daily trend (reports per day for selected month)
  const dailyData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const counts = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, count: 0 }));
    filteredReports.forEach((r) => {
      const d = new Date(r.createdAt).getDate() - 1;
      if (counts[d]) counts[d].count++;
    });
    return counts;
  }, [filteredReports, selectedMonth, selectedYear]);

  // Monthly trend (last 12 months rolling)
  const monthlyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const m = d.getMonth(), y = d.getFullYear();
      const count = reports.filter((r) => {
        const rd = new Date(r.createdAt);
        return rd.getMonth() === m && rd.getFullYear() === y;
      }).length;
      return {
        label: SHORT_MONTHS[m],
        count,
        isSelected: m === selectedMonth && y === selectedYear,
      };
    });
  }, [reports, selectedMonth, selectedYear]);

  // Issue type bar chart data (top 8)
  const issueBarData = useMemo(
    () => issueBreakdown.slice(0, 8).map(([label, value]) => ({ label, value })),
    [issueBreakdown]
  );

  const issueColors = ["#2fc3ff","#765cff","#f1c40f","#e63946","#2a9d8f","#f59e0b","#16a34a","#a78bfa"];

  // ── CSV Export ────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (filteredReports.length === 0) { alert("No data to export for this month."); return; }
    const headers = ["Issue Type","Address","City","Latitude","Longitude","Severity","Status","Admin Note","Date"];
    const rows = filteredReports.map((r) => {
      const addr = r.location?.address || "";
      const parts = addr.split(",").map((s) => s.trim()).filter(Boolean);
      const city = parts.length >= 2 ? parts[parts.length - 2] : parts[0] || "Unknown";
      return [r.issueType, `"${addr}"`, city, r.location?.latitude || "", r.location?.longitude || "",
        r.severity, r.status, `"${r.adminNote || ""}"`, new Date(r.createdAt).toLocaleString()].join(",");
    });
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SafeRoute_Analytics_${MONTHS[selectedMonth]}_${selectedYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const maxCityCount = cityMap.length > 0 ? cityMap[0][1] : 1;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h1>SafeRoute BD</h1>
        <p>Admin Panel</p>
        <nav>
          <button className="sidebar-btn" onClick={() => navigate("/")}>Homepage</button>
          <button className="sidebar-btn" onClick={() => navigate("/admin")}>Verify Reports</button>
          <button className="sidebar-btn" onClick={() => navigate("/admin/alerts")}>Alerts</button>
          <button className="sidebar-btn active">Analytics</button>
          <button className="sidebar-btn">Settings</button>
        </nav>
      </aside>

      <main className="admin-main">
        <h2>Analytics</h2>
        <p>Monthly insights on road safety reports across Bangladesh.</p>

        {/* Banner */}
        <div className="admin-banner" style={{ backgroundImage: `url(${banner})` }}>
          <div className="banner-overlay">
            <h3>Road Safety Analytics</h3>
            <p>Track report trends, high-risk zones, and city-wise data</p>
          </div>
        </div>

        {/* Controls */}
        <div className="analytics-controls">
          <div className="analytics-selectors">
            <select className="analytics-select" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select className="analytics-select" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button className="csv-export-btn" onClick={handleExportCSV}>⬇ Download CSV</button>
        </div>

        {loading ? (
          <div className="analytics-loading">Loading analytics...</div>
        ) : (
          <>
            {/* ── Summary Cards ── */}
            <div className="summary-cards">
              <div className="summary-card pending">
                <div className="summary-icon">📋</div>
                <h3>Total Reports</h3>
                <p>{totalReports}</p>
              </div>
              <div className="summary-card rejected">
                <div className="summary-icon">🔴</div>
                <h3>High Severity</h3>
                <p>{highSeverity}</p>
              </div>
              <div className="summary-card verified">
                <div className="summary-icon">✔</div>
                <h3>Verified</h3>
                <p>{verified}</p>
              </div>
              <div className="summary-card resolved">
                <div className="summary-icon">🛠</div>
                <h3>Resolved</h3>
                <p>{resolved}</p>
              </div>
            </div>

            {/* ── ROW 1: Daily trend + Monthly trend ── */}
            <div className="analytics-grid analytics-grid-2">
              <div className="analytics-card">
                <h3 className="analytics-card-title">
                  📈 Daily Reports — {MONTHS[selectedMonth]} {selectedYear}
                </h3>
                <DailyTrendChart dailyData={dailyData} />
              </div>

              <div className="analytics-card">
                <h3 className="analytics-card-title">📅 Last 12 Months</h3>
                <MonthlyTrendChart monthlyData={monthlyData} />
                <p className="chart-note">Highlighted bar = selected month</p>
              </div>
            </div>

            {/* ── ROW 2: Severity donut + Status donut ── */}
            <div className="analytics-grid analytics-grid-2">
              <div className="analytics-card">
                <h3 className="analytics-card-title">⚡ Severity Breakdown</h3>
                <DonutChart slices={severitySlices} />
              </div>

              <div className="analytics-card">
                <h3 className="analytics-card-title">🔄 Status Breakdown</h3>
                <DonutChart slices={statusSlices} />
              </div>
            </div>

            {/* ── ROW 3: Issue type bar + City bar ── */}
            <div className="analytics-grid analytics-grid-2">
              <div className="analytics-card">
                <h3 className="analytics-card-title">🗂 Issue Types</h3>
                {issueBarData.length === 0 ? (
                  <p className="analytics-empty">No data for this month.</p>
                ) : (
                  <BarChart
                    data={issueBarData}
                    colorFn={(i) => issueColors[i % issueColors.length]}
                  />
                )}
              </div>

              <div className="analytics-card">
                <h3 className="analytics-card-title">📍 Reports Per City</h3>
                {cityMap.length === 0 ? (
                  <p className="analytics-empty">No data for this month.</p>
                ) : (
                  <BarChart
                    data={cityMap.slice(0, 8).map(([label, value]) => ({ label, value }))}
                    colorFn={() => "linear-gradient(90deg,#2fc3ff,#765cff)"}
                  />
                )}
              </div>
            </div>

            {/* ── High-Risk Zones table ── */}
            <div className="analytics-card full-width">
              <div className="analytics-card-header">
                <h3 className="analytics-card-title">🚨 High-Risk Zones</h3>
                <span className="risk-count">{highRiskZones.length} zones</span>
              </div>
              {highRiskZones.length === 0 ? (
                <p className="analytics-empty">No high-risk reports this month. 🎉</p>
              ) : (
                <div className="risk-table-wrap">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Location</th>
                        <th>Issue Type</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {highRiskZones.map((z, i) => (
                        <tr key={i}>
                          <td style={{ fontSize: "15px" }}>{z.address}</td>
                          <td style={{ fontSize: "15px" }}>{z.issueType}</td>
                          <td>
                            <span className={`badge status-${z.status.toLowerCase()}`}>{z.status}</span>
                          </td>
                          <td style={{ fontSize: "15px" }}>{z.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminAnalytics;