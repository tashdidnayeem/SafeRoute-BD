import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/vehiclePages.css";

const extractVehiclePath = (rawValue) => {
  if (!rawValue) return "";

  try {
    const url = new URL(rawValue);
    const match = url.pathname.match(/\/vehicles\/[^/?#]+/);
    if (match) {
      return `${match[0]}${url.search || ""}`;
    }
  } catch {
    const match = rawValue.match(/\/vehicles\/[^\s?#]+(?:\?[^\s#]*)?/);
    if (match) {
      return match[0];
    }
  }

  return "";
};

const QrScannerPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const frameRequestRef = useRef(null);
  const detectorRef = useRef(null);

  const [status, setStatus] = useState("Allow camera access and point it at a vehicle QR code.");
  const [error, setError] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [isStarting, setIsStarting] = useState(true);
  const [scannerSupported, setScannerSupported] = useState(true);

  const stopScanner = () => {
    if (frameRequestRef.current) {
      cancelAnimationFrame(frameRequestRef.current);
      frameRequestRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleDecodedValue = (value) => {
    const targetPath = extractVehiclePath(value);

    if (!targetPath) {
      setError("The scanned QR does not contain a SafeRoute vehicle link.");
      return;
    }

    stopScanner();
    navigate(targetPath);
  };

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      if (!("mediaDevices" in navigator) || !navigator.mediaDevices.getUserMedia) {
        if (isMounted) {
          setScannerSupported(false);
          setIsStarting(false);
          setStatus("Camera scanning is not supported in this browser.");
        }
        return;
      }

      if (!("BarcodeDetector" in window)) {
        if (isMounted) {
          setScannerSupported(false);
          setIsStarting(false);
          setStatus("Live QR detection is not available in this browser. Use the manual box below.");
        }
        return;
      }

      try {
        detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setIsStarting(false);
        setStatus("Scanning... Hold the QR code inside the camera frame.");

        const scanFrame = async () => {
          if (!videoRef.current || !canvasRef.current || !detectorRef.current) {
            frameRequestRef.current = requestAnimationFrame(scanFrame);
            return;
          }

          const video = videoRef.current;
          const canvas = canvasRef.current;

          if (video.readyState >= 2) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            try {
              const barcodes = await detectorRef.current.detect(canvas);
              if (barcodes?.length) {
                const rawValue = barcodes[0].rawValue;
                if (rawValue) {
                  handleDecodedValue(rawValue);
                  return;
                }
              }
            } catch (scanError) {
              setError(scanError.message || "Could not scan the QR code.");
            }
          }

          frameRequestRef.current = requestAnimationFrame(scanFrame);
        };

        frameRequestRef.current = requestAnimationFrame(scanFrame);
      } catch (scanError) {
        if (isMounted) {
          setScannerSupported(false);
          setIsStarting(false);
          setError(scanError.message || "Could not start the camera scanner.");
          setStatus("Camera scanner could not start. Use the manual QR link box below.");
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [navigate]);

  const handleManualSubmit = (event) => {
    event.preventDefault();
    setError("");
    handleDecodedValue(manualInput.trim());
  };

  return (
    <div className="vehicle-shell">
      <div className="vehicle-detail-device qr-scanner-device">
        <header className="vehicle-detail-header">
          <Link to="/" className="vehicle-detail-back" aria-label="Back to home">
            ◀
          </Link>
          <h1>QR Scanner</h1>
          <span className="vehicle-detail-back vehicle-detail-back-placeholder">◀</span>
        </header>

        <main className="vehicle-detail-content qr-scanner-content">
          <div className="vehicle-inline-alert">{status}</div>
          {error && <div className="vehicle-inline-alert is-error">{error}</div>}

          <section className="vehicle-secondary-card qr-live-card">
            <div className="qr-video-frame">
              {scannerSupported ? (
                <video ref={videoRef} className="qr-video" muted playsInline />
              ) : (
                <div className="qr-fallback-copy">Live camera scanning is unavailable on this device.</div>
              )}
              {isStarting && <div className="qr-overlay-message">Starting camera...</div>}
            </div>
            <canvas ref={canvasRef} className="qr-hidden-canvas" />
          </section>

          <section className="vehicle-secondary-card">
            <form className="vehicle-rating-form" onSubmit={handleManualSubmit}>
              <label className="vehicle-rating-label" htmlFor="manualQrInput">
                Paste the QR link here if your browser blocks camera scanning
              </label>
              <input
                id="manualQrInput"
                className="vehicle-input"
                value={manualInput}
                onChange={(event) => setManualInput(event.target.value)}
                placeholder="http://localhost:5173/vehicles/..."
              />
              <div className="vehicle-submit-row">
                <button type="submit" className="vehicle-submit-button">
                  Open Vehicle Page
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
};

export default QrScannerPage;
