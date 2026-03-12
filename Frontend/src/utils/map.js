// src/utils/map.js
export function severityColor(severity = 3) {
  if (severity >= 4) return "#e63946"; // red = high
  if (severity >= 2) return "#f1c40f"; // yellow = moderate
  return "#2a9d8f"; // green = low
}

export function severityRadiusMeters(severity = 3) {
  if (severity >= 4) return 300;
  if (severity >= 3) return 200;
  if (severity >= 2) return 120;
  return 80;
}