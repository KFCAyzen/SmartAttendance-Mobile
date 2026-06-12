/* ui.jsx — SmartAttendance redesign: design tokens, icon set, shared primitives.
   Exports to window: buildVars, Icon, Card, Pill, StatChip, SoftButton, MiniBars, ProgressBar, fmtTimer */

// ── Theme: build CSS custom properties from tweaks ───────────────────────────
function buildVars(t) {
  const dark = !!t.dark;
  const p = t.primary || '#2F5BFF';
  const accent = t.accent || '#FF8A3D';
  const radius = { sharp: 12, soft: 20, round: 28 }[t.radius] || 20;
  const fonts = {
    expressive: { display: "'Bricolage Grotesque'", body: "'Plus Jakarta Sans'" },
    geometric: { display: "'Space Grotesk'", body: "'Plus Jakarta Sans'" },
    classic: { display: "'Plus Jakarta Sans'", body: "'Plus Jakarta Sans'" },
  }[t.font] || { display: "'Bricolage Grotesque'", body: "'Plus Jakarta Sans'" };

  const base = dark
    ? {
        bg: '#080B14', surface: '#121829', surface2: '#1A2236', elev: '#222C44',
        ink: '#F3F6FD', muted: '#9AA5BE', muted2: '#67718C',
        line: 'rgba(255,255,255,0.09)', shadow: '0 18px 40px rgba(0,0,0,0.5)',
      }
    : {
        bg: '#F1F3FA', surface: '#FFFFFF', surface2: '#F7F8FD', elev: '#FFFFFF',
        ink: '#0E1326', muted: '#717A90', muted2: '#9AA2B5',
        line: 'rgba(14,19,38,0.08)', shadow: '0 16px 36px rgba(20,30,70,0.10)',
      };
  // fonts default already handled above

  return {
    '--bg': base.bg,
    '--surface': base.surface,
    '--surface2': base.surface2,
    '--elev': base.elev,
    '--ink': base.ink,
    '--muted': base.muted,
    '--muted2': base.muted2,
    '--line': base.line,
    '--shadow': base.shadow,
    '--primary': p,
    '--accent': accent,
    '--success': '#16A34A',
    '--warning': '#F59E0B',
    '--danger': '#EF4444',
    '--p-soft': `color-mix(in srgb, ${p} 12%, transparent)`,
    '--p-soft2': `color-mix(in srgb, ${p} 18%, transparent)`,
    '--a-soft': `color-mix(in srgb, ${accent} 16%, transparent)`,
    '--ok-soft': 'color-mix(in srgb, #16A34A 14%, transparent)',
    '--warn-soft': 'color-mix(in srgb, #F59E0B 16%, transparent)',
    '--r': radius + 'px',
    '--r-lg': (radius + 8) + 'px',
    '--r-sm': Math.max(8, radius - 8) + 'px',
    '--font-display': `${fonts.display}, system-ui, sans-serif`,
    '--font-body': `${fonts.body}, system-ui, sans-serif`,
  };
}

// ── Icon set: stroke-based, rounded, consistent 24 grid ──────────────────────
const PATHS = {
  home: 'M3 10.8 12 3l9 7.8M5.2 9.4V20a1 1 0 0 0 1 1H9.5v-5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V21h3.3a1 1 0 0 0 1-1V9.4',
  clock: 'M12 7.2V12l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  doc: 'M14 3.2H7a2 2 0 0 0-2 2v13.6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.2L14 3.2ZM13.5 3.5V8a1 1 0 0 0 1 1h4M8.5 13h7M8.5 16.5h4.5',
  user: 'M12 12.4a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4ZM4.5 20.2c.7-3.6 3.7-5.6 7.5-5.6s6.8 2 7.5 5.6',
  bell: 'M18 8.4a6 6 0 0 0-12 0c0 6-2.4 7.6-2.4 7.6h16.8S18 14.4 18 8.4ZM13.8 19.6a2.1 2.1 0 0 1-3.6 0',
  plus: 'M12 5.5v13M5.5 12h13',
  calendar: 'M7 3.5V6M17 3.5V6M3.8 9.6h16.4M5 5h14a1.2 1.2 0 0 1 1.2 1.2V19A1.2 1.2 0 0 1 19 20.2H5A1.2 1.2 0 0 1 3.8 19V6.2A1.2 1.2 0 0 1 5 5Z',
  check: 'M4.5 12.5 9.5 17.5 19.5 6.5',
  checkCircle: 'M8 12.2 11 15.2 16.2 9M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  location: 'M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11ZM12 12.4a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z',
  arrowIn: 'M12 4v11M12 15l-4.2-4.2M12 15l4.2-4.2M5 20h14',
  arrowOut: 'M12 20V9M12 9 7.8 13.2M12 9l4.2 4.2M5 4h14',
  settings: 'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM19.4 14.4a1.5 1.5 0 0 0 .3 1.7l.1.1a1.8 1.8 0 1 1-2.6 2.6l-.1-.1a1.5 1.5 0 0 0-2.5 1v.2a1.8 1.8 0 1 1-3.6 0v-.1a1.5 1.5 0 0 0-2.6-1 1.5 1.5 0 0 0-1.7.3l-.1.1a1.8 1.8 0 1 1-2.6-2.6l.1-.1a1.5 1.5 0 0 0-1-2.5H3a1.8 1.8 0 1 1 0-3.6h.1a1.5 1.5 0 0 0 1-2.6 1.5 1.5 0 0 0-.3-1.7l-.1-.1a1.8 1.8 0 1 1 2.6-2.6l.1.1a1.5 1.5 0 0 0 1.7.3H9a1.5 1.5 0 0 0 .9-1.4V3a1.8 1.8 0 1 1 3.6 0v.1a1.5 1.5 0 0 0 2.5 1 1.5 1.5 0 0 0 1.7-.3l.1-.1a1.8 1.8 0 1 1 2.6 2.6l-.1.1a1.5 1.5 0 0 0-.3 1.7V9a1.5 1.5 0 0 0 1.4.9h.2a1.8 1.8 0 1 1 0 3.6h-.1a1.5 1.5 0 0 0-1.4.9Z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.5 12h17M12 3a13.5 13.5 0 0 1 0 18 13.5 13.5 0 0 1 0-18Z',
  moon: 'M20 13.4A8 8 0 0 1 10.6 4 8 8 0 1 0 20 13.4Z',
  logout: 'M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3M15.5 16.5 20 12l-4.5-4.5M20 12H9',
  camera: 'M4 8.4A1.6 1.6 0 0 1 5.6 6.8h1.8L8.8 4.8a1.2 1.2 0 0 1 1-.6h4.4a1.2 1.2 0 0 1 1 .6l1.4 2h1.8A1.6 1.6 0 0 1 20 8.4V18a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 18V8.4ZM12 16.5a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z',
  scan: 'M3.5 8V5.5A2 2 0 0 1 5.5 3.5H8M16 3.5h2.5a2 2 0 0 1 2 2V8M20.5 16v2.5a2 2 0 0 1-2 2H16M8 20.5H5.5a2 2 0 0 1-2-2V16',
  face: 'M9 9.6h.01M15 9.6h.01M9.2 14.4a4 4 0 0 0 5.6 0',
  chevron: 'M9 5.5 15.5 12 9 18.5',
  chevronDown: 'M5.5 9 12 15.5 18.5 9',
  sparkle: 'M12 3.5 13.6 9 19 10.6 13.6 12.2 12 17.6 10.4 12.2 5 10.6 10.4 9 12 3.5ZM18.5 16.5l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z',
  flip: 'M16 4.5h2.5A1.5 1.5 0 0 1 20 6v2.5M20 4.5 16.5 8M8 19.5H5.5A1.5 1.5 0 0 1 4 18v-2.5M4 19.5 7.5 16M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z',
  shield: 'M12 3.2 5 6v5.2c0 4.3 3 8 7 9.6 4-1.6 7-5.3 7-9.6V6l-7-2.8ZM9 12l2 2 4-4',
  clockSmall: 'M12 7.5V12l2.8 1.6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  trend: 'M3.5 16.5 9 11l3.5 3.5L20.5 6M20.5 6h-4M20.5 6v4',
  mail: 'M4 7.4A1.8 1.8 0 0 1 5.8 5.6h12.4A1.8 1.8 0 0 1 20 7.4v9.2a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 16.6V7.4ZM4.6 7.6 12 13l7.4-5.4',
  lock: 'M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5M6.6 10.5h10.8a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H6.6a1 1 0 0 1-1-1v-7.5a1 1 0 0 1 1-1ZM12 14v2.4',
  eye: 'M2.5 12S6 5.6 12 5.6 21.5 12 21.5 12 18 18.4 12 18.4 2.5 12 2.5 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  eyeOff: 'M4 4l16 16M9.9 5.3A9.4 9.4 0 0 1 12 5.1c6 0 9.5 6.9 9.5 6.9a16.6 16.6 0 0 1-3.1 3.7M6.5 7.7A16.3 16.3 0 0 0 2.5 12S6 18.9 12 18.9a9 9 0 0 0 3.6-.7M9.6 9.7a3 3 0 0 0 4.1 4.1',
  arrowRight: 'M5 12h13.5M12.5 6 19 12l-6.5 6',
  key: 'M14.5 14.5 21 21M8 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM11.6 10.4 14.5 13.5l1.6-1.6 1.4 1.4 1.6-1.6',
};

function Icon({ name, size = 22, color = 'currentColor', stroke = 1.9, fill = 'none', style }) {
  const d = PATHS[name];
  if (!d) return null;
  // face needs a circle outline added separately
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ display: 'block', flexShrink: 0, ...style }} aria-hidden="true">
      {name === 'face' && (
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={stroke} fill={fill} />
      )}
      <path d={d} stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeLinejoin="round" fill={name === 'sparkle' ? color : 'none'} />
    </svg>
  );
}

// ── Primitives ───────────────────────────────────────────────────────────────
function Card({ children, style, pad = 18, onClick, soft }) {
  return (
    <div onClick={onClick} style={{
      background: soft ? 'var(--surface2)' : 'var(--surface)',
      borderRadius: 'var(--r-lg)', padding: pad,
      border: '1px solid var(--line)',
      boxShadow: soft ? 'none' : 'var(--shadow)',
      ...style,
    }}>{children}</div>
  );
}

function Pill({ children, tone = 'primary', style }) {
  const map = {
    primary: ['var(--p-soft)', 'var(--primary)'],
    success: ['var(--ok-soft)', 'var(--success)'],
    warning: ['var(--warn-soft)', 'var(--warning)'],
    accent: ['var(--a-soft)', 'var(--accent)'],
    neutral: ['var(--surface2)', 'var(--muted)'],
  };
  const [bg, fg] = map[tone] || map.primary;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: bg, color: fg, fontFamily: 'var(--font-body)',
      fontWeight: 700, fontSize: 11.5, letterSpacing: 0.1,
      padding: '5px 11px', borderRadius: 999, lineHeight: 1, ...style,
    }}>{children}</span>
  );
}

function StatChip({ icon, label, value, tone = 'primary' }) {
  const fg = { primary: 'var(--primary)', success: 'var(--success)', accent: 'var(--accent)' }[tone];
  return (
    <div style={{
      flex: 1, background: 'var(--surface2)', borderRadius: 'var(--r)',
      padding: '12px 13px', border: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column', gap: 7,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: fg }}>
        <Icon name={icon} size={16} stroke={2.1} />
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11,
          color: 'var(--muted)', letterSpacing: 0.2 }}>{label}</span>
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19,
        color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

function SoftButton({ icon, label, onClick, tone = 'primary' }) {
  const fg = tone === 'primary' ? 'var(--primary)' : 'var(--accent)';
  const bg = tone === 'primary' ? 'var(--p-soft)' : 'var(--a-soft)';
  return (
    <button onClick={onClick} style={{
      flex: 1, border: 'none', cursor: 'pointer', background: bg, color: fg,
      borderRadius: 'var(--r)', padding: '14px 12px',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
      fontFamily: 'var(--font-body)', textAlign: 'left',
    }}>
      <Icon name={icon} size={22} stroke={2} />
      <span style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.2 }}>{label}</span>
    </button>
  );
}

// Mini weekly bar chart
function MiniBars({ data, max, height = 64, accentIndex }) {
  const peak = max || Math.max(...data.map((d) => d.v), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height }}>
      {data.map((d, i) => {
        const h = Math.max(6, (d.v / peak) * height);
        const isAccent = i === accentIndex;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 7, justifyContent: 'flex-end' }}>
            <div style={{
              width: '100%', height: h, borderRadius: 7,
              background: d.v === 0 ? 'var(--line)'
                : isAccent ? 'var(--primary)'
                : 'color-mix(in srgb, var(--primary) 28%, var(--surface2))',
              transition: 'height .5s cubic-bezier(.2,.8,.2,1)',
            }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
              color: isAccent ? 'var(--primary)' : 'var(--muted2)' }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ProgressBar({ value, total, tone = 'primary' }) {
  const pct = Math.min(100, Math.round((value / total) * 100));
  const fg = { primary: 'var(--primary)', success: 'var(--success)', accent: 'var(--accent)', warning: 'var(--warning)' }[tone];
  return (
    <div style={{ height: 7, borderRadius: 999, background: 'var(--line)', overflow: 'hidden' }}>
      <div style={{ width: pct + '%', height: '100%', borderRadius: 999, background: fg,
        transition: 'width .5s cubic-bezier(.2,.8,.2,1)' }} />
    </div>
  );
}

function fmtTimer(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

Object.assign(window, { buildVars, Icon, Card, Pill, StatChip, SoftButton, MiniBars, ProgressBar, fmtTimer });
