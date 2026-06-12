/* screens.jsx — SmartAttendance screens + tab bar + face check-in flow.
   Exports to window: Header, TabBar, HomeScreen, PointageScreen, HistoriqueScreen, DemandesScreen, ProfileScreen */

const { useState, useEffect, useRef } = React;

// ── Demo data ────────────────────────────────────────────────────────────────
const USER = { first: 'Amine', last: 'Berrada', role: 'Développeur produit',
  dept: 'Ingénierie', email: 'amine.berrada@axion.io', initials: 'AB' };

const WEEK = [
  { label: 'L', v: 8.2 }, { label: 'M', v: 7.8 }, { label: 'M', v: 8.5 },
  { label: 'J', v: 8.0 }, { label: 'V', v: 6.4 }, { label: 'S', v: 0 }, { label: 'D', v: 0 },
];

const HISTORY = [
  { day: "Aujourd'hui", rows: [
    { type: 'in', time: '08:54', loc: 'Siège — Casablanca', conf: 98 },
  ] },
  { day: 'Hier', rows: [
    { type: 'out', time: '18:12', loc: 'Siège — Casablanca', conf: 97 },
    { type: 'in', time: '09:02', loc: 'Siège — Casablanca', conf: 99 },
  ] },
  { day: 'Mardi 28 mai', rows: [
    { type: 'out', time: '17:45', loc: 'Télétravail', conf: 95 },
    { type: 'in', time: '08:48', loc: 'Télétravail', conf: 96 },
  ] },
];

const BALANCES = [
  { label: 'Congés payés', remaining: 14, total: 22, tone: 'primary' },
  { label: 'RTT', remaining: 5, total: 9, tone: 'accent' },
  { label: 'Maladie', remaining: 3, total: 3, tone: 'success' },
];

const LEAVES = [
  { type: 'Congés payés', range: '12 – 16 août 2025', status: 'En attente', tone: 'warning', reason: 'Vacances en famille' },
  { type: 'RTT', range: '4 juillet 2025', status: 'Approuvé', tone: 'success' },
  { type: 'Congé sans solde', range: '20 – 21 juin 2025', status: 'Refusé', tone: 'neutral', reject: 'Période de forte activité' },
];

const ABSENCES = [
  { type: 'Absence non justifiée', date: 'Vendredi 23 mai 2025', status: 'À justifier', tone: 'warning', canJustify: true },
  { type: 'Retard', date: 'Lundi 19 mai 2025', status: 'Justifié', tone: 'success' },
];

// ── Shared header ────────────────────────────────────────────────────────────
function Header({ eyebrow = 'SmartAttendance', title, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      gap: 12, padding: '4px 0 14px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 800,
          letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--primary)' }}>{eyebrow}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700,
          color: 'var(--ink)', letterSpacing: -0.5, lineHeight: 1.05 }}>{title}</span>
      </div>
      {right}
    </div>
  );
}

function Bell({ count = 2, onClick }) {
  return (
    <button onClick={onClick} style={{ position: 'relative', border: '1px solid var(--line)',
      background: 'var(--surface)', width: 44, height: 44, borderRadius: 14, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }}>
      <Icon name="bell" size={21} stroke={1.9} />
      {count > 0 && (
        <span style={{ position: 'absolute', top: 8, right: 9, width: 8, height: 8,
          borderRadius: 999, background: 'var(--accent)', border: '2px solid var(--surface)' }} />
      )}
    </button>
  );
}

function Avatar({ size = 44, ring }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.34,
      background: 'linear-gradient(140deg, var(--primary), color-mix(in srgb, var(--primary) 55%, var(--accent)))',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      boxShadow: ring ? '0 0 0 3px var(--surface), 0 0 0 5px var(--p-soft2)' : 'none' }}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff',
        fontSize: size * 0.36 }}>{USER.initials}</span>
    </div>
  );
}

// ── Custom tab bar with elevated scan button ─────────────────────────────────
function TabBar({ active, onChange }) {
  const items = [
    { key: 'home', icon: 'home', label: 'Accueil' },
    { key: 'historique', icon: 'clock', label: 'Historique' },
    { key: 'pointage', icon: 'face', label: '', center: true },
    { key: 'demandes', icon: 'doc', label: 'Demandes' },
    { key: 'profile', icon: 'user', label: 'Profil' },
  ];
  return (
    <div style={{ flexShrink: 0, position: 'relative', background: 'var(--surface)',
      borderTop: '1px solid var(--line)', paddingBottom: 24,
      boxShadow: '0 -8px 24px color-mix(in srgb, var(--ink) 6%, transparent)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around',
        padding: '10px 8px 4px' }}>
        {items.map((it) => {
          if (it.center) {
            const on = active === it.key;
            return (
              <button key={it.key} onClick={() => onChange(it.key)} style={{
                border: 'none', cursor: 'pointer', background: 'transparent',
                marginTop: -34, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 62, height: 62, borderRadius: 22,
                  background: 'linear-gradient(150deg, var(--primary), color-mix(in srgb, var(--primary) 70%, #000))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: on
                    ? '0 10px 24px color-mix(in srgb, var(--primary) 55%, transparent), 0 0 0 5px var(--p-soft)'
                    : '0 10px 22px color-mix(in srgb, var(--primary) 42%, transparent)',
                  transform: on ? 'translateY(-2px)' : 'none', transition: 'all .25s ease' }}>
                  <Icon name="scan" size={28} color="#fff" stroke={2.1} />
                </div>
              </button>
            );
          }
          const on = active === it.key;
          return (
            <button key={it.key} onClick={() => onChange(it.key)} style={{
              border: 'none', cursor: 'pointer', background: 'transparent', flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              color: on ? 'var(--primary)' : 'var(--muted2)', padding: '4px 0' }}>
              <Icon name={it.icon} size={23} stroke={on ? 2.3 : 1.9} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 10.5,
                fontWeight: on ? 800 : 600 }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Scroll body wrapper ──────────────────────────────────────────────────────
function Body({ children, pad = true }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
      background: 'var(--bg)' }}>
      <div style={{ padding: pad ? '14px 20px 28px' : 0, display: 'flex',
        flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  );
}

// ── HOME ─────────────────────────────────────────────────────────────────────
function HomeScreen({ checkedIn, sinceMs, arrival, dateLabel, go, openNotif }) {
  return (
    <Body>
      <Header title={`Bonjour, ${USER.first}`} right={<Bell onClick={openNotif} />} />
      <span style={{ marginTop: 2, fontFamily: 'var(--font-body)', fontSize: 14.5,
        color: 'var(--muted)', fontWeight: 500 }}>{dateLabel}</span>

      {/* Hero status card */}
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <div style={{ padding: 20, background: checkedIn
          ? 'linear-gradient(150deg, var(--surface), var(--surface))'
          : 'linear-gradient(155deg, var(--primary), color-mix(in srgb, var(--primary) 60%, var(--accent)))',
          position: 'relative' }}>
          {!checkedIn ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 700,
                    color: 'rgba(255,255,255,0.85)', letterSpacing: 0.3 }}>STATUT DU JOUR</span>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 23, fontWeight: 700,
                    color: '#fff', marginTop: 4 }}>Pas encore pointé</div>
                </div>
                <div style={{ width: 46, height: 46, borderRadius: 16, background: 'rgba(255,255,255,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="face" size={24} color="#fff" stroke={2} />
                </div>
              </div>
              <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 13.5,
                color: 'rgba(255,255,255,0.9)', lineHeight: 1.45 }}>
                Lancez la reconnaissance faciale pour enregistrer votre arrivée en un instant.</p>
              <button onClick={() => go('pointage')} style={{ border: 'none', cursor: 'pointer',
                background: '#fff', color: 'var(--primary)', borderRadius: 'var(--r)',
                padding: '15px', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
                <Icon name="scan" size={20} stroke={2.2} /> Pointer mon arrivée
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Pill tone="success"><span style={{ width: 6, height: 6, borderRadius: 999,
                  background: 'var(--success)' }} />En service</Pill>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600,
                  color: 'var(--muted)' }}>Arrivée {arrival}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 700,
                  color: 'var(--muted)', letterSpacing: 0.3 }}>TEMPS DE TRAVAIL</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 700,
                  color: 'var(--ink)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: -1 }}>
                  {fmtTimer(sinceMs)}</span>
              </div>
              <button onClick={() => go('pointage')} style={{ border: '1px solid var(--line)', cursor: 'pointer',
                background: 'var(--surface2)', color: 'var(--ink)', borderRadius: 'var(--r)',
                padding: '15px', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
                <Icon name="arrowOut" size={20} stroke={2.1} color="var(--accent)" /> Pointer ma sortie
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Today stat chips */}
      <div style={{ display: 'flex', gap: 10 }}>
        <StatChip icon="arrowIn" label="ARRIVÉE" value={checkedIn ? arrival : '—'} tone="success" />
        <StatChip icon="clockSmall" label="AUJOURD'HUI" value={checkedIn ? fmtTimer(sinceMs).slice(0,5) : '—'} tone="primary" />
        <StatChip icon="trend" label="SEMAINE" value="38h54" tone="accent" />
      </div>

      {/* Weekly chart */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
            color: 'var(--ink)' }}>Cette semaine</span>
          <Pill tone="primary">96% à l'heure</Pill>
        </div>
        <MiniBars data={WEEK} accentIndex={4} />
      </Card>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <SoftButton icon="calendar" label="Demander un congé" tone="primary" onClick={() => go('demandes')} />
        <SoftButton icon="doc" label="Justifier une absence" tone="accent" onClick={() => go('demandes')} />
      </div>
    </Body>
  );
}

// ── POINTAGE — signature face check-in flow ──────────────────────────────────
function PointageScreen({ mode, onComplete }) {
  const [phase, setPhase] = useState('idle'); // idle | scanning | success
  const [statusText, setStatusText] = useState('Placez votre visage dans le cadre');
  const timers = useRef([]);
  const isOut = mode === 'out';

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const start = () => {
    if (phase === 'scanning') return;
    setPhase('scanning');
    const seq = [
      [0, 'Détection du visage…'],
      [700, 'Analyse des traits…'],
      [1500, 'Vérification de l\'identité…'],
    ];
    seq.forEach(([d, txt]) => timers.current.push(setTimeout(() => setStatusText(txt), d)));
    timers.current.push(setTimeout(() => setPhase('success'), 2300));
  };

  const reset = () => { setPhase('idle'); setStatusText('Placez votre visage dans le cadre'); };

  const accent = isOut ? 'var(--accent)' : 'var(--primary)';
  const now = new Date();
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(120% 90% at 50% 18%, #1d2740 0%, #0a0e1a 70%)' }}>
      {/* subtle scan grid */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5,
        backgroundImage: 'linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)',
        backgroundSize: '34px 34px' }} />

      {/* top labels */}
      <div style={{ position: 'absolute', top: 56, left: 0, right: 0, padding: '0 24px',
        textAlign: 'center', zIndex: 4 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 800,
          letterSpacing: 1.6, color: 'rgba(255,255,255,0.55)' }}>RECONNAISSANCE FACIALE</span>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700,
          color: '#fff', marginTop: 4 }}>{isOut ? 'Pointer la sortie' : 'Pointer l\'arrivée'}</div>
      </div>

      {/* face frame */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column' }}>
        <div className={phase === 'scanning' ? 'sa-pulse' : ''} style={{ position: 'relative',
          width: 234, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* oval mask with silhouette */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '48% 48% 46% 46% / 56% 56% 44% 44%',
            overflow: 'hidden', background: 'linear-gradient(180deg, #2a3550, #161d30)',
            boxShadow: phase === 'success'
              ? '0 0 0 4px var(--success), 0 0 50px color-mix(in srgb, var(--success) 60%, transparent)'
              : `0 0 0 3px ${phase === 'scanning' ? accent : 'rgba(255,255,255,0.35)'}`,
            transition: 'box-shadow .4s ease' }}>
            {/* silhouette */}
            <svg viewBox="0 0 234 300" width="234" height="300" style={{ position: 'absolute', bottom: -6, opacity: 0.5 }}>
              <circle cx="117" cy="118" r="52" fill="rgba(255,255,255,0.14)" />
              <path d="M40 300c0-46 34-78 77-78s77 32 77 78" fill="rgba(255,255,255,0.14)" />
            </svg>
            {/* scan sweep */}
            {phase === 'scanning' && (
              <div className="sa-sweep" style={{ position: 'absolute', left: 0, right: 0, height: 56,
                background: `linear-gradient(180deg, transparent, color-mix(in srgb, ${accent} 55%, transparent), transparent)` }} />
            )}
            {/* success check */}
            {phase === 'success' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                justifyContent: 'center', background: 'color-mix(in srgb, var(--success) 22%, transparent)' }}>
                <div className="sa-pop" style={{ width: 76, height: 76, borderRadius: 999,
                  background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                  <Icon name="check" size={40} color="#fff" stroke={3} />
                </div>
              </div>
            )}
          </div>
          {/* corner brackets */}
          {phase !== 'success' && [0,1,2,3].map((c) => (
            <div key={c} style={{ position: 'absolute', width: 26, height: 26,
              borderColor: phase === 'scanning' ? accent : 'rgba(255,255,255,0.6)', borderStyle: 'solid',
              borderWidth: c < 2 ? '3px 0 0 0' : '0 0 3px 0',
              borderLeftWidth: c % 2 === 0 ? 3 : 0, borderRightWidth: c % 2 === 1 ? 3 : 0,
              borderTopLeftRadius: c === 0 ? 10 : 0, borderTopRightRadius: c === 1 ? 10 : 0,
              borderBottomLeftRadius: c === 2 ? 10 : 0, borderBottomRightRadius: c === 3 ? 10 : 0,
              top: c < 2 ? -10 : 'auto', bottom: c >= 2 ? -10 : 'auto',
              left: c % 2 === 0 ? -10 : 'auto', right: c % 2 === 1 ? -10 : 'auto',
              transition: 'border-color .3s' }} />
          ))}
        </div>
        <span style={{ marginTop: 30, fontFamily: 'var(--font-body)', fontSize: 14.5,
          fontWeight: 600, color: 'rgba(255,255,255,0.85)', minHeight: 20, textAlign: 'center',
          padding: '0 30px' }}>
          {phase === 'success' ? 'Identité confirmée' : statusText}</span>
      </div>

      {/* bottom area */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 36, padding: '0 22px', zIndex: 5 }}>
        {phase === 'success' ? (
          <div className="sa-rise" style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)',
            padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar size={48} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700,
                  color: 'var(--ink)' }}>{USER.first} {USER.last}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--muted)' }}>{USER.dept}</div>
              </div>
              <Pill tone="success"><Icon name="shield" size={13} stroke={2.2} />98%</Pill>
            </div>
            <div style={{ height: 1, background: 'var(--line)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name={isOut ? 'arrowOut' : 'arrowIn'} size={18}
                  color={isOut ? 'var(--accent)' : 'var(--success)'} stroke={2.2} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700,
                  color: 'var(--ink)' }}>{isOut ? 'Sortie' : 'Arrivée'} enregistrée</span>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
                color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{timeStr}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)' }}>
              <Icon name="location" size={14} stroke={2} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12.5 }}>Siège — Casablanca · GPS vérifié</span>
            </div>
            <button onClick={() => onComplete(isOut ? 'out' : 'in')} style={{ border: 'none', cursor: 'pointer',
              background: 'var(--primary)', color: '#fff', borderRadius: 'var(--r)', padding: '15px',
              fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 15 }}>Terminé</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="location" size={14} color="rgba(255,255,255,0.6)" stroke={2} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12.5,
                color: 'rgba(255,255,255,0.6)' }}>Siège — Casablanca</span>
            </div>
            <button onClick={start} disabled={phase === 'scanning'} style={{ border: 'none',
              cursor: phase === 'scanning' ? 'default' : 'pointer', width: 76, height: 76, borderRadius: 999,
              background: phase === 'scanning' ? 'rgba(255,255,255,0.25)' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: phase === 'scanning' ? 'none' : '0 8px 30px rgba(255,255,255,0.25)' }}>
              {phase === 'scanning'
                ? <div className="sa-spin" style={{ width: 30, height: 30, borderRadius: 999,
                    border: '3px solid rgba(255,255,255,0.35)', borderTopColor: '#fff' }} />
                : <div style={{ width: 56, height: 56, borderRadius: 999, background: accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="scan" size={26} color="#fff" stroke={2.3} /></div>}
            </button>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12,
              color: 'rgba(255,255,255,0.45)' }}>Touchez pour scanner</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── HISTORIQUE ───────────────────────────────────────────────────────────────
function HistoriqueScreen() {
  return (
    <Body>
      <Header title="Historique" />
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
              color: 'var(--muted)', letterSpacing: 0.3 }}>SEMAINE DU 26 MAI</span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700,
              color: 'var(--ink)', marginTop: 2 }}>38h 54
              <span style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 600 }}> / 40h</span></div>
          </div>
          <Pill tone="success"><Icon name="trend" size={13} stroke={2.2} />+2%</Pill>
        </div>
        <MiniBars data={WEEK} accentIndex={4} height={70} />
      </Card>

      {HISTORY.map((group) => (
        <div key={group.day} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 800,
            color: 'var(--muted2)', letterSpacing: 0.6, textTransform: 'uppercase',
            padding: '4px 2px 0' }}>{group.day}</span>
          {group.rows.map((r, i) => {
            const isIn = r.type === 'in';
            return (
              <Card key={i} pad={14} style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                <div style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                  background: isIn ? 'var(--ok-soft)' : 'var(--a-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={isIn ? 'arrowIn' : 'arrowOut'} size={20} stroke={2.2}
                    color={isIn ? 'var(--success)' : 'var(--accent)'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
                    color: 'var(--ink)' }}>{isIn ? 'Entrée' : 'Sortie'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted)' }}>
                    <Icon name="location" size={12} stroke={2} />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>{r.loc}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700,
                    color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{r.time}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end',
                    color: 'var(--primary)' }}>
                    <Icon name="scan" size={10} stroke={2.4} />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 10.5, fontWeight: 700 }}>{r.conf}%</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ))}
    </Body>
  );
}

// ── DEMANDES ─────────────────────────────────────────────────────────────────
function DemandesScreen({ openNew }) {
  const [tab, setTab] = useState('leaves');
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Body>
        <Header title="Demandes" />
        {/* Segmented control */}
        <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--surface2)',
          borderRadius: 'var(--r)', border: '1px solid var(--line)' }}>
          {[['leaves', 'Congés'], ['absences', 'Absences']].map(([k, l]) => {
            const on = tab === k;
            return (
              <button key={k} onClick={() => setTab(k)} style={{ flex: 1, border: 'none', cursor: 'pointer',
                background: on ? 'var(--surface)' : 'transparent', color: on ? 'var(--ink)' : 'var(--muted)',
                borderRadius: 'calc(var(--r) - 6px)', padding: '10px', fontFamily: 'var(--font-body)',
                fontWeight: 700, fontSize: 14, boxShadow: on ? 'var(--shadow)' : 'none',
                transition: 'all .2s' }}>{l}</button>
            );
          })}
        </div>

        {tab === 'leaves' ? (
          <React.Fragment>
            <Card>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 800,
                color: 'var(--muted)', letterSpacing: 0.4, textTransform: 'uppercase' }}>Mes soldes</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginTop: 14 }}>
                {BALANCES.map((b) => (
                  <div key={b.label} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600,
                        color: 'var(--ink)' }}>{b.label}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
                        color: 'var(--ink)' }}>{b.remaining}
                        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}> / {b.total} j</span></span>
                    </div>
                    <ProgressBar value={b.remaining} total={b.total} tone={b.tone} />
                  </div>
                ))}
              </div>
            </Card>
            {LEAVES.map((lv, i) => <RequestCard key={i} item={lv} kind="leave" />)}
          </React.Fragment>
        ) : (
          ABSENCES.map((ab, i) => <RequestCard key={i} item={ab} kind="absence" />)
        )}
      </Body>

      {tab === 'leaves' && (
        <button onClick={openNew} style={{ position: 'absolute', bottom: 22, right: 20, width: 56, height: 56,
          borderRadius: 20, border: 'none', cursor: 'pointer', background: 'var(--primary)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 28px color-mix(in srgb, var(--primary) 50%, transparent)' }}>
          <Icon name="plus" size={26} color="#fff" stroke={2.4} />
        </button>
      )}
    </div>
  );
}

function RequestCard({ item, kind }) {
  return (
    <Card pad={16} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
            color: 'var(--ink)' }}>{item.type}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--muted)', marginTop: 2 }}>
            <Icon name="calendar" size={13} stroke={2} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12.5 }}>{item.range || item.date}</span>
          </div>
        </div>
        <Pill tone={item.tone}>{item.status}</Pill>
      </div>
      {item.reason && <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 13,
        color: 'var(--muted)', lineHeight: 1.4 }}>{item.reason}</p>}
      {item.reject && <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start',
        background: 'color-mix(in srgb, var(--danger) 9%, transparent)', borderRadius: 12, padding: '9px 11px' }}>
        <Icon name="bell" size={13} color="var(--danger)" stroke={2} style={{ marginTop: 1 }} />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--danger)',
          fontWeight: 500 }}>Motif : {item.reject}</span></div>}
      {item.canJustify && (
        <button style={{ alignSelf: 'flex-start', border: 'none', cursor: 'pointer',
          background: 'var(--p-soft)', color: 'var(--primary)', borderRadius: 999, padding: '9px 15px',
          fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12.5, display: 'flex',
          alignItems: 'center', gap: 6 }}>
          <Icon name="doc" size={14} stroke={2.1} /> Justifier
        </button>
      )}
    </Card>
  );
}

// ── PROFILE ──────────────────────────────────────────────────────────────────
function ProfileScreen({ dark, onToggleDark, onLogout }) {
  return (
    <Body>
      <Header title="Profil" />
      <Card style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
        <Avatar size={60} ring />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700,
            color: 'var(--ink)' }}>{USER.first} {USER.last}</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)' }}>{USER.email}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <Pill tone="primary">{USER.role}</Pill>
            <Pill tone="neutral">{USER.dept}</Pill>
          </div>
        </div>
      </Card>

      {/* Reference photo */}
      <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 800,
            color: 'var(--muted)', letterSpacing: 0.4, textTransform: 'uppercase' }}>Photo de référence</span>
          <Pill tone="success"><Icon name="checkCircle" size={13} stroke={2.2} />Validée</Pill>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <div style={{ width: 78, height: 78, borderRadius: '46% 46% 44% 44% / 54% 54% 46% 46%',
            background: 'linear-gradient(180deg, #2a3550, #161d30)', overflow: 'hidden', flexShrink: 0,
            boxShadow: '0 0 0 3px var(--ok-soft)', position: 'relative' }}>
            <svg viewBox="0 0 78 78" width="78" height="78" style={{ position: 'absolute', bottom: -2 }}>
              <circle cx="39" cy="30" r="17" fill="rgba(255,255,255,0.2)" />
              <path d="M11 78c0-16 12-27 28-27s28 11 28 27" fill="rgba(255,255,255,0.2)" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 10px', fontFamily: 'var(--font-body)', fontSize: 12.5,
              color: 'var(--muted)', lineHeight: 1.45 }}>
              Cette photo identifie votre visage lors du pointage.</p>
            <button style={{ border: 'none', cursor: 'pointer', background: 'var(--p-soft)',
              color: 'var(--primary)', borderRadius: 999, padding: '9px 15px', fontFamily: 'var(--font-body)',
              fontWeight: 700, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="camera" size={15} stroke={2} /> Changer la photo
            </button>
          </div>
        </div>
      </Card>

      {/* Settings list */}
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <SettingRow icon="globe" label="Langue" detail="Français" />
        <SettingRow icon="bell" label="Notifications" detail="Activées" />
        <SettingRow icon="moon" label="Mode sombre" toggle value={dark} onToggle={onToggleDark} />
        <SettingRow icon="shield" label="Sécurité & appareil" detail="iPhone · cet appareil" last />
      </Card>

      <button onClick={onLogout} style={{ border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)', cursor: 'pointer',
        background: 'color-mix(in srgb, var(--danger) 8%, transparent)', color: 'var(--danger)',
        borderRadius: 'var(--r)', padding: '15px', fontFamily: 'var(--font-body)', fontWeight: 700,
        fontSize: 14.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
        <Icon name="logout" size={19} stroke={2.1} /> Se déconnecter
      </button>
      <span style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 11.5,
        color: 'var(--muted2)' }}>SmartAttendance · v2.0</span>
    </Body>
  );
}

function SettingRow({ icon, label, detail, toggle, value, onToggle, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px',
      borderBottom: last ? 'none' : '1px solid var(--line)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--p-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
        <Icon name={icon} size={18} stroke={2} />
      </div>
      <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 14.5, fontWeight: 600,
        color: 'var(--ink)' }}>{label}</span>
      {toggle ? (
        <button onClick={onToggle} style={{ border: 'none', cursor: 'pointer', width: 48, height: 28,
          borderRadius: 999, padding: 3, background: value ? 'var(--primary)' : 'var(--line)',
          transition: 'background .2s', display: 'flex', justifyContent: value ? 'flex-end' : 'flex-start' }}>
          <div style={{ width: 22, height: 22, borderRadius: 999, background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'all .2s' }} />
        </button>
      ) : (
        <React.Fragment>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--muted)' }}>{detail}</span>
          <Icon name="chevron" size={16} color="var(--muted2)" stroke={2.2} />
        </React.Fragment>
      )}
    </div>
  );
}

Object.assign(window, { USER, Header, TabBar, HomeScreen, PointageScreen: React.memo(PointageScreen),
  HistoriqueScreen, DemandesScreen, ProfileScreen });
