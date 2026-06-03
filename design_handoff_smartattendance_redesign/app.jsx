/* app.jsx — SmartAttendance redesign shell: tweaks, navigation, live clock, scaling stage */

const { useState, useEffect, useRef, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "primary": "#2F5BFF",
  "accent": "#FF8A3D",
  "font": "expressive",
  "radius": "soft",
  "dark": false
}/*EDITMODE-END*/;

// Scaling stage: fit the 402×874 device into any viewport, letterboxed.
function useFitScale(w, h, pad = 28) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => {
      const vw = window.innerWidth || document.documentElement.clientWidth || w;
      const vh = window.innerHeight || document.documentElement.clientHeight || h;
      const sx = (vw - pad * 2) / w;
      const sy = (vh - pad * 2) / h;
      const next = Math.min(1, sx, sy);
      if (next > 0.05) setScale(next); // ignore bogus 0-size measurements
    };
    fit();
    // a few rAF retries catch late iframe sizing where no resize event fires
    let n = 0;
    const id = setInterval(() => { fit(); if (++n > 8) clearInterval(id); }, 120);
    window.addEventListener('resize', fit);
    window.visualViewport && window.visualViewport.addEventListener('resize', fit);
    return () => {
      clearInterval(id);
      window.removeEventListener('resize', fit);
      window.visualViewport && window.visualViewport.removeEventListener('resize', fit);
    };
  }, [w, h, pad]);
  return scale;
}

// Bottom sheet overlay
function Sheet({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 80,
      display: 'flex', alignItems: 'flex-end', background: 'rgba(8,11,20,0.45)',
      backdropFilter: 'blur(2px)' }}>
      <div className="sa-rise" onClick={(e) => e.stopPropagation()} style={{ width: '100%',
        background: 'var(--surface)', borderRadius: '26px 26px 0 0', padding: '12px 20px 30px',
        maxHeight: '78%', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 5, borderRadius: 999, background: 'var(--line)',
          margin: '0 auto 14px' }} />
        {children}
      </div>
    </div>
  );
}

const NOTIFS = [
  { icon: 'checkCircle', tone: 'success', title: 'Congé approuvé', body: 'Votre RTT du 4 juillet a été validé.', time: 'il y a 2 h' },
  { icon: 'bell', tone: 'warning', title: 'Absence à justifier', body: 'Absence du 23 mai en attente de justificatif.', time: 'Hier' },
  { icon: 'shield', tone: 'primary', title: 'Nouvel appareil', body: 'Connexion depuis iPhone 15 Pro.', time: '2 jours' },
];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = useState('home');
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInAt, setCheckInAt] = useState(null);
  const [arrival, setArrival] = useState('—');
  const [now, setNow] = useState(Date.now());
  const [notifOpen, setNotifOpen] = useState(false);
  const [newLeaveOpen, setNewLeaveOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const vars = buildVars(t);
  const scale = useFitScale(402, 874);

  const dateLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(/^./, (c) => c.toUpperCase());

  const handleComplete = useCallback((type) => {
    if (type === 'in') {
      const d = new Date();
      setCheckedIn(true);
      setCheckInAt(d.getTime());
      setArrival(d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    } else {
      setCheckedIn(false);
      setCheckInAt(null);
    }
    setTab('home');
  }, []);

  const sinceMs = checkInAt ? now - checkInAt : 0;

  const screen = (() => {
    switch (tab) {
      case 'home': return <HomeScreen checkedIn={checkedIn} sinceMs={sinceMs} arrival={arrival}
        dateLabel={dateLabel} go={setTab} openNotif={() => setNotifOpen(true)} />;
      case 'pointage': return <PointageScreen mode={checkedIn ? 'out' : 'in'} onComplete={handleComplete} />;
      case 'historique': return <HistoriqueScreen />;
      case 'demandes': return <DemandesScreen openNew={() => setNewLeaveOpen(true)} />;
      case 'profile': return <ProfileScreen dark={t.dark} onToggleDark={() => setTweak('dark', !t.dark)} />;
      default: return null;
    }
  })();

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
      justifyContent: 'center', overflow: 'hidden',
      background: t.dark
        ? 'radial-gradient(110% 80% at 50% 0%, #11182b 0%, #05070d 60%)'
        : 'radial-gradient(110% 80% at 50% 0%, #e9edf9 0%, #c9d2ec 70%)' }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
        <div style={{ ...vars, fontFamily: 'var(--font-body)' }}>
          <IOSDevice dark={t.dark}>
            <div style={{ position: 'relative', height: '100%', display: 'flex',
              flexDirection: 'column', background: tab === 'pointage' ? '#0a0e1a' : 'var(--bg)' }}>
              {/* top safe-area spacer for status bar / dynamic island */}
              {tab !== 'pointage' && <div style={{ height: 58, flexShrink: 0, background: 'var(--bg)' }} />}
              {screen}
              {tab !== 'pointage' && <TabBar active={tab} onChange={setTab} />}
              {tab === 'pointage' && (
                <button onClick={() => setTab('home')} style={{ position: 'absolute', top: 58, left: 18,
                  zIndex: 6, width: 40, height: 40, borderRadius: 13, border: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center' }}>
                  <Icon name="chevron" size={20} color="#fff" stroke={2.2} style={{ transform: 'rotate(180deg)' }} />
                </button>
              )}

              {/* Notifications sheet */}
              <Sheet open={notifOpen} onClose={() => setNotifOpen(false)}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 700,
                  color: 'var(--ink)', marginBottom: 14 }}>Notifications</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {NOTIFS.map((n, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 'var(--r)',
                      background: 'var(--surface2)', border: '1px solid var(--line)' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                        background: n.tone === 'success' ? 'var(--ok-soft)' : n.tone === 'warning' ? 'var(--warn-soft)' : 'var(--p-soft)',
                        color: n.tone === 'success' ? 'var(--success)' : n.tone === 'warning' ? 'var(--warning)' : 'var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={n.icon} size={19} stroke={2.1} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700,
                            color: 'var(--ink)' }}>{n.title}</span>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted2)',
                            flexShrink: 0 }}>{n.time}</span>
                        </div>
                        <p style={{ margin: '3px 0 0', fontFamily: 'var(--font-body)', fontSize: 12.5,
                          color: 'var(--muted)', lineHeight: 1.4 }}>{n.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Sheet>

              {/* New leave sheet */}
              <Sheet open={newLeaveOpen} onClose={() => setNewLeaveOpen(false)}>
                <NewLeaveForm onClose={() => setNewLeaveOpen(false)} />
              </Sheet>
            </div>
          </IOSDevice>
        </div>
      </div>

      <TweaksPanel>
        <TweakSection label="Marque" />
        <TweakColor label="Couleur principale" value={t.primary}
          options={['#2F5BFF', '#5B4BFF', '#0EA5A4', '#16A34A', '#E0457B']}
          onChange={(v) => setTweak('primary', v)} />
        <TweakColor label="Accent" value={t.accent}
          options={['#FF8A3D', '#F5C518', '#FF5A8A', '#34D399']}
          onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Typographie" />
        <TweakRadio label="Police" value={t.font}
          options={['expressive', 'geometric', 'classic']}
          onChange={(v) => setTweak('font', v)} />
        <TweakSection label="Forme & thème" />
        <TweakRadio label="Arrondi" value={t.radius}
          options={['sharp', 'soft', 'round']}
          onChange={(v) => setTweak('radius', v)} />
        <TweakToggle label="Mode sombre" value={t.dark}
          onChange={(v) => setTweak('dark', v)} />
      </TweaksPanel>
    </div>
  );
}

function NewLeaveForm({ onClose }) {
  const [type, setType] = useState('Congés payés');
  const types = ['Congés payés', 'RTT', 'Sans solde', 'Maladie'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 700,
        color: 'var(--ink)' }}>Nouvelle demande</div>
      <div>
        <label style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
          color: 'var(--muted)', letterSpacing: 0.3, textTransform: 'uppercase' }}>Type</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 9 }}>
          {types.map((ty) => {
            const on = type === ty;
            return (
              <button key={ty} onClick={() => setType(ty)} style={{ border: '1px solid',
                borderColor: on ? 'var(--primary)' : 'var(--line)', cursor: 'pointer',
                background: on ? 'var(--p-soft)' : 'var(--surface2)',
                color: on ? 'var(--primary)' : 'var(--muted)', borderRadius: 999, padding: '9px 14px',
                fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13 }}>{ty}</button>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {[['Du', '12 août'], ['Au', '16 août']].map(([l, v]) => (
          <div key={l} style={{ flex: 1 }}>
            <label style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
              color: 'var(--muted)', letterSpacing: 0.3, textTransform: 'uppercase' }}>{l}</label>
            <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 9, padding: '13px 14px',
              borderRadius: 'var(--r)', background: 'var(--surface2)', border: '1px solid var(--line)' }}>
              <Icon name="calendar" size={17} color="var(--primary)" stroke={2} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
                color: 'var(--ink)' }}>{v}</span>
            </div>
          </div>
        ))}
      </div>
      <div>
        <label style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
          color: 'var(--muted)', letterSpacing: 0.3, textTransform: 'uppercase' }}>Motif (optionnel)</label>
        <div style={{ marginTop: 9, padding: '13px 14px', borderRadius: 'var(--r)',
          background: 'var(--surface2)', border: '1px solid var(--line)', minHeight: 58,
          fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted2)' }}>Vacances en famille…</div>
      </div>
      <div style={{ background: 'var(--p-soft)', borderRadius: 'var(--r)', padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 9 }}>
        <Icon name="sparkle" size={16} color="var(--primary)" />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--primary)',
          fontWeight: 600 }}>Solde après demande : 9 jours restants</span>
      </div>
      <button onClick={onClose} style={{ border: 'none', cursor: 'pointer', background: 'var(--primary)',
        color: '#fff', borderRadius: 'var(--r)', padding: '16px', fontFamily: 'var(--font-body)',
        fontWeight: 800, fontSize: 15 }}>Envoyer la demande</button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
