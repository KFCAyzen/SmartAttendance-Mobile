# Handoff: Animated Splash Screen — SmartAttendance

## Overview
A branded, animated launch screen for the SmartAttendance mobile app. It establishes the product identity (face-recognition attendance) the moment the app opens: the scan-frame + smiling-face mark reveals itself with a subtle face-scan sweep, the wordmark and a loading indicator rise in, then the splash hands off to the app once it's ready.

The target app is the existing **Expo / React Native** project (`SmartAttendance-Mobile`, Expo SDK 54, React Native 0.81, expo-router). All libraries needed to build this are **already installed** — see "Implementation notes".

## About the Design Files
The files in this bundle are **design references created in HTML/CSS** — a prototype showing the intended look, timing, and motion. They are **not** production code to copy directly. The task is to **recreate this design natively in the Expo/React Native codebase** using its established patterns (`react-native-svg`, `react-native-reanimated`, `expo-linear-gradient`, `expo-splash-screen`, the installed Google fonts).

- `SmartAttendance - Splash (reference).html` — open in a browser to watch the full animation sequence and inspect exact values.
- `assets/splash-icon.png` — the mark on a transparent background (used for the native static splash; already present in the app at `assets/images/splash-icon.png`).

## Fidelity
**High-fidelity (hifi).** Final colors, gradients, typography, geometry, and motion timing. Recreate it pixel- and timing-faithfully. Exact hex values, SVG path data, and animation curves are listed below.

---

## Architecture: two layers

A polished splash in Expo is **two pieces**, because the OS-level splash can only be a static image:

1. **Native static splash** (`expo-splash-screen`, configured in `app.json`) — shown by the OS instantly at launch. Should be the **mark on the dark navy background** so there is *no white flash* and it visually matches layer 2.
2. **Animated JS splash** — a full-screen React component rendered *first* inside the app. It plays the reveal animation while the app boots (fonts, auth check, cached queries), then fades out to reveal the app. The native splash is kept visible (`preventAutoHideAsync`) and hidden (`hideAsync`) the instant the animated component has mounted, so the handoff is seamless.

---

## The Screen

### Layout
- Full-screen, `flex: 1`, dark navy background (gradient below).
- **Center cluster** (vertically + horizontally centered): the mark, then 46px below it the wordmark block (title + tagline).
- **Footer** pinned 52px from the bottom: a thin progress track, then 22px below it the uppercase brand line.
- Respect safe-area insets for the status bar; content is otherwise centered ignoring insets.

### Background
Two stacked layers on the root view:
1. Base gradient (use `expo-linear-gradient` with two layers, or an SVG radial). Reference is a **radial** gradient, center ~`(32%, 12%)`:
   - `#2A356A` @ 0% → `#1B2350` @ 34% → `#121A3C` @ 64% → `#0A0E22` @ 100%
   - Closest LinearGradient approximation if you don't use radial: top-left `#2A356A` → bottom `#0A0E22`.
2. Violet bloom overlay (additive, behind the mark): radial `rgba(126,91,255,0.22)` → transparent, centered ~`(50%, 38%)`. A blurred `RadialGradient` in `react-native-svg` is the cleanest route.
3. Bottom vignette (optional polish): radial `rgba(0,0,0,0.55)` → transparent near the bottom edge.

### The mark (SVG)
Rendered with `react-native-svg`. Design size on screen: **132 × 132**. Author it in a `viewBox="0 0 1024 1024"` so the geometry below drops in 1:1.

**Defs / gradients**
- Bracket stroke — `LinearGradient` from `(0.1, 0)` → `(0.9, 1)`: stop `#4470FF` @ 0, stop `#7E5BFF` @ 1.
- Scan-line — `LinearGradient` vertical: `#8FA9FF` α0 @ 0 → `#9FB4FF` α0.95 @ 0.5 → `#8FA9FF` α0 @ 1.
- Halo — separate element behind the SVG: radial `rgba(110,91,255,0.45)` → transparent, ~1.7× the mark size, blurred.

**Geometry (on the 1024 grid)**
- Four scan brackets — one `<Path>`, `stroke-width="54"`, round caps & joins, `fill="none"`, stroke = bracket gradient:
  ```
  M 300 458 L 300 396 Q 300 300 396 300 L 458 300
  M 724 458 L 724 396 Q 724 300 628 300 L 566 300
  M 300 566 L 300 628 Q 300 724 396 724 L 458 724
  M 724 566 L 724 628 Q 724 724 628 724 L 566 724
  ```
- Eyes — two circles, `fill="#FFFFFF"`: `cx 464 cy 486 r 27` and `cx 560 cy 486 r 27`.
- Smile — `<Path>`, `stroke="#FFFFFF"`, `stroke-width="36"`, round cap, `fill="none"`:
  ```
  M 452 552 Q 512 608 572 552
  ```
- Scan-sweep — a `<Rect>` `x 298 y 350 w 428 h 20 rx 10` filled with the scan gradient, **clipped** to the frame interior `Rect x 298 y 298 w 428 h 428`. Animate its `y` (or `translateY`) top→bottom.

### Typography
Fonts are already installed: `@expo-google-fonts/bricolage-grotesque`, `@expo-google-fonts/plus-jakarta-sans`. Load with `useFonts` before hiding the native splash.

| Element | Font | Weight | Size | Tracking | Color |
|---|---|---|---|---|---|
| Wordmark "Smart" | Bricolage Grotesque | 700 | 33 | -0.018em (≈ -0.6px) | `#FFFFFF` |
| Wordmark "Attendance" | Bricolage Grotesque | 700 | 33 | -0.018em | `#B9A5FF` |
| Tagline | Plus Jakarta Sans | 500 | 13.5 | normal | `rgba(255,255,255,0.60)` |
| Brand line (footer) | Plus Jakarta Sans | 600 | 11 | +0.16em, UPPERCASE | `rgba(255,255,255,0.42)` |

- Wordmark is a single line: `Smart` + `Attendance` rendered as adjacent `<Text>` spans.
- Tagline copy: **"Pointage par reconnaissance faciale"** — 13px below the wordmark.
- Footer brand line copy: a 5px gradient dot + **"Présence, simplifiée"**.

### Loader (footer)
- Track: `128 × 3`, radius 3, `backgroundColor: rgba(255,255,255,0.14)`, clips its child.
- Fill: a pill ~40% of track width, gradient `#4470FF → #7E5BFF`, sliding left→right on a loop (indeterminate). See timing below.
- Footer dot: `5 × 5` circle, gradient `#4470FF → #7E5BFF` (135°).

---

## Interactions & Behavior — animation timeline

All built with `react-native-reanimated` (v4 + worklets are installed). Use `withDelay` + `withTiming`/`withSpring`. Times are in **seconds from mount**. Easings are the CSS cubic-bezier; map to Reanimated `Easing.bezier(...)`.

| # | Element | Property | From → To | Delay | Duration | Easing |
|---|---|---|---|---|---|---|
| 1 | Mark (group) | opacity | 0 → 1 | 0.10 | 1.00 | `bezier(.22,1,.36,1)` |
| 1 | Mark (group) | scale | 0.92 → 1 | 0.10 | 1.00 | `bezier(.22,1,.36,1)` |
| 2 | Halo | opacity | 0 → 0.85 | 0.50 | 1.40 | ease-out |
| 3 | Brackets | stroke draw (dashoffset 100→0) | reveal | 0.35 | 1.05 | `bezier(.7,0,.2,1)` |
| 4 | Scan line | translateY −180 → 180, opacity pulse 0→1→0 | 2 passes | 0.55 | 1.50 ×2 | `bezier(.5,0,.5,1)` |
| 5 | Left eye | scale | 0 → 1 | 1.18 | 0.50 | overshoot `bezier(.34,1.6,.5,1)` (or `withSpring`) |
| 5 | Right eye | scale | 0 → 1 | 1.26 | 0.50 | overshoot |
| 6 | Smile | stroke draw (dashoffset 100→0) | reveal | 1.34 | 0.55 | `bezier(.6,0,.3,1)` |
| 7 | Wordmark | opacity 0→1, translateY 14→0 | rise | 1.50 | 0.90 | `bezier(.22,1,.36,1)` |
| 8 | Footer | opacity 0→1, translateY rise | rise | 1.80 | 0.90 | ease-out |
| 9 | Loader fill | translateX loop (off-left → off-right) | indeterminate | 1.95 | 1.50 | `bezier(.65,0,.35,1)`, `withRepeat(-1)` |

**Stroke draw in react-native-svg:** set `strokeDasharray={pathLength}` and animate `strokeDashoffset` from `pathLength` → `0` (use `AnimatedPath` with `useAnimatedProps`). The brackets path total length ≈ **1119**; the smile ≈ **150** (or measure at runtime). The HTML uses `pathLength="100"` to normalize — in RN, either measure with `ref.getTotalLength()` or hardcode these lengths.

**Reveal end ≈ 2.7s.** After the app reports ready *and* the reveal has finished, fade the whole splash out (opacity 1→0 over ~0.35s, ease-out) and unmount.

**Reduced motion:** if `AccessibilityInfo.isReduceMotionEnabled()` is true, skip all entrance animations and the scan sweep — render the final composition immediately, then fade out on ready.

---

## State Management
The animated splash needs minimal state, typically in the root layout (`app/_layout.tsx`):
- `appReady: boolean` — true once fonts loaded + initial auth/session check done + persisted React Query cache hydrated.
- `revealDone: boolean` — true once the entrance timeline finishes (~2.7s) — track with a timer or the last animation's callback.
- Render the `<AnimatedSplash />` overlay while `!(appReady && revealDone)`; when both true, run the fade-out then unmount.
- Keep `expo-splash-screen` from auto-hiding (`SplashScreen.preventAutoHideAsync()` at module top) and call `SplashScreen.hideAsync()` as soon as `<AnimatedSplash />` has mounted its first frame (`onLayout`), so the native → JS handoff shows no gap.

---

## Implementation notes (already-installed libs)
- `react-native-svg` `15.12.1` — mark, gradients, scan line, stroke-draw.
- `react-native-reanimated` `~4.1.1` + `react-native-worklets` — timeline.
- `expo-linear-gradient` `~15.0.8` — background / loader fill if not using SVG.
- `expo-splash-screen` `~31.0.13` — native static layer + handoff control.
- `@expo-google-fonts/bricolage-grotesque`, `@expo-google-fonts/plus-jakarta-sans` — fonts.
- `react-native-safe-area-context` — status-bar inset.

### Update the native splash (`app.json`) to remove the white flash
Currently:
```jsonc
["expo-splash-screen", {
  "image": "./assets/images/splash-icon.png",
  "imageWidth": 200,
  "resizeMode": "contain",
  "backgroundColor": "#ffffff",
  "dark": { "backgroundColor": "#000000" }
}]
```
Change both background colors to the splash navy so the OS splash matches the animated one:
```jsonc
["expo-splash-screen", {
  "image": "./assets/images/splash-icon.png",
  "imageWidth": 200,
  "resizeMode": "contain",
  "backgroundColor": "#0A0E22",
  "dark": { "backgroundColor": "#0A0E22" }
}]
```
`splash-icon.png` is already the mark on transparent, so it sits correctly on the navy. (Optional: also set `expo.userInterfaceStyle`/`expo-system-ui` so the status bar is light on this screen.)

---

## Design Tokens
**Colors**
- Navy gradient: `#2A356A`, `#1B2350`, `#121A3C`, `#0A0E22`
- Native splash bg: `#0A0E22`
- Primary blue: `#2F5BFF` · Bracket blue: `#4470FF` · Violet: `#7E5BFF`
- Halo / bloom violet: `rgba(110,91,255,0.45)` / `rgba(126,91,255,0.22)`
- Face / wordmark "Smart": `#FFFFFF`
- Wordmark "Attendance": `#B9A5FF`
- Tagline: `rgba(255,255,255,0.60)` · Brand line: `rgba(255,255,255,0.42)`
- Loader track: `rgba(255,255,255,0.14)` · Loader fill: `#4470FF → #7E5BFF`

**Spacing**
- Mark → wordmark: 46 · Title → tagline: 13 · Footer from bottom: 52 · Track → brand line: 22

**Sizing / radii**
- Mark: 132 · Loader track: 128 × 3, radius 3 · Footer dot: 5

**Type scale** — see Typography table.

**Motion** — see timeline table; total reveal ≈ 2.7s; fade-out ≈ 0.35s.

## Assets
- `assets/splash-icon.png` — brand mark (scan-frame + face) on transparent. Already in the app as `assets/images/splash-icon.png`. The mark in the animated layer is drawn as **vector SVG** (paths above) for crispness, not this PNG.
- No other raster assets; everything else is gradients, vector, and text.

## Files
- `SmartAttendance - Splash (reference).html` — the HTML/CSS prototype (source of all values and timing). In the main project: `splash-screen/SmartAttendance - Splash.html`.
- App entry to wire the splash into: `SmartAttendance-Mobile/app/_layout.tsx`.
- Native config to edit: `SmartAttendance-Mobile/app.json` (`expo-splash-screen` plugin).
- Suggested new file: `SmartAttendance-Mobile/src/components/AnimatedSplash.tsx`.
