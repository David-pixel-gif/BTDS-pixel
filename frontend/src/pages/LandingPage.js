import React, { useEffect, useRef, useState } from "react";
import LandingData from "../data/landingData";

const configuredAppUrl = process.env.REACT_APP_APP_URL?.trim().replace(/\/+$/, "") || "";
const browserAppUrl = typeof window !== "undefined" ? window.location.origin.replace(/\/+$/, "") : "";
const diagnosisChatUrl = configuredAppUrl
  ? `${configuredAppUrl}/diagnosis-chat`
  : browserAppUrl
    ? `${browserAppUrl}/diagnosis-chat`
    : "/diagnosis-chat";

const diagnosisChatQrImageUrl = diagnosisChatUrl
  ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(diagnosisChatUrl)}`
  : "";

function useCountUp(target, duration = 1600, start = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return undefined;

    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, start, target]);

  return count;
}

function StatCard({ value, suffix, label, delay }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const count = useCountUp(value, 1500, visible);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.35 }
    );

    const element = ref.current;
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="lp-stat-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="lp-stat-value">
        {count}
        {suffix}
      </div>
      <div className="lp-stat-label">{label}</div>
    </div>
  );
}

function LandingPage() {
  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: var(--theme-font-sans);
          color: var(--lp-navy);
          background: var(--lp-white);
        }

        .lp-root a { color: inherit; }
        .lp-nav {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem clamp(1rem, 5vw, 4rem);
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--lp-border);
        }
        .lp-brand, .lp-nav-links, .lp-actions { display: flex; align-items: center; }
        .lp-brand {
          gap: 0.75rem;
          text-decoration: none;
          font-family: var(--theme-font-serif);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--lp-teal-dark);
        }
        .lp-brand-icon {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 0.8rem;
          display: grid;
          place-items: center;
          background: var(--lp-teal);
          color: var(--lp-white);
        }
        .lp-nav-links {
          gap: 1.5rem;
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .lp-nav-links a {
          text-decoration: none;
          color: var(--lp-slate);
          font-weight: 500;
        }
        .lp-actions { gap: 0.75rem; }
        .lp-btn, .lp-btn-outline {
          text-decoration: none;
          border-radius: 0.75rem;
          padding: 0.75rem 1.2rem;
          font-weight: 600;
          transition: 0.2s ease;
        }
        .lp-btn {
          background: var(--lp-teal);
          color: var(--lp-white);
          box-shadow: 0 10px 24px rgba(10, 123, 110, 0.18);
        }
        .lp-btn:hover { background: var(--lp-teal-dark); }
        .lp-btn-outline {
          border: 1px solid var(--lp-border);
          color: var(--lp-navy);
          background: var(--lp-white);
        }
        .lp-btn-outline:hover { border-color: var(--lp-teal); color: var(--lp-teal); }

        .lp-hero {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 3rem;
          padding: 5rem clamp(1rem, 6vw, 5rem);
          background:
            radial-gradient(circle at top left, rgba(10, 123, 110, 0.08), transparent 35%),
            linear-gradient(160deg, #f3fbf9 0%, #edf8f5 35%, #ffffff 100%);
        }
        .lp-kicker {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.85rem;
          border-radius: 999px;
          border: 1px solid #bfe1da;
          background: var(--lp-teal-soft);
          color: var(--lp-teal-dark);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .lp-dot {
          width: 0.45rem;
          height: 0.45rem;
          border-radius: 50%;
          background: var(--lp-teal);
        }
        .lp-title {
          margin: 1.25rem 0 1rem;
          font-family: var(--theme-font-serif);
          font-size: clamp(2.5rem, 5vw, 4.25rem);
          line-height: 1.05;
        }
        .lp-subtitle {
          max-width: 42rem;
          font-size: 1.05rem;
          line-height: 1.8;
          color: var(--lp-slate);
        }
        .lp-professional-note {
          margin-top: 1rem;
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.55rem 0.95rem;
          border-radius: 999px;
          background: #fff4df;
          color: #7d5810;
          border: 1px solid #ecd49c;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.03em;
        }
        .lp-hero-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-top: 2rem;
        }
        .lp-card {
          border: 1px solid var(--lp-border);
          border-radius: 1.5rem;
          background: rgba(255, 255, 255, 0.88);
          box-shadow: 0 18px 40px rgba(16, 39, 59, 0.08);
        }
        .lp-dashboard {
          padding: 1.5rem;
          display: grid;
          gap: 1rem;
        }
        .lp-dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 700;
        }
        .lp-live {
          color: var(--lp-teal);
          font-size: 0.85rem;
        }
        .lp-vitals {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.85rem;
        }
        .lp-vital {
          padding: 1rem;
          border-radius: 1rem;
          background: var(--lp-bg);
        }
        .lp-vital-label {
          color: var(--lp-slate);
          font-size: 0.8rem;
        }
        .lp-vital-value {
          margin-top: 0.35rem;
          font-size: 1.2rem;
          font-weight: 700;
        }
        .lp-pill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
        }
        .lp-pill {
          padding: 0.5rem 0.8rem;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 600;
          background: var(--lp-teal-soft);
          color: var(--lp-teal-dark);
        }
        .lp-pill-gold {
          background: #fbf4e3;
          color: #8a6a26;
        }
        .lp-whatsapp-card {
          margin-top: 1.25rem;
          padding: 1rem;
          border-radius: 1.25rem;
          background: linear-gradient(145deg, #effbf7 0%, #ffffff 100%);
          border: 1px solid #cde9df;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 1rem;
          align-items: center;
        }
        .lp-whatsapp-qr {
          width: 120px;
          height: 120px;
          border-radius: 1rem;
          background: #ffffff;
          border: 1px solid var(--lp-border);
          padding: 0.5rem;
          object-fit: contain;
        }
        .lp-whatsapp-copy {
          display: grid;
          gap: 0.45rem;
        }
        .lp-whatsapp-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--lp-navy);
        }
        .lp-whatsapp-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          width: fit-content;
          padding: 0.35rem 0.7rem;
          border-radius: 999px;
          background: #fff4df;
          color: #835f12;
          border: 1px solid #ecd49c;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .lp-whatsapp-text {
          color: var(--lp-slate);
          line-height: 1.65;
          font-size: 0.92rem;
        }
        .lp-whatsapp-link {
          justify-self: start;
          margin-top: 0.2rem;
        }

        .lp-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1rem;
          padding: 0 1rem 4rem;
          margin: -1.5rem auto 0;
          max-width: 1200px;
        }
        .lp-stat-card {
          padding: 1.3rem;
          border: 1px solid var(--lp-border);
          border-radius: 1.25rem;
          background: var(--lp-white);
          box-shadow: 0 12px 24px rgba(16, 39, 59, 0.06);
          animation: lpFadeUp 0.5s ease both;
        }
        .lp-stat-value {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 2rem;
          font-weight: 700;
        }
        .lp-stat-label {
          margin-top: 0.4rem;
          color: var(--lp-slate);
          font-size: 0.92rem;
        }

        .lp-section {
          padding: 4.5rem clamp(1rem, 6vw, 5rem);
        }
        .lp-section-alt { background: var(--lp-bg); }
        .lp-section-head {
          max-width: 44rem;
          margin-bottom: 2.5rem;
        }
        .lp-section-tag {
          color: var(--lp-teal);
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .lp-section-head h2 {
          margin: 0.7rem 0 0.9rem;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2rem, 4vw, 3rem);
        }
        .lp-section-head p {
          color: var(--lp-slate);
          line-height: 1.75;
        }
        .lp-grid-4, .lp-grid-2 {
          display: grid;
          gap: 1.25rem;
        }
        .lp-grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        .lp-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .lp-feature-card, .lp-trust-card {
          padding: 1.5rem;
          border: 1px solid var(--lp-border);
          border-radius: 1.25rem;
          background: var(--lp-white);
        }
        .lp-stage {
          color: var(--lp-teal);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .lp-feature-card h3, .lp-trust-card h3 {
          margin: 0.9rem 0 0.7rem;
          font-size: 1.1rem;
        }
        .lp-feature-card p, .lp-trust-card p {
          color: var(--lp-slate);
          line-height: 1.7;
        }
        .lp-visual {
          width: 3.25rem;
          height: 3.25rem;
          padding: 0.65rem;
          border-radius: 0.9rem;
          background: var(--lp-teal-soft);
        }
        .lp-checklist {
          display: grid;
          gap: 0.9rem;
        }
        .lp-check {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem 1.1rem;
          border-radius: 1rem;
          background: var(--lp-white);
          border: 1px solid var(--lp-border);
        }
        .lp-check span:last-child {
          color: var(--lp-teal);
          font-weight: 700;
        }

        .lp-footer {
          padding: 2rem clamp(1rem, 6vw, 5rem) 3rem;
          border-top: 1px solid var(--lp-border);
          background: #fcfefe;
        }
        .lp-footer-top, .lp-footer-bottom {
          display: flex;
          justify-content: space-between;
          gap: 1.25rem;
        }
        .lp-footer-top { align-items: flex-start; margin-bottom: 1.5rem; }
        .lp-footer-bottom {
          border-top: 1px solid var(--lp-border);
          padding-top: 1.25rem;
          color: var(--lp-slate);
          font-size: 0.9rem;
        }
        .lp-footer-links {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1.5rem;
        }
        .lp-footer-col {
          display: grid;
          gap: 0.65rem;
        }
        .lp-footer-col strong {
          font-size: 0.88rem;
          color: var(--lp-navy);
        }
        .lp-footer-col a {
          text-decoration: none;
          color: var(--lp-slate);
        }

        @keyframes lpFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 960px) {
          .lp-nav { flex-wrap: wrap; gap: 1rem; }
          .lp-nav-links { width: 100%; justify-content: center; flex-wrap: wrap; }
          .lp-hero, .lp-grid-2, .lp-stats { grid-template-columns: 1fr; }
          .lp-grid-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .lp-footer-top, .lp-footer-bottom { flex-direction: column; }
          .lp-footer-links { grid-template-columns: 1fr; }
        }

        @media (max-width: 640px) {
          .lp-actions { width: 100%; }
          .lp-actions a { flex: 1; text-align: center; }
          .lp-grid-4, .lp-vitals { grid-template-columns: 1fr; }
          .lp-whatsapp-card { grid-template-columns: 1fr; }
          .lp-whatsapp-qr { width: 160px; height: 160px; }
        }
      `}</style>

      <div className="lp-root">
        <nav className="lp-nav">
          <a href="/" className="lp-brand">
            <span className="lp-brand-icon">M</span>
            <span>MediCore</span>
          </a>
          <ul className="lp-nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">Pipeline</a></li>
            <li><a href="#security">Security</a></li>
          </ul>
          <div className="lp-actions">
            <a href="/login" className="lp-btn-outline">Sign In</a>
            <a href="/register" className="lp-btn">Get Started</a>
          </div>
        </nav>

        <section className="lp-hero">
          <div>
            <div className="lp-kicker">
              <span className="lp-dot" />
              Brain MRI Analysis Platform
            </div>
            <h1 className="lp-title">{LandingData.hero.title}</h1>
            <p className="lp-subtitle">{LandingData.hero.subtitle}</p>
            <div className="lp-professional-note">
              For Radiologists, Doctors, and Authorized Clinical Staff Only
            </div>
            <div className="lp-hero-actions">
              <a href={LandingData.hero.primaryCta.route} className="lp-btn">
                {LandingData.hero.primaryCta.label}
              </a>
              <a href={LandingData.hero.secondaryCta.anchor} className="lp-btn-outline">
                {LandingData.hero.secondaryCta.label}
              </a>
            </div>
            {diagnosisChatUrl ? (
              <div className="lp-whatsapp-card">
                <img
                  className="lp-whatsapp-qr"
                  src={diagnosisChatQrImageUrl}
                  alt="QR code to open in-app diagnosis chat"
                />
                <div className="lp-whatsapp-copy">
                  <div className="lp-whatsapp-badge">Medical Professionals Only</div>
                  <div className="lp-whatsapp-title">Scan QR to Open Diagnosis Chat</div>
                  <div className="lp-whatsapp-text">
                    Scan this code to open the in-app diagnosis chat used for MRI scan intake,
                    AI-assisted review, and report handoff. This access point is intended strictly
                    for authorized medical professionals operating within the clinical workflow.
                  </div>
                  <a
                    href={diagnosisChatUrl}
                    className="lp-btn lp-whatsapp-link"
                  >
                    Open Diagnosis Chat
                  </a>
                </div>
              </div>
            ) : null}
          </div>

          <div className="lp-card lp-dashboard">
            <div className="lp-dashboard-header">
              <span>Scan Summary</span>
              <span className="lp-live">Live review</span>
            </div>
            <div className="lp-vitals">
              <div className="lp-vital">
                <div className="lp-vital-label">Tumor Status</div>
                <div className="lp-vital-value">Detected</div>
              </div>
              <div className="lp-vital">
                <div className="lp-vital-label">Confidence</div>
                <div className="lp-vital-value">98.2%</div>
              </div>
              <div className="lp-vital">
                <div className="lp-vital-label">Tumor Class</div>
                <div className="lp-vital-value">Glioma</div>
              </div>
              <div className="lp-vital">
                <div className="lp-vital-label">Localization</div>
                <div className="lp-vital-value">Bounding Box Ready</div>
              </div>
            </div>
            <div className="lp-pill-row">
              <span className="lp-pill">Classification</span>
              <span className="lp-pill">Localization</span>
              <span className="lp-pill lp-pill-gold">Clinical Analytics</span>
            </div>
          </div>
        </section>

        <section className="lp-stats">
          <StatCard value={4} suffix="" label="Pipeline Stages" delay={0} />
          <StatCard value={98} suffix="%" label="Model Confidence Example" delay={80} />
          <StatCard value={3} suffix="" label="Tumor Categories" delay={160} />
          <StatCard value={24} suffix="/7" label="System Availability Goal" delay={240} />
        </section>

        <section className="lp-section" id="features">
          <div className="lp-section-head">
            <div className="lp-section-tag">Features</div>
            <h2>{LandingData.features.title}</h2>
            <p>The platform separates detection, tumor typing, localization, and outcome review into clear clinical steps.</p>
          </div>
          <div className="lp-grid-4">
            {LandingData.features.items.map((item) => {
              const Visual = item.visual;
              return (
                <article key={item.title} className="lp-feature-card">
                  <div className="lp-visual">{Visual ? <Visual /> : null}</div>
                  <div className="lp-stage">{item.stage}</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="lp-section lp-section-alt" id="how-it-works">
          <div className="lp-section-head">
            <div className="lp-section-tag">Workflow</div>
            <h2>Structured for review, not guesswork</h2>
            <p>Each stage is designed to make the prediction path easier to audit, validate, and explain in a clinical workflow.</p>
          </div>
          <div className="lp-grid-2">
            <div className="lp-trust-card">
              <h3>What the pipeline returns</h3>
              <div className="lp-checklist">
                <div className="lp-check"><span>Binary tumor screening</span><span>Ready</span></div>
                <div className="lp-check"><span>Multi-class categorization</span><span>Ready</span></div>
                <div className="lp-check"><span>Localization overlay support</span><span>Ready</span></div>
                <div className="lp-check"><span>Outcome and report views</span><span>Ready</span></div>
              </div>
            </div>
            <div className="lp-trust-card">
              <h3>Where it fits</h3>
              <p>Use it for MRI triage support, structured patient review, and reporting workflows tied to the MySQL-backed application state.</p>
            </div>
          </div>
        </section>

        <section className="lp-section" id="security">
          <div className="lp-section-head">
            <div className="lp-section-tag">Trust</div>
            <h2>{LandingData.trust.title}</h2>
            <p>The interface now relies on live application routes and persistent backend data rather than placeholder UI-only records.</p>
          </div>
          <div className="lp-grid-2">
            {LandingData.trust.items.map((item) => (
              <article key={item.title} className="lp-trust-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-section lp-section-alt">
          <div className="lp-section-head">
            <div className="lp-section-tag">Call To Action</div>
            <h2>{LandingData.cta.title}</h2>
            <p>{LandingData.cta.subtitle}</p>
          </div>
          <div className="lp-hero-actions">
            <a href={LandingData.cta.action.route} className="lp-btn">{LandingData.cta.action.label}</a>
            <a href="#features" className="lp-btn-outline">Review the pipeline</a>
          </div>
        </section>

        <footer className="lp-footer">
          <div className="lp-footer-top">
            <div>
              <a href="/" className="lp-brand">
                <span className="lp-brand-icon">M</span>
                <span>MediCore</span>
              </a>
              <p className="lp-subtitle" style={{ marginTop: "1rem", maxWidth: "28rem" }}>
                Precision-focused brain MRI analysis with live authentication, WhatsApp diagnosis intake,
                and MySQL-backed clinical records for professional use.
              </p>
            </div>
            <div className="lp-footer-links">
              <div className="lp-footer-col">
                <strong>Product</strong>
                <a href="#features">Features</a>
                <a href="#how-it-works">Pipeline</a>
                <a href="#security">Trust</a>
              </div>
              <div className="lp-footer-col">
                <strong>Access</strong>
                <a href="/login">Sign In</a>
                <a href="/register">Register</a>
                <a href="/home">Dashboard</a>
              </div>
              <div className="lp-footer-col">
                <strong>Platform</strong>
                <a href="/diagnosis">Diagnosis</a>
                <a href="/reports">Reports</a>
                <a href="/outcome-analysis">Outcome Analysis</a>
              </div>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>© 2026 MediCore Health Technologies. All rights reserved.</span>
            <span>Secured application workflow backed by MongoDB.</span>
          </div>
        </footer>
      </div>
    </>
  );
}

export default LandingPage;
