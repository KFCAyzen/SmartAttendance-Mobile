/* notif-app.jsx — SmartAttendance · Notifications page
   Creative, on-brand notification center: triage ("À traiter") + timeline feed,
   category filters, mark-as-read, dismiss, celebratory empty state. */

const { useState, useEffect, useMemo, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "primary": "#2F5BFF",
  "accent": "#FF8A3D",
  "font": "expressive",
  "radius": "soft",
  "dark": false,
  "showTimeline": true
}/*EDITMODE-END*/;

// ── Scaling stage ────────────────────────────────────────────────────────────
function useFitScale(w, h, pad = 28) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => {
      const vw = window.innerWidth || document.documentElement.clientWidth || w;
      const vh = window.innerHeight || document.documentElement.clientHeight || h;
      const next = Math.min(1, (vw - pad * 2) / w, (vh - pad * 2) / h);
      if (next > 0.05) setScale(next);
    };
    fit();
    let n = 0;
    const id = setInterval(() => { fit(); if (++n > 8) clearInterval(id); }, 120);
    window.addEventListener('resize', fit);
    return () => { clearInterval(id); window.removeEventListener('resize', fit); };
  }, [w, h, pad]);
  return scale;
}

// ── Tone helpers ─────────────────────────────────────────────────────────────
const TONE = {
  success: { soft: 'var(--ok-soft)',   fg: 'var(--success)' },
  warning: { soft: 'var(--warn-soft)', fg: 'var(--warning)' },
  primary: { soft: 'var(--p-soft)',    fg: 'var(--primary)' },
  accent:  { soft: 'var(--a-soft)',    fg: 'var(--accent)'  },
  danger:  { soft: 'color-mix(in srgb, var(--danger) 13%, transparent)', fg: 'var(--danger)' },
};

// cat → filter chip
const FILTERS = [
  { key: 'all',       label: 'Tout' },
  { key: 'pointage',  label: 'Pointage' },
  { key: 'conges',    label: 'Congés' },
  { key: 'securite',  label: 'Sécurité' },
];

// ── Demo data ────────────────────────────────────────────────────────────────
// pinned = lands in the "À traiter" triage block; others flow in the timeline.
const SEED = [
  { id: 'a1', pinned: true, cat: 'conges', tone: 'warning', icon: 'bell',
    title: 'Absence à justifier',
    body: "Votre absence du vendredi 23 mai est en attente d'un justificatif.",
    time: '09:12', action: 'Justifier', actionTone: 'warning' },
  { id: 'a2', pinned: true, cat: 'pointage', tone: 'accent', icon: 'clock',
    title: 'Oubli de pointage',
    body: 'Aucune sortie enregistrée mardi 27 mai. Pensez à régulariser.',
    time: 'Mar.', action: 'Régulariser', actionTone: 'accent' },
  { id: 'a3', pinned: true, cat: 'securite', tone: 'primary', icon: 'shield',
    title: 'Nouvel appareil connecté',
    body: 'Connexion depuis iPhone 15 Pro · Casablanca, à 21:40.',
    time: 'Lun.', action: "C'est moi", actionTone: 'primary' },

  { id: 'n1', group: 'today', cat: 'pointage', tone: 'success', icon: 'checkCircle', unread: true,
    title: 'Arrivée enregistrée', time: '08:54',
    body: 'Pointage validé au Siège — Casablanca · 98% de confiance.' },
  { id: 'n2', group: 'today', cat: 'conges', tone: 'success', icon: 'check', unread: true,
    title: 'Congé approuvé', time: '08:30', link: 'Voir la demande',
    body: 'Votre RTT du 4 juillet a été validé par Sofia Marwan.' },

  { id: 'n3', group: 'week', cat: 'conges', tone: 'primary', icon: 'calendar', unread: true,
    title: 'Rappel · solde de congés', time: 'Lun.',
    body: 'Il vous reste 14 jours à poser avant le 31 décembre.' },
  { id: 'n4', group: 'week', cat: 'pointage', tone: 'accent', icon: 'trend', unread: false,
    title: 'Bilan de la semaine', time: 'Dim.', link: "Voir l'historique",
    body: '38h54 travaillées · 96% de ponctualité. Beau parcours !' },

  { id: 'n5', group: 'earlier', cat: 'securite', tone: 'primary', icon: 'lock', unread: false,
    title: 'Mot de passe modifié', time: '24 mai',
    body: 'Votre mot de passe a été mis à jour avec succès.' },
  { id: 'n6', group: 'earlier', cat: 'conges', tone: 'success', icon: 'doc', unread: false,
    title: 'Justificatif accepté', time: '21 mai',
    body: 'Le certificat médical du 19 mai a bien été enregistré.' },
];

const GROUP_LABELS = { today: "Aujourd'hui", week: 'Cette semaine', earlier: 'Plus tôt' };

// ── Icon tile ────────────────────────────────────────────────────────────────
function IconTile({ icon, tone, size = 42, dim }) {
  const t = TONE[tone] || TONE.primary;
  return (
    <div style={{ width: size, height: size, borderRadius: 'var(--r-sm)', flexShrink: 0,
      background: t.soft, color: t.fg, display: 'flex', alignItems: 'center',
      justifyContent: 'center', opacity: dim ? 0.6 : 1 }}>
      <Icon name={icon} size={size * 0.46} stroke={2.1} />
    </div>
  );
}

// ── Triage card (À traiter) ──────────────────────────────────────────────────
function TriageCard({ n, onAction, onDismiss }) {
  const t = TONE[n.tone] || TONE.primary;
  return (
    <div style={{ position: 'relative', display: 'flex', gap: 13,
      background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)',
      padding: 15, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
      <IconTile icon={n.icon} tone={n.tone} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15.5, fontWeight: 700,
            color: 'var(--ink)' }}>{n.title}</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, fontWeight: 600,
            color: 'var(--muted2)', flexShrink: 0 }}>{n.time}</span>
        </div>
        <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-body)', fontSize: 12.8,
          color: 'var(--muted)', lineHeight: 1.45 }}>{n.body}</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={() => onAction(n)} style={{ border: 'none', cursor: 'pointer',
            background: t.fg, color: '#fff', borderRadius: 999, padding: '9px 16px',
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12.5,
            display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {n.action}
            <Icon name="arrowRight" size={14} stroke={2.4} color="#fff" />
          </button>
          <button onClick={() => onDismiss(n)} style={{ border: '1px solid var(--line)', cursor: 'pointer',
            background: 'transparent', color: 'var(--muted)', borderRadius: 999, padding: '9px 14px',
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12.5 }}>Ignorer</button>
        </div>
      </div>
    </div>
  );
}

// ── Timeline feed row ────────────────────────────────────────────────────────
function FeedRow({ n, timeline, last, onRead }) {
  const dim = !n.unread;
  return (
    <div onClick={() => n.unread && onRead(n.id)} style={{ position: 'relative',
      display: 'flex', gap: 13, cursor: n.unread ? 'pointer' : 'default',
      paddingLeft: timeline ? 4 : 0 }}>
      {/* timeline rail */}
      {timeline && (
        <div style={{ position: 'relative', width: 44, flexShrink: 0, display: 'flex',
          justifyContent: 'center' }}>
          {!last && <div style={{ position: 'absolute', top: 44, bottom: -16, width: 2,
            background: 'var(--line)', borderRadius: 2 }} />}
          <IconTile icon={n.icon} tone={n.tone} size={44} dim={dim} />
        </div>
      )}
      {!timeline && <IconTile icon={n.icon} tone={n.tone} size={42} dim={dim} />}

      <div style={{ flex: 1, minWidth: 0, paddingBottom: timeline ? 16 : 0,
        borderBottom: timeline ? 'none' : (last ? 'none' : '1px solid var(--line)') }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            {n.unread && <span className="sa-dot-live" style={{ width: 7, height: 7, borderRadius: 999,
              background: 'var(--accent)', flexShrink: 0 }} />}
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 14.5,
              fontWeight: n.unread ? 700 : 600, color: dim ? 'var(--muted)' : 'var(--ink)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</span>
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
            color: 'var(--muted2)', flexShrink: 0 }}>{n.time}</span>
        </div>
        <p style={{ margin: '3px 0 0', fontFamily: 'var(--font-body)', fontSize: 12.6,
          color: dim ? 'var(--muted2)' : 'var(--muted)', lineHeight: 1.45 }}>{n.body}</p>
        {n.link && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8,
            fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 700, color: 'var(--primary)' }}>
            {n.link} <Icon name="chevron" size={13} stroke={2.4} color="var(--primary)" />
          </span>
        )}
      </div>
    </div>
  );
}

// ── Empty triage state ───────────────────────────────────────────────────────
function AllClear() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14,
      background: 'var(--ok-soft)', border: '1px solid color-mix(in srgb, var(--success) 22%, transparent)',
      borderRadius: 'var(--r-lg)', padding: '16px 18px' }}>
      <div className="sa-pop" style={{ width: 42, height: 42, borderRadius: 999, flexShrink: 0,
        background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="check" size={22} stroke={2.6} color="#fff" />
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15.5, fontWeight: 700,
          color: 'var(--ink)' }}>Tout est à jour</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.6, color: 'var(--muted)',
          marginTop: 2 }}>Aucune action en attente. Profitez de votre journée.</div>
      </div>
    </div>
  );
}

// ── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      margin: '2px 2px 0' }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, fontWeight: 800,
        letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted2)' }}>{children}</span>
      {right}
    </div>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────
function NotificationsScreen({ t }) {
  const [items, setItems] = useState(SEED);
  const [collapsing, setCollapsing] = useState({}); // id → true while animating out
  const [filter, setFilter] = useState('all');

  const visible = filter === 'all' ? items : items.filter((n) => n.cat === filter);
  const triage = visible.filter((n) => n.pinned);
  const feed = visible.filter((n) => !n.pinned);
  const unreadCount = items.filter((n) => !n.pinned && n.unread).length;
  const totalTriage = items.filter((n) => n.pinned).length;

  // counts per filter (for chips)
  const counts = useMemo(() => {
    const c = {};
    items.forEach((n) => {
      const u = (n.pinned ? 1 : (n.unread ? 1 : 0));
      c[n.cat] = (c[n.cat] || 0) + u;
      c.all = (c.all || 0) + u;
    });
    return c;
  }, [items]);

  const removeTriage = (n) => {
    setCollapsing((c) => ({ ...c, [n.id]: true }));
    setTimeout(() => setItems((arr) => arr.filter((x) => x.id !== n.id)), 420);
  };
  const markRead = (id) => setItems((arr) => arr.map((n) => n.id === id ? { ...n, unread: false } : n));
  const markAll = () => setItems((arr) => arr.map((n) => n.pinned ? n : { ...n, unread: false }));

  const groups = ['today', 'week', 'earlier']
    .map((g) => ({ g, rows: feed.filter((n) => n.group === g) }))
    .filter((x) => x.rows.length);

  return (
    <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: 'var(--bg)' }}>
      <div style={{ padding: '8px 20px 36px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 12, paddingTop: 4 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 800,
              letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--primary)' }}>SmartAttendance</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700,
                color: 'var(--ink)', letterSpacing: -0.5, lineHeight: 1 }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                  color: '#fff', background: 'var(--accent)', borderRadius: 999, minWidth: 24,
                  height: 24, padding: '0 8px', display: 'inline-flex', alignItems: 'center',
                  justifyContent: 'center', boxShadow: '0 4px 12px color-mix(in srgb, var(--accent) 45%, transparent)' }}>
                  {unreadCount}</span>
              )}
            </div>
          </div>
          <button onClick={markAll} disabled={!unreadCount} style={{ border: '1px solid var(--line)',
            cursor: unreadCount ? 'pointer' : 'default', background: 'var(--surface)',
            color: unreadCount ? 'var(--primary)' : 'var(--muted2)', borderRadius: 14, padding: '10px 12px',
            display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)',
            fontWeight: 700, fontSize: 12, opacity: unreadCount ? 1 : 0.6, flexShrink: 0 }}>
            <Icon name="checkCircle" size={16} stroke={2.1} /> Tout lire
          </button>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, margin: '0 -2px' }}>
          {FILTERS.map((f) => {
            const on = filter === f.key;
            const cnt = counts[f.key] || 0;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{ flexShrink: 0,
                border: '1px solid', borderColor: on ? 'transparent' : 'var(--line)', cursor: 'pointer',
                background: on ? 'var(--ink)' : 'var(--surface)', color: on ? 'var(--bg)' : 'var(--muted)',
                borderRadius: 999, padding: '9px 14px', fontFamily: 'var(--font-body)',
                fontWeight: 700, fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                {f.label}
                {cnt > 0 && (
                  <span style={{ fontSize: 10.5, fontWeight: 800, minWidth: 17, height: 17, padding: '0 5px',
                    borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: on ? 'var(--bg)' : 'var(--p-soft)', color: on ? 'var(--ink)' : 'var(--primary)' }}>
                    {cnt}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* À traiter */}
        {(filter === 'all' || triage.length > 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SectionLabel right={triage.length > 0 ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
                <Icon name="sparkle" size={13} color="var(--accent)" /> {triage.length} en attente
              </span>) : null}>
              À traiter
            </SectionLabel>
            {triage.length === 0
              ? <AllClear />
              : triage.map((n) => (
                  <div key={n.id} className={collapsing[n.id] ? 'sa-collapse' : ''}>
                    <TriageCard n={n} onAction={removeTriage} onDismiss={removeTriage} />
                  </div>
                ))}
          </div>
        )}

        {/* Timeline feed */}
        {groups.map(({ g, rows }) => (
          <div key={g} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SectionLabel>{GROUP_LABELS[g]}</SectionLabel>
            <Card pad={16} style={{ display: 'flex', flexDirection: 'column',
              gap: t.showTimeline ? 0 : 14 }}>
              {rows.map((n, i) => (
                <FeedRow key={n.id} n={n} timeline={t.showTimeline}
                  last={i === rows.length - 1} onRead={markRead} />
              ))}
            </Card>
          </div>
        ))}

        {feed.length === 0 && triage.length === 0 && filter !== 'all' && (
          <div style={{ textAlign: 'center', padding: '38px 20px', color: 'var(--muted2)',
            fontFamily: 'var(--font-body)', fontSize: 13.5 }}>
            <Icon name="bell" size={30} stroke={1.7} color="var(--muted2)"
              style={{ margin: '0 auto 10px' }} />
            Aucune notification dans cette catégorie.
          </div>
        )}
      </div>
    </div>
  );
}

// ── App shell ────────────────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const vars = buildVars(t);
  const scale = useFitScale(402, 874);

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
              flexDirection: 'column', background: 'var(--bg)' }}>
              <div style={{ height: 58, flexShrink: 0, background: 'var(--bg)' }} />
              <NotificationsScreen t={t} />
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
        <TweakSection label="Typographie & forme" />
        <TweakRadio label="Police" value={t.font}
          options={['expressive', 'geometric', 'classic']}
          onChange={(v) => setTweak('font', v)} />
        <TweakRadio label="Arrondi" value={t.radius}
          options={['sharp', 'soft', 'round']}
          onChange={(v) => setTweak('radius', v)} />
        <TweakSection label="Présentation" />
        <TweakToggle label="Fil chronologique" value={t.showTimeline}
          onChange={(v) => setTweak('showTimeline', v)} />
        <TweakToggle label="Mode sombre" value={t.dark}
          onChange={(v) => setTweak('dark', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
