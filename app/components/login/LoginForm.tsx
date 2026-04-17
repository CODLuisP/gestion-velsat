import React, { useState } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface LoginFormProps {
  onSubmit: (username: string, password: string) => void;
  loading: boolean;
  error: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  loading,
  error
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    if (!username || !password) {
      setValidationError('Ingrese su usuario y contraseña.');
      return;
    }
    onSubmit(username, password);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');

        .lf-root {
          --ink:          #0A0C0F;
          --ink-soft:     #1C1F26;
          --ink-muted:    #252830;
          --rule:         rgba(255,255,255,0.07);
          --rule-strong:  rgba(255,255,255,0.12);
          --text-primary: #F4F5F7;
          --text-secondary:#8A9099;
          --text-tertiary: #525760;
          --accent:       #E85D2F;
          --accent-dim:   rgba(232,93,47,0.15);
          --accent-glow:  rgba(232,93,47,0.07);
          --danger:       rgba(226,75,74,0.15);
          --danger-border:rgba(226,75,74,0.30);
          --danger-text:  #F09595;
          --success:      #2ECC71;
          font-family: 'DM Sans', sans-serif;
          color: var(--text-primary);
        }

        /* ── FORM WRAPPER ── */
        .lf-form { display: flex; flex-direction: column; gap: 0; }

        /* ── ERROR BANNER ── */
        .lf-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 8px;
          background: var(--danger);
          border: 1px solid var(--danger-border);
          color: var(--danger-text);
          font-size: 13px;
          margin-bottom: 20px;
          font-weight: 400;
        }

        /* ── EYEBROW ── */
        .lf-eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }
        .lf-eyebrow-line {
          width: 24px; height: 1px;
          background: var(--accent);
          flex-shrink: 0;
        }
        .lf-eyebrow span {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--accent);
          font-weight: 500;
        }

        /* ── HEADING ── */
        .lf-heading {
         
          font-size: 28px;
          font-weight: 500;
          line-height: 1.15;
          color: var(--text-primary);
          margin-bottom: 8px;
          letter-spacing: -0.01em;
        }

        .lf-subheading {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 36px;
          font-weight: 300;
        }

        /* ── FIELDS ── */
        .lf-fields { display: flex; flex-direction: column; gap: 18px; margin-bottom: 0; }

        .lf-field-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .lf-label-text {
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #dee2e6;
          font-weight: 500;
        }

        .lf-forgot {
          font-size: 11px;
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.2s;
          letter-spacing: 0.02em;
        }
        .lf-forgot:hover { color: var(--accent); }

        .lf-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .lf-input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-tertiary);
          pointer-events: none;
          display: flex;
          transition: color 0.2s;
        }

        .lf-input {
          width: 100%;
          height: 50px;
          background: var(--ink-muted);
          border: 1px solid var(--rule-strong);
          border-radius: 8px;
          padding: 0 14px 0 42px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          letter-spacing: 0.02em;
        }

        .lf-input::placeholder {
          color: var(--text-tertiary);
          font-weight: 300;
        }

        .lf-input:focus {
          border-color: var(--accent);
          background: var(--accent-glow);
          box-shadow: 0 0 0 3px var(--accent-dim);
        }

        .lf-input:focus ~ .lf-input-icon,
        .lf-input-wrap:focus-within .lf-input-icon {
          color: var(--accent);
        }

        .lf-input:disabled { opacity: 0.5; cursor: not-allowed; }

        .lf-eye-btn {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-tertiary);
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 0.2s;
          line-height: 0;
        }
        .lf-eye-btn:hover { color: var(--text-secondary); }

        /* ── OPTIONS ROW ── */
        .lf-options {
          display: flex;
          align-items: center;
          margin: 22px 0 28px;
        }

        .lf-checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-size: 12px;
          color: var(--text-secondary);
          user-select: none;
        }

        .lf-checkbox-box {
          width: 16px; height: 16px;
          border: 1px solid var(--rule-strong);
          border-radius: 4px;
          background: var(--ink-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .lf-checkbox-box.checked {
          background: var(--accent);
          border-color: var(--accent);
        }

        .lf-checkbox-native { display: none; }

        /* ── SUBMIT ── */
        .lf-submit {
          width: 100%;
          height: 52px;
          background: var(--accent);
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #e9ecef;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          position: relative;
          overflow: hidden;
          transition: opacity 0.2s, transform 0.15s;
        }

        .lf-submit::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
          pointer-events: none;
        }

        .lf-submit:hover:not(:disabled) { opacity: 0.88; }
        .lf-submit:active:not(:disabled) { transform: scale(0.99); }
        .lf-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        .lf-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: lf-spin 0.7s linear infinite;
        }

        @keyframes lf-spin { to { transform: rotate(360deg); } }

        /* ── INSTITUTIONAL BADGE ── */
        .lf-badge {
          margin-top: 24px;
          padding: 14px 16px;
          border-radius: 8px;
          border: 1px solid var(--rule-strong);
          background: rgba(255,255,255,0.03);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .lf-badge-icon {
          color: var(--accent);
          flex-shrink: 0;
          opacity: 0.8;
        }

        .lf-badge-text p:first-child {
          font-size: 11px;
          font-weight: 500;
          color: #ced4da;
          margin-bottom: 2px;
          letter-spacing: 0.02em;
        }

        .lf-badge-text p:last-child {
          font-size: 10px;
          color: #adb5bd;
          font-weight: 300;
          letter-spacing: 0.02em;
        }

        /* ── SEPARATOR ── */
        .lf-sep {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--rule-strong), transparent);
          margin: 28px 0;
        }
      `}</style>

      <div className="lf-root">
        {/* Eyebrow */}
        <div className="lf-eyebrow">
          <div className="lf-eyebrow-line" />
          <span>Acceso al sistema</span>
        </div>

        {/* Heading */}
        <h2 className="lf-heading">Panel de Control</h2>
        <p className="lf-subheading">
          Ingresa tus credenciales para acceder al sistema de monitoreo empresarial.
        </p>

        <form className="lf-form" onSubmit={handleLogin}>

          {/* Error banners */}
          {validationError && (
            <div className="lf-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {validationError}
            </div>
          )}
          {error && (
            <div className="lf-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Fields */}
          <div className="lf-fields">

            {/* Usuario */}
            <div>
              <div className="lf-field-label">
                <span className="lf-label-text">Usuario</span>
              </div>
              <div className="lf-input-wrap">
                <input
                  type="text"
                  className="lf-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  autoComplete="username"
                  disabled={loading}
                />
                <span className="lf-input-icon">
                  <User size={15} />
                </span>
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <div className="lf-field-label">
                <span className="lf-label-text">Contraseña</span>
                <a href="#" className="lf-forgot">¿Olvidaste la clave?</a>
              </div>
              <div className="lf-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="lf-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  style={{ paddingRight: '42px' }}
                />
                <span className="lf-input-icon">
                  <Lock size={15} />
                </span>
                <button
                  type="button"
                  className="lf-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          {/* Checkbox */}
          <div className="lf-options">
            <label className="lf-checkbox-label">
              <input
                id="remember"
                type="checkbox"
                className="lf-checkbox-native"
              />
              <CheckboxCustom />
              Mantener sesión iniciada
            </label>
          </div>

          {/* Submit */}
          <button type="submit" className="lf-submit" disabled={loading}>
            {loading ? (
              <>
                <span className="lf-spinner" />
                Verificando...
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Acceder al Sistema
              </>
            )}
          </button>

          {/* Separator */}
          <div className="lf-sep" />

          {/* Institutional badge */}
          <div className="lf-badge">
            <span className="lf-badge-icon">
              <ShieldCheck size={18} />
            </span>
            <div className="lf-badge-text">
              <p>Uso exclusivo para personal autorizado</p>
              <p>Sistema de Gestión de Recursos Empresariales – Velsat</p>
            </div>
          </div>

        </form>
      </div>
    </>
  );
};

/* Checkbox con estado controlado visualmente */
function CheckboxCustom() {
  const [checked, setChecked] = useState(false);
  return (
    <span
      className={`lf-checkbox-box${checked ? ' checked' : ''}`}
      onClick={() => setChecked(!checked)}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => e.key === ' ' && setChecked(!checked)}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
    </span>
  );
}