export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const buildQrTarget = (vehicleId) => {
  const base = window.location.origin.replace(/\/$/, "");
  return `${base}/vehicles/${vehicleId}?source=qr`;
};

export const buildQrImage = (targetUrl) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
    targetUrl
  )}`;
