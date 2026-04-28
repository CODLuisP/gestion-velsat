"use client";

import toast from "react-hot-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (usuario: string, password: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password }),
      });
      if (!res.ok) throw new Error("Credenciales incorrectas");
      toast.success("¡Ingreso Autorizado!");
      router.push("/panel/dashboard");
    } catch (err) {
      setError("Usuario o contraseña incorrectos");
      setLoading(false);
    }
  };


  
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');

        :root {
          --ink:          #0A0C0F;
          --ink-soft:     #1C1F26;
          --rule:         rgba(255,255,255,0.06);
          --rule-strong:  rgba(255,255,255,0.11);
          --text-primary: #F4F5F7;
          --text-secondary:#8A9099;
          --text-tertiary: #adb5bd;
          --accent:       #E85D2F;
          --gold:         #C9A86C;
          --success:      #2ECC71;
          --font-display: 'Syne', sans-serif;
          --font-body:    'DM Sans', sans-serif;
        }

        /* ── LAYOUT ── */

        .vl-root {
          min-height: 100vh;
          display: flex;
          font-family: var(--font-body);
          background: var(--ink);
          color: var(--text-primary);
          overflow: hidden;
        }

        /* ── LEFT ── */

        .vl-left {
          position: relative;
          width: 100%;
          max-width: 540px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 48px;
          z-index: 10;
          border-right: 1px solid var(--rule);
          background: var(--ink-soft);
          overflow: hidden;
        }

        /* Subtle noise */
        .vl-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.6;
        }

        /* Accent glow top-right */
        .vl-left::after {
          content: '';
          position: absolute;
          top: -80px; right: -80px;
          width: 280px; height: 280px;
          background: radial-gradient(circle, rgba(232,93,47,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .vl-left-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        /* ── LOGO ── */

        .vl-logo {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: auto;
          padding-bottom: 48px;
        }

        .vl-logo-emblem {
          width: 42px; height: 42px;
          border-radius: 9px;
          background: rgba(232,93,47,0.12);
          border: 1px solid rgba(232,93,47,0.25);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          color: var(--accent);
        }

        .vl-logo-text h1 {
         
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: var(--text-primary);
          text-transform: uppercase;
          line-height: 1;
        }

        .vl-logo-text h1 span { color: var(--accent); }

        .vl-logo-text p {
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-tertiary);
          margin-top: 3px;
          font-weight: 400;
        }

        /* ── FORM AREA ── */

        .vl-form-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        /* ── FOOTER ── */

        .vl-footer {
          padding-top: 28px;
          border-top: 1px solid var(--rule);
          margin-top: 48px;
        }

        .vl-footer-badges {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 16px;
        }

        .vl-badge-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-tertiary);
          font-weight: 500;
        }

        .vl-badge-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--success);
          flex-shrink: 0;
        }

        .vl-footer-meta {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-tertiary);
        }

        /* ── RIGHT ── */

        .vl-right {
          flex: 1;
          position: relative;
          display: none;
          overflow: hidden;
          background: var(--ink);
        }

        @media (min-width: 1024px) {
          .vl-right { display: flex; align-items: center; justify-content: center; }
        }

        .vl-right::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(var(--rule) 1px, transparent 1px),
            linear-gradient(90deg, var(--rule) 1px, transparent 1px);
          background-size: 64px 64px;
          pointer-events: none;
        }

        .vl-right::after {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 60% 50%, rgba(232,93,47,0.06) 0%, transparent 65%);
          pointer-events: none;
        }

        .vl-right-content {
          position: relative;
          z-index: 1;
          max-width: 520px;
          padding: 64px;
          width: 100%;
        }

        /* ── PREVIEW CARD ── */

        .preview-card {
          background: var(--ink-soft);
          border: 1px solid var(--rule-strong);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 40px;
        }

        .preview-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid var(--rule);
          background: rgba(255,255,255,0.02);
        }

        .preview-dots { display: flex; gap: 6px; }
        .preview-dot  { width: 8px; height: 8px; border-radius: 50%; }
        .pd-red       { background: #E24B4A; opacity: .7; }
        .pd-amber     { background: #EF9F27; opacity: .7; }
        .pd-green     { background: #2ECC71; opacity: .7; }

        .preview-title-chip {
          font-size: 11px;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--text-tertiary);
          font-family: var(--font-display);
          font-weight: 600;
        }

        .preview-badge {
          font-size: 9px;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--success);
          border: 1px solid rgba(46,204,113,.3);
          padding: 3px 8px;
          border-radius: 20px;
          font-weight: 500;
        }

        .preview-body { padding: 20px; }

        .preview-stats-row {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .stat-block {
          background: rgba(255,255,255,.03);
          border: 1px solid var(--rule);
          border-radius: 8px;
          padding: 14px 12px;
        }

        .stat-label {
          font-size: 9px; letter-spacing: .1em; text-transform: uppercase;
          color: var(--text-tertiary); margin-bottom: 6px; display: block;
        }

        .stat-value {
          font-family: var(--font-display);
          font-size: 22px; font-weight: 700;
          color: var(--text-primary); line-height: 1;
        }

        .stat-value.s-accent { color: var(--accent); }
        .stat-value.s-gold   { color: var(--gold); }
        .stat-delta { font-size: 9px; color: var(--success); margin-top: 4px; display: block; font-weight: 500; }

        .preview-map {
          background: rgba(255,255,255,.02);
          border: 1px solid var(--rule);
          border-radius: 8px;
          height: 100px;
          position: relative;
          overflow: hidden;
        }

        .map-dots-grid {
          position: absolute; inset: 0;
          display: grid;
          grid-template-columns: repeat(12,1fr);
          grid-template-rows: repeat(5,1fr);
          opacity: .35;
        }

        .map-dot {
          width: 3px; height: 3px; border-radius: 50%;
          background: var(--text-tertiary);
          align-self: center; justify-self: center;
        }

        .map-ping {
          position: absolute;
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--accent);
          animation: mping 2s ease-in-out infinite;
        }

        .map-ping-b {
          position: absolute;
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--gold);
          animation: mping 2.5s ease-in-out infinite;
          animation-delay: .8s;
        }

        @keyframes mping {
          0%,100% { box-shadow: 0 0 0 0 rgba(232,93,47,.4); }
          50%      { box-shadow: 0 0 0 6px rgba(232,93,47,0); }
        }

        /* ── FEATURE LIST ── */

        .feature-list { display: flex; flex-direction: column; gap: 16px; }
        .feature-item { display: flex; align-items: flex-start; gap: 16px; }

        .feature-icon-wrap {
          width: 36px; height: 36px;
          border-radius: 8px;
          border: 1px solid var(--rule-strong);
          background: rgba(255,255,255,.03);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          color: var(--accent);
        }

        .feature-text h4 {
          font-family: var(--font-display);
          font-size: 13px; font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 3px; letter-spacing: .02em;
        }

        .feature-text p {
          font-size: 12px; color: var(--text-tertiary);
          line-height: 1.5; font-weight: 300;
        }

        .vl-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--rule-strong), transparent);
          margin: 32px 0;
        }

        @media (max-width: 640px) {
          .vl-left { padding: 32px 24px; }
        }
      `}</style>

      <main className="vl-root">

        {/* ── LEFT ── */}
        <section className="vl-left">
          <div className="vl-left-inner">

            {/* Logo */}
            <div className="vl-logo">
              <div className="vl-logo-emblem">
                <img src="/logoVelsat.jpg" alt="" className="rounded-lg p-0.2" />
              </div>
              <div className="vl-logo-text">
                <h1>Gestión <span>Velsat</span></h1>
                <p>Recursos Empresariales</p>
              </div>
            </div>

            {/* Form */}
            <div className="vl-form-area">
              <LoginForm onSubmit={handleSubmit} loading={loading} error={error} />
            </div>

            {/* Footer */}
            <div className="vl-footer">
              <div className="vl-footer-badges">
                <div className="vl-badge-item">
                  <div className="vl-badge-dot" />
                  <span>SSL Activo</span>
                </div>
                <div className="vl-badge-item">
                  <div className="vl-badge-dot" />
                  <span>Sistema Operativo</span>
                </div>
              </div>
              <div className="vl-footer-meta">
                <span>&copy; {new Date().getFullYear()} Velsat S.A.C.</span>
                <span>v1.0.0 · Producción</span>
              </div>
            </div>

          </div>
        </section>

        {/* ── RIGHT ── */}
        <section className="vl-right">
          <div className="vl-right-content">

           <div >
            <img src="/panelderecho.png" alt="" width={800}/>
           </div>

            <div className="vl-divider" />

          <div className="feature-list">

  <div className="feature-item">
    <div className="feature-icon-wrap">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    </div>
    <div className="feature-text">
      <h4>Monitoreo en tiempo real</h4>
      <p>Rastreo continuo de unidades con actualizaciones al instante. Ver unidades · Alertas · Rutas.</p>
    </div>
  </div>

  <div className="feature-item">
    <div className="feature-icon-wrap">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="8" r="4"/>
        <path d="M2 20c0-4 3.1-7 8-7"/>
        <line x1="19" y1="11" x2="19" y2="17"/>
        <line x1="16" y1="14" x2="22" y2="14"/>
      </svg>
    </div>
    <div className="feature-text">
      <h4>Gestión de usuarios y flota</h4>
      <p>Administra vehículos, operadores y permisos desde un solo lugar.</p>
    </div>
  </div>

  <div className="feature-item">
    <div className="feature-icon-wrap">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
      </svg>
    </div>
    <div className="feature-text">
      <h4>Reportes y acceso seguro</h4>
      <p>Analítica operativa con conexión encriptada SSL para personal autorizado.</p>
    </div>
  </div>

</div>

          </div>
        </section>

      </main>
    </>
  );
}