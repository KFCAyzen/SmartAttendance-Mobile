/* login.jsx — SmartAttendance biometric-first login.
   A unique, interactive entry: animated aurora canvas, a tappable Face ID scan
   orb as the hero auth, and a polished credentials form behind a smooth toggle.
   Exports to window: LoginScreen */

const { useState, useEffect, useRef } = React;

const FALLBACK_USER = { first: 'Amine', last: 'Berrada', role: 'Développeur produit',
  dept: 'Ingénierie', email: 'amine.berrada@axion.io', initials: 'AB' };

// ── Ambient animated canvas ──────────────────────────────────────────────────
function AuthAura({ on = true }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#070A14' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5,
        backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)',
        backgroundSize: '42px 42px',
        maskImage: 'radial-gradient(120% 75% at 50% 8%, #000 30%, transparent 78%)',
        WebkitMaskImage: 'radial-gradient(120% 75% at 50% 8%, #000 30%, transparent 78%)' }} />
      {on && (
        <React.Fragment>
          <div className="sa-aura sa-aura1" style={{ background: 'var(--primary)' }} />
          <div className="sa-aura sa-aura2" style={{ background: 'var(--accent)' }} />
          <div className="sa-aura sa-aura3" style={{ background: '#6E5BFF' }} />
        </React.Fragment>
      )}
      <div style={{ position: 'absolute', inset: 0,
        background: 'radial-gradient(125% 80% at 50% -5%, transparent 42%, rgba(4,6,14,0.78) 100%)' }} />
    </div>
  );
}

// ── Brand lockup ─────────────────────────────────────────────────────────────
function BrandMark() {
  return (
    <div className="sa-fadein" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 46, height: 46, borderRadius: 15, flexShrink: 0,
        background: 'linear-gradient(150deg, var(--primary), color-mix(in srgb, var(--primary) 45%, var(--accent)))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 10px 26px color-mix(in srgb, var(--primary) 45%, transparent)' }}>
        <Icon name="scan" size={25} color="#fff" stroke={2.2} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
          color: '#fff', letterSpacing: -0.2, lineHeight: 1 }}>SmartAttendance</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, fontWeight: 600,
          color: 'rgba(255,255,255,0.5)', letterSpacing: 0.2 }}>Pointage par reconnaissance faciale</span>
      </div>
    </div>
  );
}

// ── Mode toggle (Face ID ⇄ Identifiants) ─────────────────────────────────────
function ModeToggle({ value, onChange }) {
  const opts = [
    { key: 'face', label: 'Face ID', icon: 'face' },
    { key: 'pwd', label: 'Identifiants', icon: 'lock' },
  ];
  const idx = value === 'face' ? 0 : 1;
  return (
    <div style={{ position: 'relative', display: 'flex', padding: 5, borderRadius: 16,
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
      <div style={{ position: 'absolute', top: 5, bottom: 5,
        left: `calc(5px + ${idx} * (50% - 5px))`, width: 'calc(50% - 5px)',
        borderRadius: 12, background: 'rgba(255,255,255,0.95)',
        boxShadow: '0 6px 16px rgba(0,0,0,0.28)',
        transition: 'left .28s cubic-bezier(.3,.7,.4,1)' }} />
      {opts.map((o) => {
        const on = value === o.key;
        return (
          <button key={o.key} onClick={() => onChange(o.key)} style={{ position: 'relative', zIndex: 1,
            flex: 1, border: 'none', cursor: 'pointer', background: 'transparent',
            padding: '11px 8px', borderRadius: 12, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 7, transition: 'color .2s',
            color: on ? '#0E1326' : 'rgba(255,255,255,0.62)' }}>
            <Icon name={o.icon} size={17} stroke={2.1} />
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13.5 }}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Face ID hero auth ────────────────────────────────────────────────────────
function FaceAuth({ user, onSuccess }) {
  const [phase, setPhase] = useState('idle'); // idle | scanning | success
  const [status, setStatus] = useState('Touchez pour vous authentifier');
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const start = () => {
    if (phase !== 'idle') return;
    setPhase('scanning');
    const seq = [
      [0, 'Détection du visage…'],
      [650, 'Analyse biométrique…'],
      [1400, "Vérification de l'identité…"],
    ];
    seq.forEach(([d, txt]) => timers.current.push(setTimeout(() => setStatus(txt), d)));
    timers.current.push(setTimeout(() => { setPhase('success'); setStatus('Identité confirmée'); }, 2200));
    timers.current.push(setTimeout(() => onSuccess(), 3150));
  };

  const ringColor = phase === 'success' ? 'var(--success)' : 'var(--primary)';
  const scanning = phase === 'scanning';
  const success = phase === 'success';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26,
      paddingTop: 14 }}>
      <div style={{ position: 'relative', width: 224, height: 224, display: 'flex',
        alignItems: 'center', justifyContent: 'center' }}>
        {/* idle pulse rings */}
        {phase === 'idle' && [0, 1, 2].map((i) => (
          <div key={i} className="sa-ring" style={{ width: 150, height: 150,
            border: '1.5px solid color-mix(in srgb, var(--primary) 65%, transparent)',
            animationDelay: `${i * 0.85}s` }} />
        ))}

        {/* rotating scan arc */}
        {scanning && (
          <div className="sa-spin" style={{ position: 'absolute', width: 196, height: 196,
            borderRadius: '50%', border: '3px solid transparent',
            borderTopColor: 'var(--primary)', borderRightColor: 'color-mix(in srgb, var(--primary) 40%, transparent)' }} />
        )}

        {/* glow halo */}
        <div style={{ position: 'absolute', width: 168, height: 168, borderRadius: '50%',
          background: `radial-gradient(circle, color-mix(in srgb, ${ringColor} 38%, transparent), transparent 68%)`,
          filter: 'blur(6px)', transition: 'background .4s' }} />

        {/* central orb */}
        <button onClick={start} disabled={phase !== 'idle'}
          className={scanning ? 'sa-pulse' : ''}
          style={{ position: 'relative', width: 132, height: 132, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.16)', cursor: phase === 'idle' ? 'pointer' : 'default',
            background: 'linear-gradient(160deg, rgba(40,52,82,0.85), rgba(16,22,38,0.92))',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: success
              ? '0 0 0 3px var(--success), 0 16px 40px color-mix(in srgb, var(--success) 45%, transparent)'
              : scanning
                ? '0 0 0 2px var(--primary), 0 16px 40px color-mix(in srgb, var(--primary) 45%, transparent)'
                : '0 16px 40px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.12)',
            transition: 'box-shadow .4s ease' }}>
          {!success && <Icon name="face" size={54} color="rgba(255,255,255,0.92)" stroke={1.7} />}
          {scanning && (
            <div className="sa-sweep" style={{ position: 'absolute', left: 0, right: 0, height: 44,
              background: 'linear-gradient(180deg, transparent, color-mix(in srgb, var(--primary) 60%, transparent), transparent)' }} />
          )}
          {success && (
            <div className="sa-pop" style={{ width: 70, height: 70, borderRadius: '50%',
              background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={38} color="#fff" stroke={3} />
            </div>
          )}
        </button>
      </div>

      {/* status + identity hint */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        textAlign: 'center', minHeight: 70 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600,
          color: success ? 'var(--success)' : 'rgba(255,255,255,0.9)', transition: 'color .3s' }}>{status}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px 8px 8px',
          paddingRight: 14, borderRadius: 999, background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(140deg, var(--primary), color-mix(in srgb, var(--primary) 55%, var(--accent)))',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', fontSize: 12 }}>{user.initials}</span>
          </div>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
            color: 'rgba(255,255,255,0.78)' }}>{user.first} {user.last}</span>
        </div>
      </div>
    </div>
  );
}

// ── Floating-label glass field ───────────────────────────────────────────────
function LoginField({ icon, label, type = 'text', value, onChange, trailing }) {
  const [focus, setFocus] = useState(false);
  const float = focus || (value && String(value).length > 0);
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12,
      padding: '0 14px', height: 60, borderRadius: 'var(--r)',
      background: 'rgba(255,255,255,0.06)',
      border: `1.5px solid ${focus ? 'var(--primary)' : 'rgba(255,255,255,0.12)'}`,
      boxShadow: focus ? '0 0 0 4px color-mix(in srgb, var(--primary) 20%, transparent)' : 'none',
      transition: 'border-color .2s, box-shadow .2s' }}>
      <Icon name={icon} size={20} stroke={2}
        color={focus ? 'var(--primary)' : 'rgba(255,255,255,0.5)'} style={{ transition: 'color .2s' }} />
      <div style={{ position: 'relative', flex: 1, height: '100%' }}>
        <label style={{ position: 'absolute', left: 0, pointerEvents: 'none',
          fontFamily: 'var(--font-body)', transformOrigin: 'left center',
          top: float ? 12 : '50%', transform: float ? 'none' : 'translateY(-50%)',
          fontSize: float ? 11 : 15, fontWeight: float ? 700 : 500,
          letterSpacing: float ? 0.4 : 0,
          color: focus ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
          textTransform: float ? 'uppercase' : 'none', transition: 'all .18s ease' }}>{label}</label>
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ position: 'absolute', inset: 0, width: '100%', border: 'none', outline: 'none',
            background: 'transparent', padding: '20px 0 6px', color: '#fff',
            fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600 }} />
      </div>
      {trailing}
    </div>
  );
}

// ── Credentials form ─────────────────────────────────────────────────────────
function CredForm({ user, onSuccess }) {
  const [email, setEmail] = useState(user.email);
  const [pwd, setPwd] = useState('Axion2025');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(null); // 'pwd' | 'sso'
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const submit = (which) => {
    if (loading) return;
    setLoading(which);
    timers.current.push(setTimeout(() => onSuccess(), 1150));
  };

  const spinner = (
    <div className="sa-spin" style={{ width: 19, height: 19, borderRadius: '50%',
      border: '2.5px solid rgba(255,255,255,0.35)', borderTopColor: '#fff' }} />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <LoginField icon="mail" label="Adresse e-mail" type="email" value={email} onChange={setEmail} />
      <LoginField icon="lock" label="Mot de passe" type={show ? 'text' : 'password'}
        value={pwd} onChange={setPwd}
        trailing={
          <button onClick={() => setShow((s) => !s)} style={{ border: 'none', cursor: 'pointer',
            background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 4, color: 'rgba(255,255,255,0.55)' }}>
            <Icon name={show ? 'eyeOff' : 'eye'} size={20} stroke={2} />
          </button>
        } />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '2px 2px 4px' }}>
        <button onClick={() => setRemember((r) => !r)} style={{ border: 'none', cursor: 'pointer',
          background: 'transparent', display: 'flex', alignItems: 'center', gap: 9, padding: 0 }}>
          <span style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0,
            border: `1.5px solid ${remember ? 'var(--primary)' : 'rgba(255,255,255,0.28)'}`,
            background: remember ? 'var(--primary)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
            {remember && <Icon name="check" size={13} color="#fff" stroke={3} />}
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
            color: 'rgba(255,255,255,0.7)' }}>Se souvenir de moi</span>
        </button>
        <button style={{ border: 'none', cursor: 'pointer', background: 'transparent', padding: 0,
          fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
          Mot de passe oublié ?
        </button>
      </div>

      <button onClick={() => submit('pwd')} disabled={!!loading} style={{ border: 'none',
        cursor: loading ? 'default' : 'pointer', height: 56, borderRadius: 'var(--r)',
        background: 'var(--primary)', color: '#fff', fontFamily: 'var(--font-body)',
        fontWeight: 800, fontSize: 15.5, display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 10,
        boxShadow: '0 14px 30px color-mix(in srgb, var(--primary) 45%, transparent)',
        opacity: loading === 'sso' ? 0.5 : 1, transition: 'opacity .2s' }}>
        {loading === 'pwd' ? spinner : <React.Fragment>Se connecter <Icon name="arrowRight" size={20} stroke={2.4} /></React.Fragment>}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, fontWeight: 600,
          color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 }}>OU</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
      </div>

      <button onClick={() => submit('sso')} disabled={!!loading} style={{
        cursor: loading ? 'default' : 'pointer', height: 54, borderRadius: 'var(--r)',
        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
        color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14.5,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        opacity: loading === 'pwd' ? 0.5 : 1, transition: 'opacity .2s' }}>
        {loading === 'sso' ? spinner : <React.Fragment><Icon name="key" size={19} stroke={2} color="var(--accent)" /> Continuer avec le SSO entreprise</React.Fragment>}
      </button>
    </div>
  );
}

// ── Login screen ─────────────────────────────────────────────────────────────
function LoginScreen({ defaultMethod = 'face', aura = true, onSuccess }) {
  const user = window.USER || FALLBACK_USER;
  const [method, setMethod] = useState(defaultMethod === 'identifiants' || defaultMethod === 'pwd' ? 'pwd' : 'face');

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden', color: '#fff',
      fontFamily: 'var(--font-body)' }}>
      <AuthAura on={aura} />

      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex',
        flexDirection: 'column', padding: '72px 26px 30px' }}>
        <BrandMark />

        <div className="sa-fadein" style={{ marginTop: 30, animationDelay: '.06s' }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 33, fontWeight: 700,
            color: '#fff', letterSpacing: -0.6, lineHeight: 1.05 }}>Bon retour.</h1>
          <p style={{ margin: '8px 0 0', fontFamily: 'var(--font-body)', fontSize: 14.5,
            color: 'rgba(255,255,255,0.6)', lineHeight: 1.45, maxWidth: 280 }}>
            Authentifiez-vous pour pointer votre journée.</p>
        </div>

        <div className="sa-fadein" style={{ marginTop: 24, animationDelay: '.12s' }}>
          <ModeToggle value={method} onChange={setMethod} />
        </div>

        <div className="sa-fadein" style={{ flex: 1, marginTop: 22, animationDelay: '.18s',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          {method === 'face'
            ? <FaceAuth key="face" user={user} onSuccess={onSuccess} />
            : <CredForm key="pwd" user={user} onSuccess={onSuccess} />}
        </div>

        <div className="sa-fadein" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 7, marginTop: 18, animationDelay: '.24s', color: 'rgba(255,255,255,0.42)' }}>
          <Icon name="shield" size={14} stroke={2} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, fontWeight: 500 }}>
            Connexion chiffrée de bout en bout</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen });
