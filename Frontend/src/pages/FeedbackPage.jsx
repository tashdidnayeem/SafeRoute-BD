import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/api";
import "../styles/vehiclePages.css";

// ─── Section definitions with color identities ───────────────────────────────

const FEEDBACK_SECTIONS = [
  {
    key: "platformExperience",
    number: "01",
    title: "Overall Experience",
    prompt: "How would you rate your overall experience with SafeRoute BD?",
    icon: "🌟",
    color: "#1a6fb5",
    bg: "#ddeeff",
    border: "#a8ccf0",
    tag: "Experience",
  },
  {
    key: "usability",
    number: "02",
    title: "Usability",
    prompt: "How easy is the platform to navigate and use?",
    icon: "🖱️",
    color: "#6b21a8",
    bg: "#f3e8ff",
    border: "#d8b4fe",
    tag: "Usability",
  },
  {
    key: "effectiveness",
    number: "03",
    title: "Road Safety Features",
    prompt: "How effective are the safety alerts, scores, and incident reports?",
    icon: "🛡️",
    color: "#b45309",
    bg: "#fef3c7",
    border: "#fcd34d",
    tag: "Effectiveness",
  },
  {
    key: "comment",
    number: "04",
    title: "Your Thoughts",
    prompt: "Share suggestions, issues, or anything else on your mind.",
    icon: "💬",
    color: "#065f46",
    bg: "#d1fae5",
    border: "#6ee7b7",
    tag: "Comment",
    isText: true,
  },
];

const scoreTag = (score) => {
  if (score >= 5) return { label: "Excellent", color: "#065f46", bg: "#d1fae5" };
  if (score >= 4) return { label: "Good",      color: "#1a6fb5", bg: "#ddeeff" };
  if (score >= 3) return { label: "Average",   color: "#b45309", bg: "#fef3c7" };
  if (score >= 2) return { label: "Poor",      color: "#9d174d", bg: "#fce7f3" };
  return               { label: "Very Poor",  color: "#b02020", bg: "#ffd4d4" };
};

const defaultForm = {
  userName: "Anonymous User",
  userEmail: "",
  platformExperience: 5,
  usability: 5,
  effectiveness: 5,
  comment: "",
};

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString("en-BD", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

// ─── Star component ───────────────────────────────────────────────────────────

const FeedbackStars = ({ name, value, onChange, accentColor }) => (
  <div className="fb-stars" role="radiogroup" aria-label={name}>
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        className={`fb-star ${star <= value ? "is-active" : ""}`}
        style={star <= value ? { color: accentColor } : {}}
        onClick={() => onChange(name, star)}
        aria-label={`${name}: ${star} star${star > 1 ? "s" : ""}`}
      >
        ★
      </button>
    ))}
    <span className="fb-star-val" style={{ color: accentColor }}>
      {value}/5
    </span>
  </div>
);

// ─── Recent feedback card ────────────────────────────────────────────────────

const FeedbackCard = ({ item }) => {
  const expTag  = scoreTag(item.platformExperience);
  const useTag  = scoreTag(item.usability);
  const effTag  = scoreTag(item.effectiveness);

  return (
    <article className="fb-history-card">
      <div className="fb-history-card-top">
        <strong className="fb-history-name">{item.userName || "Anonymous"}</strong>
        <span className="fb-history-date">{formatDate(item.createdAt)}</span>
      </div>

      <div className="fb-history-tags">
        {/* Experience */}
        <div className="fb-history-tag-row">
          <span className="fb-section-dot" style={{ background: "#1a6fb5" }} />
          <span className="fb-section-label" style={{ color: "#1a6fb5" }}>Experience</span>
          <span
            className="fb-score-tag"
            style={{ background: expTag.bg, color: expTag.color }}
          >
            {item.platformExperience}/5 · {expTag.label}
          </span>
        </div>

        {/* Usability */}
        <div className="fb-history-tag-row">
          <span className="fb-section-dot" style={{ background: "#6b21a8" }} />
          <span className="fb-section-label" style={{ color: "#6b21a8" }}>Usability</span>
          <span
            className="fb-score-tag"
            style={{ background: useTag.bg, color: useTag.color }}
          >
            {item.usability}/5 · {useTag.label}
          </span>
        </div>

        {/* Effectiveness */}
        <div className="fb-history-tag-row">
          <span className="fb-section-dot" style={{ background: "#b45309" }} />
          <span className="fb-section-label" style={{ color: "#b45309" }}>Safety Features</span>
          <span
            className="fb-score-tag"
            style={{ background: effTag.bg, color: effTag.color }}
          >
            {item.effectiveness}/5 · {effTag.label}
          </span>
        </div>
      </div>

      {item.comment && (
        <blockquote className="fb-history-comment">
          "{item.comment}"
        </blockquote>
      )}
    </article>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const FeedbackPage = () => {
  const { user }            = useAuth();
  const [error, setError]   = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [entries, setEntries] = useState([]);
  const [activeSection, setActiveSection] = useState(0);   // wizard step

  const [formData, setFormData] = useState({
    ...defaultForm,
    userName:  user?.name  || defaultForm.userName,
    userEmail: user?.email || defaultForm.userEmail,
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      userName:  user?.name  || prev.userName  || defaultForm.userName,
      userEmail: user?.email || prev.userEmail || defaultForm.userEmail,
    }));
  }, [user]);

  const loadFeedbackEntries = async () => {
    try {
      setLoadingEntries(true);
      const response = await fetch(`${API_BASE_URL}/feedback`);
      const data     = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load feedback");
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => { loadFeedbackEntries(); }, []);

  const handleFieldChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleStarChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError("");
    try {
      const payload = {
        ...formData,
        platformExperience: Number(formData.platformExperience),
        usability:          Number(formData.usability),
        effectiveness:      Number(formData.effectiveness),
      };

      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || "Failed to submit feedback");

      setEntries((prev) => [data.feedback, ...prev].slice(0, 20));
      setFormData({
        ...defaultForm,
        userName:  user?.name  || defaultForm.userName,
        userEmail: user?.email || defaultForm.userEmail,
      });
      setActiveSection(0);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fb-shell">
      {/* ── Top bar ── */}
      <header className="fb-topbar">
        <h1>Platform Feedback</h1>
        <p className="fb-topbar-sub">Help us improve SafeRoute BD for everyone.</p>
      </header>

      {!submitted ? (
        <main className="fb-main">
          {/* ── Section nav tabs ── */}
          <div className="fb-section-tabs">
            {FEEDBACK_SECTIONS.map((sec, idx) => (
              <button
                key={sec.key}
                type="button"
                className={`fb-section-tab ${activeSection === idx ? "is-active" : ""}`}
                style={activeSection === idx
                  ? { borderColor: sec.color, color: sec.color, background: sec.bg }
                  : {}}
                onClick={() => setActiveSection(idx)}
              >
                <span className="fb-tab-icon">{sec.icon}</span>
                <span className="fb-tab-label">{sec.tag}</span>
              </button>
            ))}
          </div>

          {/* ── Active section content ── */}
          {FEEDBACK_SECTIONS.map((sec, idx) => {
            if (idx !== activeSection) return null;

            return (
              <section
                key={sec.key}
                className="fb-section-panel"
                style={{ borderColor: sec.border, background: sec.bg }}
              >
                <div className="fb-section-panel-header">
                  <span
                    className="fb-section-number"
                    style={{ background: sec.color }}
                  >
                    {sec.number}
                  </span>
                  <div>
                    <h2 className="fb-section-title" style={{ color: sec.color }}>
                      {sec.icon} {sec.title}
                    </h2>
                    <p className="fb-section-prompt">{sec.prompt}</p>
                  </div>
                </div>

                {sec.isText ? (
                  <textarea
                    name="comment"
                    value={formData.comment}
                    onChange={handleFieldChange}
                    className="fb-textarea"
                    style={{ borderColor: sec.border }}
                    placeholder="Type your thoughts here…"
                    rows={5}
                  />
                ) : (
                  <FeedbackStars
                    name={sec.key}
                    value={formData[sec.key]}
                    onChange={handleStarChange}
                    accentColor={sec.color}
                  />
                )}

                {/* nav between sections */}
                <div className="fb-section-nav">
                  {idx > 0 && (
                    <button
                      type="button"
                      className="fb-nav-btn fb-nav-prev"
                      onClick={() => setActiveSection(idx - 1)}
                    >
                      ← Back
                    </button>
                  )}
                  {idx < FEEDBACK_SECTIONS.length - 1 ? (
                    <button
                      type="button"
                      className="fb-nav-btn fb-nav-next"
                      style={{ background: sec.color }}
                      onClick={() => setActiveSection(idx + 1)}
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="fb-nav-btn fb-nav-submit"
                      style={{ background: sec.color }}
                      onClick={handleSubmit}
                    >
                      Submit Feedback ✓
                    </button>
                  )}
                </div>
              </section>
            );
          })}

          {/* ── Summary bar (always visible) ── */}
          <div className="fb-summary-bar">
            {FEEDBACK_SECTIONS.filter((s) => !s.isText).map((sec) => {
              const tag = scoreTag(formData[sec.key]);
              return (
                <div
                  key={sec.key}
                  className="fb-summary-chip"
                  style={{ background: sec.bg, borderColor: sec.border }}
                  onClick={() => setActiveSection(FEEDBACK_SECTIONS.indexOf(sec))}
                >
                  <span className="fb-summary-chip-icon">{sec.icon}</span>
                  <span className="fb-summary-chip-score" style={{ color: sec.color }}>
                    {formData[sec.key]}/5
                  </span>
                  <span
                    className="fb-summary-chip-tag"
                    style={{ background: tag.bg, color: tag.color }}
                  >
                    {tag.label}
                  </span>
                </div>
              );
            })}
          </div>

          {error && <div className="vehicle-inline-alert is-error">{error}</div>}

          {/* ── Recent feedback section ── */}
          <section className="fb-history-section">
            <div className="fb-history-head">
              <h3>Community Feedback</h3>
              <button type="button" className="vehicle-action-pill" onClick={loadFeedbackEntries}>
                Refresh
              </button>
            </div>

            {loadingEntries ? (
              <div className="vehicle-inline-alert">Loading recent feedback…</div>
            ) : entries.length ? (
              <div className="fb-history-list">
                {entries.slice(0, 6).map((item) => (
                  <FeedbackCard key={item._id} item={item} />
                ))}
              </div>
            ) : (
              <div className="vehicle-inline-alert">No feedback submitted yet. Be the first!</div>
            )}
          </section>
        </main>
      ) : (
        /* ── Success state ── */
        <main className="fb-success-panel">
          <div className="fb-success-icon">✅</div>
          <h2>Thank you for your feedback!</h2>
          <p>Your input helps make roads safer for everyone.</p>

          {/* score summary */}
          <div className="fb-success-scores">
            {FEEDBACK_SECTIONS.filter((s) => !s.isText).map((sec) => {
              const tag = scoreTag(Number(formData[sec.key]) || 5);
              return (
                <div
                  key={sec.key}
                  className="fb-success-score-chip"
                  style={{ background: sec.bg, borderColor: sec.border }}
                >
                  <span>{sec.icon} {sec.tag}</span>
                  <span
                    className="fb-score-tag"
                    style={{ background: tag.bg, color: tag.color }}
                  >
                    {formData[sec.key]}/5 · {tag.label}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="fb-nav-btn fb-nav-submit"
            style={{ background: "#065f46" }}
            onClick={() => setSubmitted(false)}
          >
            Submit Another Response
          </button>

          <section className="fb-history-section" style={{ marginTop: 32 }}>
            <div className="fb-history-head">
              <h3>Latest Saved Feedback</h3>
              <button type="button" className="vehicle-action-pill" onClick={loadFeedbackEntries}>
                Refresh
              </button>
            </div>
            {entries.length ? (
              <div className="fb-history-list">
                {entries.slice(0, 3).map((item) => (
                  <FeedbackCard key={item._id} item={item} />
                ))}
              </div>
            ) : (
              <div className="vehicle-inline-alert">Refresh once if the list is still empty.</div>
            )}
          </section>
        </main>
      )}
    </div>
  );
};

export default FeedbackPage;
