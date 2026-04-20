import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../utils/api";
import "../styles/vehiclePages.css";

// ─── helpers ────────────────────────────────────────────────────────────────

const BANGLADESHI_CITIES = [
  "Dhaka", "Chittagong", "Sylhet", "Rajshahi", "Khulna",
  "Barishal", "Mymensingh", "Comilla", "Narayanganj", "Gazipur",
];

const VEHICLE_TYPES = ["Bus", "Train", "Metro", "Taxi", "Ride Share"];

const scoreColor = (score) => {
  if (score >= 4.5) return "#1a7a1a";
  if (score >= 4.0) return "#2d8c2d";
  if (score >= 3.5) return "#b07a00";
  if (score >= 3.0) return "#c05000";
  return "#b02020";
};

const scoreBg = (score) => {
  if (score >= 4.5) return "#d4f5d4";
  if (score >= 4.0) return "#e0f5e0";
  if (score >= 3.5) return "#fff3cc";
  if (score >= 3.0) return "#ffe0cc";
  return "#ffd4d4";
};

const typeIcon = (type) => {
  switch (type?.toLowerCase()) {
    case "train":
    case "metro": return "🚆";
    case "taxi":  return "🚕";
    default:      return "🚌";
  }
};

// ─── component ──────────────────────────────────────────────────────────────

const VehiclesPage = () => {
  const [vehicles, setVehicles]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // filter state
  const [searchName,    setSearchName]    = useState("");
  const [searchCity,    setSearchCity]    = useState("");
  const [searchRoute,   setSearchRoute]   = useState("");
  const [filterType,    setFilterType]    = useState("");
  const [filterMinScore, setFilterMinScore] = useState("");
  const [filterMin4Up,  setFilterMin4Up]  = useState(false);

  const fetchVehicles = useCallback(async (params = {}) => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams();
      if (params.name)      query.set("name",       params.name);
      if (params.city)      query.set("city",       params.city);
      if (params.route)     query.set("route",      params.route);
      if (params.type)      query.set("type",       params.type);
      if (params.minScore)  query.set("minScore",   params.minScore);
      if (params.minRatings) query.set("minRatings", params.minRatings);

      const response = await fetch(`${API_BASE_URL}/vehicles?${query.toString()}`);
      const data     = await response.json();

      if (!response.ok) throw new Error(data.message || "Failed to load vehicles");
      setVehicles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const handleApplyFilters = () => {
    fetchVehicles({
      name:       searchName.trim(),
      city:       searchCity.trim(),
      route:      searchRoute.trim(),
      type:       filterType,
      minScore:   filterMin4Up ? "4" : filterMinScore,
      minRatings: filterMin4Up ? "4"  : "",
    });
  };

  const handleReset = () => {
    setSearchName("");
    setSearchCity("");
    setSearchRoute("");
    setFilterType("");
    setFilterMinScore("");
    setFilterMin4Up(false);
    fetchVehicles();
  };

  // group by city for display
  const grouped = useMemo(() => {
    const map = {};
    vehicles.forEach((v) => {
      const key = v.city || "Other";
      if (!map[key]) map[key] = [];
      map[key].push(v);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [vehicles]);

  return (
    <div className="vehicle-shell">
      <div className="vlist-device">
        {/* ── Header ── */}
        <header className="vehicle-selector-header vlist-header">
          <h1>Vehicle Profiles</h1>
          <button
            type="button"
            className="vlist-filter-toggle"
            onClick={() => setShowFilters((p) => !p)}
            aria-expanded={showFilters}
          >
            {showFilters ? "✕ Close" : "⚙ Filters"}
          </button>
        </header>

        {/* ── Filter Panel ── */}
        {showFilters && (
          <div className="vlist-filter-panel">
            <div className="vlist-filter-row">
              <label className="vlist-filter-label">Vehicle Name</label>
              <input
                className="vlist-filter-input"
                placeholder="e.g. Hanif, Green Line…"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>

            <div className="vlist-filter-row">
              <label className="vlist-filter-label">City</label>
              <select
                className="vlist-filter-select"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
              >
                <option value="">All Cities</option>
                {BANGLADESHI_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="vlist-filter-row">
              <label className="vlist-filter-label">Route (keyword)</label>
              <input
                className="vlist-filter-input"
                placeholder="e.g. BRAC, Motijheel, Comilla…"
                value={searchRoute}
                onChange={(e) => setSearchRoute(e.target.value)}
              />
            </div>

            <div className="vlist-filter-row">
              <label className="vlist-filter-label">Vehicle Type</label>
              <select
                className="vlist-filter-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="vlist-filter-row">
              <label className="vlist-filter-label">Min Avg Safety</label>
              <select
                className="vlist-filter-select"
                value={filterMinScore}
                onChange={(e) => {
                  setFilterMinScore(e.target.value);
                  setFilterMin4Up(false);
                }}
                disabled={filterMin4Up}
              >
                <option value="">Any score</option>
                <option value="3">≥ 3.0</option>
                <option value="3.5">≥ 3.5</option>
                <option value="4">≥ 4.0</option>
                <option value="4.5">≥ 4.5</option>
              </select>
            </div>

            <div className="vlist-filter-row vlist-filter-row-check">
              <label className="vlist-filter-check-label">
                <input
                  type="checkbox"
                  checked={filterMin4Up}
                  onChange={(e) => {
                    setFilterMin4Up(e.target.checked);
                    if (e.target.checked) setFilterMinScore("");
                  }}
                />
                <span>Min 4★ buses only (≥ 4 ratings)</span>
              </label>
            </div>

            <div className="vlist-filter-actions">
              <button
                type="button"
                className="vlist-btn-apply"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </button>
              <button
                type="button"
                className="vlist-btn-reset"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* ── Content ── */}
        <main className="vlist-body">
          {error && (
            <div className="vehicle-inline-alert is-error">{error}</div>
          )}

          {loading ? (
            <div className="vlist-empty">Loading vehicles…</div>
          ) : vehicles.length === 0 ? (
            <div className="vlist-empty">No vehicles match your filters.</div>
          ) : (
            grouped.map(([city, list]) => (
              <section key={city} className="vlist-city-group">
                <h2 className="vlist-city-heading">
                  📍 {city}
                  <span className="vlist-city-count">{list.length}</span>
                </h2>

                <div className="vlist-cards">
                  {list.map((v) => (
                    <Link
                      key={v._id}
                      to={`/vehicles/${v._id}`}
                      className="vlist-card"
                    >
                      <div className="vlist-card-top">
                        <span className="vlist-type-icon">{typeIcon(v.vehicleType)}</span>
                        <span className="vlist-type-badge">{v.vehicleType}</span>
                      </div>

                      <div className="vlist-card-name">{v.name}</div>

                      <div className="vlist-card-route" title={v.route}>
                        🛣 {v.route}
                      </div>

                      <div className="vlist-card-footer">
                        <span
                          className="vlist-score-badge"
                          style={{
                            background: scoreBg(v.averageSafetyScore),
                            color: scoreColor(v.averageSafetyScore),
                          }}
                        >
                          ★ {v.averageSafetyScore > 0
                            ? v.averageSafetyScore.toFixed(1)
                            : "N/A"}
                        </span>
                        <span className="vlist-ratings-count">
                          {v.totalRatings} rating{v.totalRatings !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="vlist-qr-hint">Tap to view QR &amp; rate →</div>
                    </Link>
                  ))}
                </div>
              </section>
            ))
          )}
        </main>
      </div>
    </div>
  );
};

export default VehiclesPage;
