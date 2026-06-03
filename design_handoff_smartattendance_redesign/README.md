# Handoff — Refonte UX SmartAttendance Mobile

## Vue d'ensemble
Refonte visuelle complète de l'app mobile **SmartAttendance** (pointage par reconnaissance
faciale). On modernise l'identité (cobalt enrichi + accent ambré, typo expressive), on
introduit un **écran d'accueil orienté statut** (chrono de travail en direct, mini-graphe
hebdo), un **écran de pointage facial immersif** (le moment signature), et une **tab bar
custom avec bouton de scan central surélevé**. Les 5 onglets + le profil sont retouchés.

> **Périmètre = design uniquement.** Toute la logique métier existante est conservée :
> hooks (`useAuth`, `useFaceCheckIn`, `useLocation`, `useReferencePhoto`, `useNotifications`),
> appels API / react-query, navigation expo-router, i18n. **Ne réécris pas la logique** —
> tu ne changes que le JSX/les styles et tu ajoutes quelques composants de présentation.

---

## À propos des fichiers de design
Le fichier `SmartAttendance — Refonte.html` (+ ses `.jsx`) est une **maquette de référence
réalisée en HTML/React DOM**. Ce n'est **pas** du code à copier tel quel. Ta tâche est de
**recréer ce design dans l'environnement existant du repo** : **Expo / React Native +
NativeWind (Tailwind) + Ionicons**, en suivant les patterns déjà en place dans le projet.

Ouvre le HTML dans un navigateur pour voir le rendu, les états et les interactions cibles.

## Fidélité
**Haute-fidélité (hifi).** Couleurs, typographie, espacements et interactions sont
définitifs. Reproduis l'UI au pixel près avec les libs du repo. Les valeurs exactes sont
plus bas. La maquette HTML expose un panneau « Tweaks » (couleur, police, arrondi, clair/
sombre) qui servait à explorer — **les valeurs par défaut ci-dessous sont celles à livrer.**

---

## Stack & conventions du repo (à respecter)
- **Expo 54**, React Native 0.81, expo-router 6. Lis `https://docs.expo.dev/versions/v54.0.0/` avant d'écrire du code (cf. AGENTS.md).
- **NativeWind 4** (`className=`), config dans `tailwind.config.js`. Alias : `~/*` → `./src/*`, `@/*` → `./*`.
- **Ionicons** via `@expo/vector-icons` (déjà utilisé partout — garde Ionicons, n'ajoute pas `react-native-svg`).
- **react-native-reanimated 4** est installé → utilise-le pour les animations du scan.
- Dark mode via classes `dark:` (NativeWind) + `useColorScheme`.
- Toasts : `react-native-toast-message` (déjà branché).

---

## Design tokens

### Couleurs — à mettre dans `tailwind.config.js` (`theme.extend.colors`)
Remplace le bloc `colors` existant par celui-ci (mêmes clés `primary`/`accent`/`success`/
`warning`/`danger`/`surface` pour ne rien casser ailleurs) :

```js
colors: {
  primary: {
    DEFAULT: '#2F5BFF',   // cobalt — couleur de marque (avant: #3B82F6)
    50:  '#EEF2FF',
    100: '#DCE4FF',
    500: '#2F5BFF',
    600: '#1E47E6',
    700: '#1838C2',
    800: '#152E9C',
    900: '#13287F',
    dark: '#152E9C',
  },
  accent:  '#FF8A3D',      // ambre chaud (sorties, soldes secondaires, mises en avant)
  success: '#16A34A',
  warning: '#F59E0B',
  danger:  '#EF4444',
  ink:     '#0E1326',      // texte principal (clair)
  muted:   '#717A90',      // texte secondaire (clair)
  surface: {
    light: '#F1F3FA',      // fond d'écran (clair)
    dark:  '#080B14',      // fond d'écran (sombre)
    card:  '#FFFFFF',      // carte (clair)
    cardDark: '#121829',   // carte (sombre)
    soft:  '#F7F8FD',      // sous-carte / champ (clair)
    softDark: '#1A2236',   // sous-carte / champ (sombre)
  },
}
```

Couleurs « soft » (tints, pour fonds de pastilles/icônes) — utilise des classes opacité
NativeWind plutôt que des hex figés : `bg-primary/10`, `bg-success/15`, `bg-accent/15`,
`bg-warning/15`. Le texte/icône reprend la couleur pleine (`text-primary`, etc.).

### Mode sombre (valeurs)
| Rôle            | Clair      | Sombre     |
|-----------------|------------|------------|
| Fond écran      | `#F1F3FA`  | `#080B14`  |
| Carte           | `#FFFFFF`  | `#121829`  |
| Sous-carte/champ| `#F7F8FD`  | `#1A2236`  |
| Texte principal | `#0E1326`  | `#F3F6FD`  |
| Texte secondaire| `#717A90`  | `#9AA5BE`  |
| Hairline/bordure| `rgba(14,19,38,.08)` | `rgba(255,255,255,.09)` |

En NativeWind : `bg-surface-light dark:bg-surface-dark`, `bg-surface-card dark:bg-surface-cardDark`,
`text-ink dark:text-white`, `text-muted dark:text-slate-400`, bordures `border-black/5 dark:border-white/10`.

### Typographie
Deux familles Google Fonts (étape d'install dédiée plus bas) :
- **Bricolage Grotesque** (700) → titres / gros chiffres / chrono. Classe `font-display`.
- **Plus Jakarta Sans** (400/500/600/700) → corps & UI. Classes `font-body`, `font-bodyMedium`, `font-bodySemibold`, `font-bodyBold`.

Échelle (taille / poids / usage) :
| Usage                         | Taille | Poids        | Famille    |
|-------------------------------|--------|--------------|------------|
| Eyebrow (« SMARTATTENDANCE ») | 11     | 800, +1.4 ls, UPPERCASE | body |
| Titre d'écran                 | 30     | 700          | display    |
| Gros chrono / KPI             | 44     | 700, tabular | display    |
| Titre de carte                | 16–17  | 700          | display    |
| Corps                         | 14–15  | 500/600      | body       |
| Légende / méta                | 12–13  | 600          | body       |
| Pastille (pill)               | 11.5   | 700          | body       |

> Les chiffres (heures, chrono, %) en `tabular-nums` (style `fontVariantNumeric` n'existe pas
> en RN → charge une variante tabular si dispo, sinon laisse, c'est secondaire).

### Rayons & ombres
- Rayon de base carte : **20** (`rounded-[20px]`), grande carte/hero : **28** (`rounded-[28px]`), champ/sous-carte : **14–16**, pastilles : `rounded-full`.
- Ombre carte (clair) : `shadow-sm` léger + bordure hairline. En sombre : pas d'ombre, bordure `border-white/10`.
- Bouton scan central : ombre colorée `shadowColor: '#2F5BFF', shadowOpacity ~0.4, radius ~22, elevation 10`.

### Espacements
Padding écran horizontal **20**, gap vertical entre blocs **14**, padding interne carte **18**,
padding sous-carte **12–14**.

---

## Composants partagés à créer (`src/components/ui/`)
Petits composants de présentation réutilisés par les écrans :

1. **`Card.tsx`** — conteneur : `bg-surface-card dark:bg-surface-cardDark rounded-[28px] p-[18px] border border-black/5 dark:border-white/10` + `shadow-sm` (clair). Prop `soft` → fond `surface-soft`, pas d'ombre.
2. **`StatusPill.tsx`** — pastille arrondie. Props `tone: 'primary'|'success'|'warning'|'accent'|'neutral'`. Fond `bg-{tone}/12`, texte `text-{tone}`, `text-[11.5px] font-bodyBold`, `px-3 py-[5px] rounded-full`. Optionnel : point coloré 6px à gauche.
3. **`StatChip.tsx`** — petite tuile KPI : icône Ionicons + label (12, muted, uppercase) + valeur (19, display). Fond `surface-soft`, `flex-1`, `rounded-[20px] p-3`.
4. **`WeekBars.tsx`** — mini bar chart hebdo. Reçoit `data: {label, v}[]` + `accentIndex`. Barres = `View` à hauteur proportionnelle (max ~70), `rounded-[7px]`. Barre active = `bg-primary` ; autres = `bg-primary/30` ; zéro = hairline. Label jour dessous (10, 600).
5. **`ProgressBar.tsx`** — barre de progression soldes : piste `h-[7px] bg-black/8 dark:bg-white/10 rounded-full`, remplissage `bg-{tone}` à `value/total %`.

---

## Écrans

### 1. Accueil — `app/(tabs)/index.tsx`
**But** : statut du jour + accès au pointage en un tap.
Conserve `useAuth`, `useRouter`, `useTranslation`, `NotificationBell`.

**Layout** (vertical, ScrollView via `ScreenContainer`) :
- **Header** : colonne {eyebrow « SMARTATTENDANCE » (primary) ; titre `Bonjour, {firstName}` (display 30, `whiteSpace`/wrap ok) ; date longue FR `Mardi 2 juin` (muted 14.5)} + `NotificationBell` aligné en haut à droite.
- **Carte hero — STATUT DU JOUR** (rounded-28, overflow hidden). Deux états selon « a pointé aujourd'hui » :
  - **Pas encore pointé** : fond dégradé cobalt→ambre (`#2F5BFF`→mix vers `#FF8A3D`), texte blanc. Eyebrow blanc « STATUT DU JOUR », titre `Pas encore pointé`, sous-texte, **bouton blanc** « Pointer mon arrivée » (icône `scan`, texte primary, `whiteSpace nowrap`) → `router.push('/(tabs)/pointage')`. Icône `scan-circle`/visage dans un carré `bg-white/18` en haut à droite.
  - **En service** (après check-in) : carte claire. Pastille `success` « ● En service » + « Arrivée HH:MM » à droite. Label « TEMPS DE TRAVAIL », **chrono live** `HH:MM:SS` (display 44, tabular) qui s'incrémente chaque seconde depuis l'heure d'arrivée. Bouton secondaire « Pointer ma sortie » (icône `arrowOut` ambre).
- **3 StatChips** en ligne : Arrivée (HH:MM ou —), Aujourd'hui (durée), Semaine (38h54).
- **Carte « Cette semaine »** : titre display 16 + pastille « 96% à l'heure » ; `WeekBars` (vendredi = accentIndex).
- **2 boutons d'action douce** (icône + label, fonds tintés) : « Demander un congé » (primary, → `/leave-new`), « Justifier une absence » (accent, → onglet Demandes).

**État** : `checkedIn` + `checkInAt` (timestamp). Le chrono = `now - checkInAt` via un `setInterval(1000)`. À brancher sur la vraie source (dernier pointage du jour via l'API d'historique) ; en attendant, dériver de `useFaceCheckIn`/historique. Le mini-graphe et « 38h54 » sont des données réelles à câbler quand dispo (placeholder sinon).

### 2. Pointage facial — `app/(tabs)/pointage.tsx`  ← MOMENT SIGNATURE
**But** : pointer entrée/sortie par reconnaissance faciale. **Garde toute la logique**
(`useCameraPermissions`, `CameraView`, `useFaceCheckIn`, `useLocation`, `useFocusEffect`,
capture photo, toasts). On refait l'**overlay** par-dessus la caméra.

**Fond** : la vraie `CameraView` (front) remplit l'écran. Si permission refusée → garder
l'écran d'autorisation actuel mais restylé (carte centrée, icône caméra, bouton primary).

**Overlay** (3 phases, machine à états locale `idle | scanning | success`) :
- **Header haut** (centré, sur la caméra) : eyebrow « RECONNAISSANCE FACIALE » (blanc 55%), titre `Pointer l'arrivée` / `Pointer la sortie` (display 26, blanc). Bouton retour (chevron) en haut-gauche, pastille `bg-white/12 rounded-[13px]`.
- **Cadre visage** centré : ovale (~234×300, `borderRadius: '48% 48% 46% 46% / 56% 56% 44% 44%'`) avec un anneau (box-shadow/bordure 3px). **idle** : anneau blanc 35% + 4 **coins/brackets** blancs. **scanning** : anneau + brackets passent en `primary` ; **ligne de scan** qui balaie verticalement (reanimated, translateY en boucle 1.4s) ; texte de statut qui défile (« Détection du visage… » → « Analyse des traits… » → « Vérification de l'identité… »). **success** : anneau vert + pastille check verte (76px) qui « pop » (scale 0.6→1), texte « Identité confirmée ».
- **Bas** :
  - **idle/scanning** : ligne localisation (icône `location` + « Siège — Casablanca »), **gros bouton rond 76px** (blanc, disque coloré 56px + icône `scan`) → lance la capture+scan. Pendant scanning : spinner.
  - **success** : **carte résultat** qui slide up : avatar + nom + département + pastille `success` « 🛡 98% » ; séparateur ; ligne « Arrivée/Sortie enregistrée » + heure (display 18) ; ligne localisation « GPS vérifié » ; bouton primary « Terminé » → revient à l'accueil en état « En service » (ou met à jour le statut).

**Timing maquette** : scanning ≈ 2,3 s puis success. **En vrai**, branche les phases sur le
cycle réel : `scanning` = pendant `checkIn.mutateAsync`, `success` = réponse OK
(`result.user`, `result.faceConfidence`), erreur = toast existant + retour `idle`. Le %
affiché = `result.faceConfidence`. Le nom/dept = `result.user`.

> Anim : utilise `react-native-reanimated` (`useSharedValue` + `withRepeat/withTiming`) pour
> le balayage et le pulse ; `withSpring` pour le pop du check. Respecte `prefers-reduced-motion`
> n'existe pas en RN — prévois juste des états finaux visibles sans anim.

### 3. Historique — `app/(tabs)/historique.tsx`
Garde `useInfiniteQuery`, le regroupement par jour, `FlatList`, refresh, pagination.
- **Header** « Historique ».
- **Carte récap semaine** (ListHeaderComponent) : « SEMAINE DU 26 MAI » + total « 38h 54 / 40h » (display 28) + pastille tendance « +2% » ; `WeekBars`.
- **Section par jour** : libellé jour (12, 800, uppercase, muted).
- **Ligne pointage** (carte `p-[14px]`, flex row) : pastille carrée 42px tintée (`success/15` entrée / `accent/15` sortie) avec icône `arrowIn`/`arrowOut` ; centre = « Entrée »/« Sortie » + localisation (icône `location` + texte) ; droite = heure (display 17) + « scan {conf}% » en primary.

### 4. Demandes — `app/(tabs)/demandes.tsx`
Garde les 2 `useInfiniteQuery` (leaves/absences), `getBalance`, le `SegmentControl`, le FAB
→ `/leave-new`, les maps de labels/couleurs (`lib/leaves`, `lib/absences`).
- **Header** « Demandes » + **SegmentControl** Congés/Absences (restylé : piste `surface-soft`, onglet actif `surface-card` + ombre).
- **Onglet Congés** : **Carte « Mes soldes »** = pour chaque type une ligne {label + « restant / total j » (display)} avec **`ProgressBar`** (tone par type). Puis liste de **cartes demande** : type (display 15) + dates (icône `calendar`) + **`StatusPill`** (tone = statut) ; motif en muted ; bloc refus en `danger/9`.
- **Onglet Absences** : cartes similaires + bouton pill « Justifier » (icône `doc`, `bg-primary/10 text-primary`) si `canJustify`.
- **FAB** « + » : `bottom-6 right-5 w-14 h-14 rounded-[20px] bg-primary`, ombre cobalt.

### 5. Profil — `app/(tabs)/profile.tsx`
Garde `useAuth`, `useReferencePhoto`, l'`ActionSheet`/`Alert` photo, `confirmLogout`.
- **Header** « Profil ».
- **Carte identité** : **Avatar** (carré arrondi `rounded-[20px]`, dégradé cobalt→ambre, initiales blanches display) + nom (display 19) + email (muted) + 2 pastilles (rôle = primary, département = neutral).
- **Carte photo de référence** : header « PHOTO DE RÉFÉRENCE » + `StatusPill` (« Validée » success / « En attente » warning). Vignette ovale (la vraie photo via `expo-image` si dispo, sinon silhouette) + texte explicatif + bouton pill « Changer la photo » (icône `camera`).
- **Carte réglages** (liste, `p-0`, lignes séparées par hairline) : lignes {icône dans carré `bg-primary/10`, label, détail/chevron à droite}. Inclure : Langue (Français), Notifications (Activées), **Mode sombre** (toggle/switch branché sur le thème), Sécurité & appareil. Réutilise un `Switch` RN stylé (piste primary quand on).
- **Bouton « Se déconnecter »** : `border-danger/30 bg-danger/8 text-danger`, icône `logout` → `confirmLogout`.
- Pied : « SmartAttendance · v2.0 » (muted, centré).

---

## Tab bar custom — `app/(tabs)/_layout.tsx`
Remplace la tab bar par défaut par une barre custom (via `tabBar={(props) => <CustomTabBar/>}`
ou `tabBarStyle` + `tabBarButton`/`tabBarBackground`). 5 onglets dans cet ordre :
**Accueil · Historique · [Pointage] · Demandes · Profil**.
- Onglets normaux : icône Ionicons (24) + label (10.5). Actif = `primary` (poids 800), inactif = muted.
- **Onglet central « Pointage » surélevé** : disque/carré arrondi 62px, dégradé cobalt, icône `scan` blanche, `marginTop: -34` (déborde au-dessus de la barre), ombre cobalt. Actif = léger lift + halo `bg-primary/12`.
- Barre : `bg-surface-card dark:bg-surface-cardDark`, bordure haute hairline, ombre douce vers le haut, padding bas pour le home indicator.
- Garde `HapticTab` pour le retour haptique.

Mapping icônes Ionicons : home→`home`, historique→`time`, pointage→`scan` (ou `scan-circle`),
demandes→`document-text`, profil→`person`. Pastille de notif : point ambre.

---

## Polices — étape d'installation
```bash
npx expo install @expo-google-fonts/bricolage-grotesque @expo-google-fonts/plus-jakarta-sans expo-font
```
Charge-les au démarrage (dans `app/_layout.tsx`, garde le splash tant que `!loaded`) :
```tsx
import { useFonts } from 'expo-font';
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque';
import {
  PlusJakartaSans_400Regular, PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

const [loaded] = useFonts({
  BricolageGrotesque_700Bold,
  PlusJakartaSans_400Regular, PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold,
});
if (!loaded) return null; // ou garder le SplashScreen
```
Puis dans `tailwind.config.js` (`theme.extend.fontFamily`) :
```js
fontFamily: {
  display:       ['BricolageGrotesque_700Bold'],
  body:          ['PlusJakartaSans_400Regular'],
  bodyMedium:    ['PlusJakartaSans_500Medium'],
  bodySemibold:  ['PlusJakartaSans_600SemiBold'],
  bodyBold:      ['PlusJakartaSans_700Bold'],
}
```
Usage : `className="font-display"`, `font-bodySemibold`, etc. (en RN les utilitaires
`font-bold`/`font-semibold` ne changent QUE le poids, pas la famille — d'où ces clés
dédiées). Si tu veux un `<Text>` par défaut en Plus Jakarta, crée un wrapper `AppText`.

> Si l'étape polices est reportée, tout reste lisible avec la police système — c'est une
> amélioration, pas un bloquant. Implémente le reste d'abord.

---

## Interactions & états (récap)
- **Navigation** : tab bar (5 onglets) ; hero accueil → onglet pointage ; actions douces → `/leave-new` & Demandes ; FAB → `/leave-new` ; bell → `/notifications` ; justifier → `/justify-absence?id=`.
- **Pointage** : `idle → scanning (pendant la mutation) → success/erreur`. Success met le statut « En service » et démarre le chrono. Erreur = toast (existant) + retour idle.
- **Chrono accueil** : `setInterval` 1 s, format `HH:MM:SS`, nettoyer à l'unmount.
- **SegmentControl Demandes** : bascule listes ; FAB visible seulement sur Congés.
- **Toggle mode sombre** (profil) : pilote le thème (NativeWind `dark:`).
- **États de chargement/vide/refresh** : conserve les `ActivityIndicator`, `ListEmptyComponent`, `RefreshControl` existants (juste re-teintés en `primary` `#2F5BFF`).

## Données / state
Aucune nouvelle source de données obligatoire : tout vient des hooks/API existants. Les
seuls ajouts d'état UI : phase du scan (local à pointage), `checkedIn/checkInAt` pour le
chrono accueil (à dériver du dernier pointage du jour), onglet actif du SegmentControl
(déjà présent). Le mini-graphe hebdo + « 38h54 » + « 96% à l'heure » sont des indicateurs à
câbler sur l'API quand les endpoints existent ; sinon, placeholders explicitement marqués.

## Assets
Aucun asset binaire. Icônes = Ionicons (déjà présent). Avatars/silhouettes = vues + dégradés
CSS/RN. Photo de référence = vraie image via `expo-image` (déjà utilisée dans `profile.tsx`).

## Fichiers de design fournis
- `SmartAttendance — Refonte.html` — prototype interactif (ouvrir au navigateur).
- `ui.jsx` — tokens (couleurs/typo/rayons), set d'icônes, primitives (`Card`, `Pill`, `StatChip`, `MiniBars`, `ProgressBar`). **Référence de valeurs**, pas du RN.
- `screens.jsx` — les 5 écrans + tab bar + flow de pointage (structure & contenu de référence).
- `app.jsx` — coquille (navigation, chrono, sheets notifications & nouvelle demande).

## Mapping fichiers cible (repo)
| Design | À recréer dans |
|---|---|
| Tokens | `tailwind.config.js`, (option) `constants/theme.ts` |
| Primitives | `src/components/ui/Card.tsx`, `StatusPill.tsx`, `StatChip.tsx`, `WeekBars.tsx`, `ProgressBar.tsx` |
| Accueil | `app/(tabs)/index.tsx` |
| Pointage | `app/(tabs)/pointage.tsx` |
| Historique | `app/(tabs)/historique.tsx` |
| Demandes | `app/(tabs)/demandes.tsx` |
| Profil | `app/(tabs)/profile.tsx` |
| Tab bar | `app/(tabs)/_layout.tsx` (+ option `src/components/ui/CustomTabBar.tsx`) |
| Polices | `app/_layout.tsx` + `tailwind.config.js` |

## Ordre d'implémentation conseillé
1. Tokens (`tailwind.config.js`) + primitives `ui/`.
2. Tab bar custom.
3. Accueil (sans polices custom d'abord).
4. Pointage (overlay + anim) — branché sur la vraie mutation.
5. Historique, Demandes, Profil.
6. Polices (install + swaps de classes).
7. Passe dark mode + QA sur device iOS et Android.
