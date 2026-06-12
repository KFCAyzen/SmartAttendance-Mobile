# Handoff: SmartAttendance — Écran de connexion (biometric-first login)

## Overview
A mobile login screen for **SmartAttendance**, a facial-recognition attendance/time-clock app. The login leads with the product's signature interaction — **Face ID** biometric auth — and offers a polished email/password form as a secondary path. The screen is an immersive dark canvas with an animated aurora background, a tappable scan orb that runs a multi-phase recognition animation, and a smooth toggle between the two auth methods.

This is the **entry point** of the app: on success it transitions to the Home (Accueil) tab. A "Se déconnecter" action in the Profile screen returns the user here.

## About the Design Files
The files in this bundle are **design references created in HTML/React (via Babel in-browser)** — prototypes showing the intended look and behavior, **not production code to ship directly**. The task is to **recreate this design in the target codebase's existing environment** (React Native, Flutter, SwiftUI, native iOS/Android, or a web stack) using its established components, navigation, and styling patterns. If no environment exists yet, pick the most appropriate framework for a mobile attendance app and implement there.

The React/JSX here is plain inline Babel with global components and inline-style objects — treat it as a faithful spec of structure, tokens, and motion, not an architecture to copy.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, radii, and interactions are all specified below and visible in the prototype. Recreate the UI pixel-perfectly using the codebase's libraries. The one liberty: the Face ID orb is a *simulated* scan (timed animation) — in production it should be wired to the real biometric/camera API (Face ID / BiometricPrompt / WebRTC + face match).

## Device / Frame
- Design canvas: **402 × 874** (iPhone 15 Pro logical size), inside an iOS bezel with Dynamic Island.
- The login draws its **own** dark background full-bleed (under the status bar). Status bar glyphs are **white**.
- Safe areas: top content starts at **72px** (clears island), bottom padding **30px** (clears home indicator).

---

## Screens / Views

### 1. Login — Face ID mode (default)
**Purpose:** Authenticate by face in one tap — the primary, on-brand path.

**Layout** (single column, `padding: 72px 26px 30px`, `display:flex; flex-direction:column`):
1. **Brand lockup** (top)
2. **Headline block** (`margin-top: 30px`)
3. **Mode toggle** (`margin-top: 24px`)
4. **Method region** (`flex:1; margin-top: 22px`) — holds the Face ID orb
5. **Secure footer** (bottom, `margin-top: 18px`)

**Components:**

- **Brand lockup** — horizontal flex, `gap: 12`.
  - Icon tile: 46×46, `border-radius: 15`, gradient `linear-gradient(150deg, var(--primary), color-mix(in srgb, var(--primary) 45%, var(--accent)))`, shadow `0 10px 26px color-mix(in srgb, var(--primary) 45%, transparent)`. Contains a white "scan" glyph (24px, stroke 2.2).
  - Title "SmartAttendance" — display font, 18px / 700, color `#fff`, letter-spacing −0.2.
  - Subtitle "Pointage par reconnaissance faciale" — body font, 11.5px / 600, `rgba(255,255,255,0.5)`.

- **Headline** — `<h1>` "Bon retour." display font, **33px / 700**, `#fff`, letter-spacing −0.6, line-height 1.05. Paragraph "Authentifiez-vous pour pointer votre journée." body 14.5px, `rgba(255,255,255,0.6)`, line-height 1.45, max-width 280.

- **Mode toggle** (segmented) — flex row, `padding: 5`, `border-radius: 16`, bg `rgba(255,255,255,0.06)`, border `1px solid rgba(255,255,255,0.1)`, `backdrop-filter: blur(14px)`.
  - Sliding thumb: absolute, `border-radius: 12`, bg `rgba(255,255,255,0.95)`, shadow `0 6px 16px rgba(0,0,0,0.28)`, animates `left` over **.28s cubic-bezier(.3,.7,.4,1)**. Width `calc(50% - 5px)`.
  - Two buttons: icon (17px) + label, 13.5px / 700. Active label `#0E1326`; inactive `rgba(255,255,255,0.62)`. Options: **Face ID** (icon `face`) · **Identifiants** (icon `lock`).

- **Face ID orb** (centered column, `gap: 26`, `padding-top: 14`):
  - Outer ring zone: 224×224, centered flex.
  - **Idle pulse rings**: 3 concentric circles, 150×150, `border: 1.5px solid color-mix(in srgb, var(--primary) 65%, transparent)`, animation `sa-ringpulse 2.6s ease-out infinite`, staggered `animation-delay: i * 0.85s`. Keyframe: scale .55→1.7, opacity .6→0.
  - **Glow halo**: 168×168 radial-gradient of `ringColor` at 38%, `blur(6px)`.
  - **Central orb (button)**: 132×132 circle, `border: 1px solid rgba(255,255,255,0.16)`, bg `linear-gradient(160deg, rgba(40,52,82,0.85), rgba(16,22,38,0.92))`, `backdrop-filter: blur(8px)`. Idle shadow `0 16px 40px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.12)`. Contains a white `face` glyph (54px, stroke 1.7).
  - **Identity hint chip**: pill, bg `rgba(255,255,255,0.06)`, border `1px solid rgba(255,255,255,0.1)`. 30px gradient avatar with initials (display 12px/700) + "Amine Berrada" (13px/600, `rgba(255,255,255,0.78)`).
  - **Status text** above chip: 15px / 600, `rgba(255,255,255,0.9)` (turns `var(--success)` on success). Min-height block 70px so layout doesn't jump.

- **Secure footer** — centered flex, `gap: 7`, `rgba(255,255,255,0.42)`. `shield` icon 14px + "Connexion chiffrée de bout en bout" (11.5px / 500).

### 2. Login — Identifiants (credentials) mode
**Purpose:** Email/password fallback + enterprise SSO.

Replaces the orb region with a form column (`gap: 12`):

- **Email field** & **Password field** — floating-label glass inputs (see *LoginField* spec below). Email icon `mail`; password icon `lock`. Password has a trailing **eye / eyeOff** toggle button (20px, `rgba(255,255,255,0.55)`) that flips `type` between `password` and `text`. Prefilled demo values: `amine.berrada@axion.io` / `Axion2025`.

- **Row** (`space-between`):
  - **"Se souvenir de moi"** — custom checkbox: 22×22, `border-radius: 7`. Checked = filled `var(--primary)` with white `check` glyph (13px); unchecked = `1.5px solid rgba(255,255,255,0.28)`. Label 13px / 600, `rgba(255,255,255,0.7)`.
  - **"Mot de passe oublié ?"** — text button, 13px / 700, `var(--accent)`.

- **Primary button "Se connecter"** — height 56, `border-radius: var(--r)`, bg `var(--primary)`, white text 15.5px / 800, trailing `arrowRight` glyph. Shadow `0 14px 30px color-mix(in srgb, var(--primary) 45%, transparent)`. On press → shows white spinner, then success after **1150ms**.

- **Divider** — "OU" between two 1px lines (`rgba(255,255,255,0.12)`).

- **SSO button "Continuer avec le SSO entreprise"** — height 54, bg `rgba(255,255,255,0.07)`, border `1px solid rgba(255,255,255,0.14)`, `backdrop-filter: blur(12px)`, white 14.5px / 700, leading `key` glyph in `var(--accent)`. Same 1150ms loading → success.

While one button loads, the other dims to `opacity: 0.5`.

**LoginField (floating-label glass input):**
- Container: height 60, `border-radius: var(--r)`, bg `rgba(255,255,255,0.06)`, border `1.5px solid rgba(255,255,255,0.12)`. Horizontal flex, `gap: 12`, `padding: 0 14px`.
- **Focus state**: border → `var(--primary)`, add `box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary) 20%, transparent)`; leading icon → `var(--primary)`.
- **Label** floats: resting = vertically centered, 15px / 500, `rgba(255,255,255,0.5)`. Floated (focused or has value) = `top: 12`, 11px / 700, UPPERCASE, letter-spacing 0.4, color `var(--primary)` when focused. Transition `all .18s ease`.
- **Input**: transparent, white text 15px / 600, `padding: 20px 0 6px`.

---

## Interactions & Behavior

### Face ID scan sequence (on orb tap)
State machine `phase: 'idle' → 'scanning' → 'success'`, all via `setTimeout` (replace with real biometric callbacks in production):
| t (ms) | Effect |
|---|---|
| 0 | phase → scanning; status "Détection du visage…" |
| 0 | Orb gains rotating arc (196×196 circle, `border-top: 3px var(--primary)`, `sa-spin .8s linear infinite`), inner sweep bar (`sa-sweep 1.4s`), orb `sa-pulse`, ring shadow `0 0 0 2px var(--primary)`. |
| 650 | status "Analyse biométrique…" |
| 1400 | status "Vérification de l'identité…" |
| 2200 | phase → success; status "Identité confirmée" (green). Orb shows green circle (70px) with white `check` (38px) via `sa-pop`; ring shadow `0 0 0 3px var(--success)`. |
| 3150 | `onSuccess()` → app sets `authed=true`, navigates to Home. |

The orb button is `disabled` whenever `phase !== 'idle'`.

### Mode toggle
Switches `method` between `'face'` and `'pwd'`; thumb slides .28s. The method region swaps components (React `key` per method so each remounts fresh).

### Entrance
Each block uses `.sa-fadein` (`sa-fadein .5s cubic-bezier(.2,.8,.2,1)`, opacity 0→1 + translateY 12→0) with staggered `animation-delay`: brand 0, headline .06s, toggle .12s, method .18s, footer .24s.

### Ambient background (always animating)
3 blurred blobs (360×360, `blur(72px)`, opacity .5) in `var(--primary)`, `var(--accent)`, `#6E5BFF`, each on a slow `sa-drift{1,2,3}` loop (15s/18s/21s, ease-in-out infinite). Over a `#070A14` base with a faint 42px grid (radial-masked) and a vignette `radial-gradient(125% 80% at 50% -5%, transparent 42%, rgba(4,6,14,0.78))`. Can be disabled via the `loginAura` tweak.

### Reduced motion
`@media (prefers-reduced-motion: reduce)` disables all `sa-*` animations (aura, rings, fade, spin, sweep, pulse, pop). Ensure end-states remain legible (they do — base styles are the visible state).

---

## State Management
- `authed: boolean` (app-level) — false renders the login, true renders the tab app. `onSuccess` sets it true + selects Home; Profile "Se déconnecter" sets it false.
- `method: 'face' | 'pwd'` — initialized from the `loginMethod` tweak.
- **FaceAuth**: `phase`, `status`, plus a `timers` ref (cleared on unmount).
- **CredForm**: `email`, `pwd`, `show` (password visibility), `remember`, `loading: 'pwd' | 'sso' | null`.
- **LoginField**: `focus`.
- Production: replace simulated timers with real auth (biometric API + credentials endpoint); handle error states (failed match, wrong password, locked account) — **not designed yet**, ask design before adding.

## Design Tokens

Tokens are built from tweaks in `ui.jsx → buildVars(t)` and applied as CSS custom properties on a wrapper. Defaults below.

**Colors**
| Token | Value (default) | Use |
|---|---|---|
| `--primary` | `#2F5BFF` | brand, CTAs, focus, scan |
| `--accent` | `#FF8A3D` | links, secondary highlights |
| `--success` | `#16A34A` | confirmed state |
| `--warning` | `#F59E0B` | — |
| `--danger` | `#EF4444` | logout/destructive |
| login canvas base | `#070A14` | login background |
| aura violet | `#6E5BFF` | third aura blob |
| ink (light theme) | `#0E1326` | active toggle label |

Login-specific surfaces are white-alpha on the dark canvas: `rgba(255,255,255,0.06)` (fields/chips), border `rgba(255,255,255,0.12)`, muted text `rgba(255,255,255,0.5–0.62)`, faint text `rgba(255,255,255,0.4–0.42)`.

`--p-soft`/`--a-soft` etc. are `color-mix` derivations of primary/accent — see `buildVars`.

**Radius** (`radius` tweak: sharp/soft/round → 12/20/28): `--r` = 20px, `--r-lg` = +8, `--r-sm` = max(8, −8). Brand tile 15, toggle 16, toggle thumb 12, checkbox 7.

**Typography**
- Display: **Bricolage Grotesque** (`--font-display`) — headline, brand, numbers.
- Body: **Plus Jakarta Sans** (`--font-body`) — everything else.
- Alt font sets via `font` tweak: geometric = Space Grotesk display; classic = Plus Jakarta both.
- Scale used here: 33 (h1), 18 (brand), 15.5 (CTA), 15 (input/status), 14.5 (sub/SSO), 13.5 (toggle), 13 (meta), 11.5 (eyebrow/footer).

**Shadows**
- Brand tile: `0 10px 26px color-mix(in srgb, var(--primary) 45%, transparent)`
- Primary CTA: `0 14px 30px color-mix(in srgb, var(--primary) 45%, transparent)`
- Orb idle: `0 16px 40px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.12)`
- Toggle thumb: `0 6px 16px rgba(0,0,0,0.28)`
- Focus ring: `0 0 0 4px color-mix(in srgb, var(--primary) 20%, transparent)`

## Assets
- **No image assets.** All iconography is inline stroke SVG from the icon set in `ui.jsx` (`PATHS` map, rendered by `<Icon name size color stroke />`, 24-grid, rounded caps/joins). Icons used on login: `scan`, `face`, `lock`, `mail`, `eye`, `eyeOff`, `check`, `arrowRight`, `key`, `shield`. In production, swap for the codebase's icon library (match stroke ~1.9–2.2, rounded).
- **Fonts**: Bricolage Grotesque + Plus Jakarta Sans (Google Fonts). Self-host or use the platform equivalent.
- **No real photo/camera** in the mock — the orb is a glyph + animation; wire to the device camera/biometric in production.

## Tweakable parameters (for reference)
The prototype exposes live tweaks (brand color, accent, font, radius, dark mode, **default login method**, **animated background on/off**). These map directly to the tokens above — useful to know which values are intended to be themeable.

## Files
Design reference files (in this bundle, under `redesign/`-style structure):
- `SmartAttendance - Refonte.html` — entry HTML: fonts, all `sa-*` keyframes (aura, rings, sweep, pulse, pop, fade), script order.
- `login.jsx` — **the login screen** (this handoff's focus): `AuthAura`, `BrandMark`, `ModeToggle`, `FaceAuth`, `LoginField`, `CredForm`, `LoginScreen`.
- `ui.jsx` — design tokens (`buildVars`), icon set (`Icon`/`PATHS`), shared primitives.
- `app.jsx` — app shell: `authed` gate, navigation, tweaks panel, login→app transition.
- `screens.jsx` — in-app screens + the `USER` object consumed by the login (`{ first, last, dept, email, initials, role }`).
- `ios-frame.jsx` — iOS bezel/status bar (prototype chrome only; not part of the app UI).
- `tweaks-panel.jsx` — prototype tweak controls (not part of the app UI).

To run the reference: open `SmartAttendance - Refonte.html` in a browser.
