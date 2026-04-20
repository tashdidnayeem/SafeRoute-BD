// src/utils/map.js

// ---------------------------------------------------------------------------
// Normalise severity → "high" | "medium" | "low"
// Accepts both string labels ("High") and legacy numeric values (1–5)
// ---------------------------------------------------------------------------
export function normaliseSeverity(severity) {
  if (typeof severity === "string") {
    const s = severity.toLowerCase();
    if (s === "high") return "high";
    if (s === "medium" || s === "moderate") return "medium";
    return "low";
  }
  const n = Number(severity);
  if (n >= 4) return "high";
  if (n >= 2) return "medium";
  return "low";
}

export function severityColor(severity) {
  const level = normaliseSeverity(severity);
  if (level === "high") return "#e63946";
  if (level === "medium") return "#f1c40f";
  return "#2a9d8f";
}

export function severityRadiusMeters(severity) {
  const level = normaliseSeverity(severity);
  if (level === "high") return 300;
  if (level === "medium") return 200;
  return 80;
}

// ---------------------------------------------------------------------------
// RISK SCORE ENGINE
//
// Calculates a 0–100 zone risk score for each report by examining all
// reports within CLUSTER_RADIUS_KM and combining:
//   • Severity weight   (High=10, Medium=5, Low=2)
//   • Status multiplier (Verified=1.0, Pending=0.8, Resolved=0.3, Rejected=0.1)
//   • Recency decay     (score halves every 7 days)
//   • Cluster density   (more nearby reports = higher risk)
//
// Score bands:
//   80–100 → Critical  🔴
//   60–79  → High      🟠
//   40–59  → Moderate  🟡
//   20–39  → Low       🟢
//    0–19  → Minimal   🔵
// ---------------------------------------------------------------------------

const CLUSTER_RADIUS_KM = 0.5;
const SEVERITY_WEIGHTS = { high: 10, medium: 5, low: 2 };
const STATUS_MULTIPLIERS = {
  Verified: 1.0,
  Pending: 0.8,
  Resolved: 0.3,
  Rejected: 0.1,
};
const RECENCY_HALF_LIFE_DAYS = 7;

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function recencyFactor(createdAt) {
  if (!createdAt) return 0.5;
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
  return Math.pow(0.5, ageDays / RECENCY_HALF_LIFE_DAYS);
}

/**
 * Calculate risk score for a single point given ALL points in the dataset.
 * @returns {{ score, band, color, label, nearbyCount }}
 */
export function calcRiskScore(point, allPoints) {
  const nearby = allPoints.filter(
    (p) =>
      p.id !== point.id &&
      haversineKm(point.lat, point.lng, p.lat, p.lng) <= CLUSTER_RADIUS_KM
  );

  const cluster = [point, ...nearby];

  let rawScore = 0;
  for (const p of cluster) {
    const sevWeight = SEVERITY_WEIGHTS[normaliseSeverity(p.severity)] ?? 2;
    const statusMult = STATUS_MULTIPLIERS[p.status] ?? 0.8;
    const recency = recencyFactor(p.createdAt);
    rawScore += sevWeight * statusMult * recency;
  }

  // Normalise: ~50 raw ≈ 100 score. Cap at 100, floor at 1.
  const score = Math.max(1, Math.min(100, Math.round((rawScore / 50) * 100)));

  return { score, ...riskBand(score), nearbyCount: nearby.length };
}

export function riskBand(score) {
  if (score >= 80)
    return { band: "Critical", color: "#dc2626", label: "Critical" };
  if (score >= 60)
    return { band: "High", color: "#ea580c", label: "High Risk" };
  if (score >= 40)
    return { band: "Moderate", color: "#ca8a04", label: "Moderate" };
  if (score >= 20)
    return { band: "Low", color: "#16a34a", label: "Low Risk" };
  return { band: "Minimal", color: "#2563eb", label: "Minimal" };
}