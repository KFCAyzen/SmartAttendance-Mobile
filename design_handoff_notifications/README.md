# Handoff — Page Notifications · SmartAttendance Mobile

## Vue d'ensemble
Nouvelle **page Notifications** (centre de notifications) pour l'app mobile
**SmartAttendance**. Elle remplace l'ancienne *bottom-sheet* de notifications par un **écran
plein** accessible depuis la cloche (`NotificationBell`) de l'accueil → route
`/notifications`. L'écran combine deux logiques :

1. **« À traiter »** — un bloc de triage en tête, qui regroupe les notifications
   *actionnables* (absence à justifier, oubli de pointage, nouvel appareil) sous forme de
   cartes mises en avant avec un bouton d'action inline. Quand la pile est vide → état
   « Tout est à jour ».
2. **Fil chronologique** — le reste des notifications, regroupées par période
   (Aujourd'hui / Cette semaine / Plus tôt), affichées le long d'un **rail timeline**.
   Les non-lues portent un point ambré ; un tap les marque comme lues.

En complément : **filtres par catégorie** (Tout / Pointage / Congés / Sécurité) avec
compteurs, et un bouton **« Tout lire »**.

---

## À propos des fichiers de design
Les fichiers de ce bundle (`SmartAttendance - Notifications.html` + ses `.jsx`) sont une
**maquette de référence réalisée en HTML / React DOM**. Ce n'est **pas** du code à copier tel
quel. La tâche est de **recréer ce design dans l'environnement existant du repo** : **Expo /
React Native + NativeWind (Tailwind) + Ionicons**, en suivant les patterns déjà en place
(cf. le handoff de la refonte). Ouvre le HTML dans un navigateur pour voir le rendu, les
états et les interactions cibles.

## Fidélité
**Haute-fidélité (hifi).** Couleurs, typographie, espacements et interactions sont
définitifs. Les tokens repris sont **strictement ceux de la refonte** (mêmes variables
`primary`/`accent`/`surface`/typo). Reproduis l'UI au pixel près avec les libs du repo.

---

## Stack & conventions (rappel)
- **Expo 54 / RN 0.81 / expo-router 6**, **NativeWind 4** (`className=`), **Ionicons** via
  `@expo/vector-icons`, **reanimated 4** dispo pour les animations.
- Dark mode via classes `dark:` + `useColorScheme`.
- Cet écran ne change **aucune logique métier** : il consomme `useNotifications` (liste +
  `unreadCount` + `markAsRead`/`markAllAsRead`) et `useRouter` pour la navigation des actions.

---

## Design tokens (rappel — identiques à la refonte)

### Couleurs
| Rôle             | Clair                 | Sombre                |
|------------------|-----------------------|-----------------------|
| Primary (cobalt) | `#2F5BFF`             | `#2F5BFF`             |
| Accent (ambre)   | `#FF8A3D`             | `#FF8A3D`             |
| Success          | `#16A34A`             | `#16A34A`             |
| Warning          | `#F59E0B`             | `#F59E0B`             |
| Danger           | `#EF4444`             | `#EF4444`             |
| Fond écran       | `#F1F3FA`             | `#080B14`             |
| Carte            | `#FFFFFF`             | `#121829`             |
| Sous-carte/champ | `#F7F8FD`             | `#1A2236`             |
| Texte principal  | `#0E1326`             | `#F3F6FD`             |
| Texte secondaire | `#717A90`             | `#9AA5BE`             |
| Texte tertiaire  | `#9AA2B5`             | `#67718C`             |
| Hairline/bordure | `rgba(14,19,38,.08)`  | `rgba(255,255,255,.09)` |

**Teintes « soft »** (fonds de pastilles/tuiles d'icône) — utilise les classes opacité
NativeWind : `bg-primary/12`, `bg-success/14`, `bg-warning/16`, `bg-accent/16`. L'icône/texte
reprend la couleur pleine (`text-primary`…).

### Typographie
- **Bricolage Grotesque 700** → titres / chiffres (classe `font-display`).
- **Plus Jakarta Sans 400/500/600/700/800** → corps & UI (`font-body`, `font-bodySemibold`, `font-bodyBold`).

| Usage                            | Taille | Poids | Famille |
|----------------------------------|--------|-------|---------|
| Eyebrow « SMARTATTENDANCE »      | 11     | 800, +1.4 ls, UPPERCASE | body |
| Titre d'écran « Notifications »  | 30     | 700   | display |
| Titre carte triage              | 15.5   | 700   | display |
| Titre ligne de fil              | 14.5   | 700 (non-lu) / 600 (lu) | display |
| Corps / body de notif           | 12.6–12.8 | 500 | body |
| Méta / heure                    | 11–11.5| 600   | body |
| Label de section (AUJOURD'HUI…) | 11.5   | 800, +1 ls, UPPERCASE | body |
| Pastille / chip                 | 12.5   | 700   | body |

### Rayons & ombres
- Carte triage / carte fil : `rounded-[28px]` (`--r-lg`). Tuile d'icône : `rounded-[12px]`
  (`--r-sm`). Chips & pastilles : `rounded-full`.
- Ombre carte (clair) : `shadow-sm` léger + bordure hairline. Sombre : pas d'ombre, bordure
  `border-white/10`.
- Badge compteur (titre) : ombre ambrée douce `shadowColor #FF8A3D, opacity ~.45, radius ~12`.

### Espacements
Padding horizontal écran **20**, gap vertical entre blocs **16**, padding interne carte fil
**16**, padding carte triage **15**, gap icône↔texte **13**.

---

## Écran — `app/notifications.tsx` (ou `app/(modals)/notifications.tsx`)

Layout vertical, `ScrollView`. Ordre des blocs :

### 1. Header
Ligne `flex-row items-start justify-between` :
- **Gauche** (colonne) : eyebrow « SMARTATTENDANCE » (11/800, primary, uppercase) ;
  en dessous, ligne `flex-row items-center gap-[10]` = **titre « Notifications »** (display
  30/700, `text-ink`) + **badge compteur non-lus** (pill ambre : texte blanc 13/700, `min-w
  24`, `h-24`, `px-2`, `rounded-full`, ombre ambrée). Le badge n'apparaît que si
  `unreadCount > 0`.
- **Droite** : bouton **« Tout lire »** (`border-hairline bg-surface-card rounded-[14px]
  px-3 py-[10px]`, icône Ionicons `checkmark-done-outline` 16 + label 12/700 primary).
  `disabled` (opacité .6, texte tertiaire) quand `unreadCount === 0`. → `markAllAsRead()`.

### 2. Filtres (chips horizontales scrollables)
`flex-row gap-2`, scroll horizontal. 4 chips : **Tout · Pointage · Congés · Sécurité**.
- Chip inactive : `border-hairline bg-surface-card text-muted rounded-full px-[14px] py-[9px]`,
  label 12.5/700.
- Chip **active** : fond `bg-ink` (texte `text-surface-light` = inversé), bordure transparente.
- Compteur par chip (si > 0) : petite pastille à droite (`min-w 17 h-17 px-[5] rounded-full`,
  10.5/800). Inactive : `bg-primary/12 text-primary`. Active : `bg-surface-light text-ink`.
- Le compteur d'une catégorie = (notifs *à traiter* de la catégorie) + (notifs *non-lues* de
  la catégorie). « Tout » = somme.

### 3. Bloc « À traiter »
Affiché si `filter === 'all'` **ou** s'il reste des items à traiter dans le filtre courant.
- **Label de section** : « À TRAITER » (gauche) + à droite, si pile non vide, un compteur
  ambré `flex-row items-center gap-[5]` : icône `sparkles` 13 (accent) + « {n} en attente »
  (11/700 accent).
- **Cartes triage** (une par item *pinned*) — `flex-row gap-[13] bg-surface-card border-hairline
  rounded-[28px] p-[15] shadow-sm` :
  - **Tuile d'icône** 44×44, `rounded-[12px]`, fond `bg-{tone}/soft`, icône Ionicons (couleur
    pleine `tone`), glyphe ~46% de la tuile.
  - **Contenu** (colonne) : ligne titre+heure (`justify-between`) → titre (display 15.5/700
    ink) + heure (11.5/600 tertiaire) ; **body** (12.8/500 muted, `leading-[1.45]`,
    `mt-1`) ; **rangée d'actions** (`flex-row gap-2 mt-3`) :
    - Bouton **action** : `bg-{tone} text-white rounded-full px-4 py-[9px]` (12.5/700) + icône
      `arrow-forward` 14 blanche à droite.
    - Bouton **« Ignorer »** : `border-hairline bg-transparent text-muted rounded-full px-[14]
      py-[9px]` (12.5/700).
- **État vide** (« Tout est à jour ») quand la pile est traitée : bandeau
  `flex-row items-center gap-[14] bg-success/14 border-success/22 rounded-[28px] px-[18] py-4` :
  disque success 42 avec `checkmark` blanc (24) + texte (titre display 15.5/700 ink « Tout est
  à jour » / sous-titre 12.6/500 muted « Aucune action en attente… »). Disque animé `pop`
  (scale 0.6→1.08→1) à l'apparition — **état final visible sans anim**.

### 4. Fil chronologique
Pour chaque période non vide (`today` → « Aujourd'hui », `week` → « Cette semaine »,
`earlier` → « Plus tôt ») :
- **Label de section** (uppercase, 11.5/800, tertiaire).
- **Carte conteneur** `bg-surface-card border-hairline rounded-[28px] p-4` contenant les
  lignes.
- **Ligne de notif** (`FeedRow`) — `flex-row gap-[13]`, `onPress` → `markAsRead(id)` si non-lue :
  - **Rail timeline** (si activé) : colonne 44 large ; **trait vertical** 2px `bg-hairline`
    reliant les tuiles (du bas d'une tuile au haut de la suivante — masqué sur la dernière
    ligne) ; **tuile d'icône** 44 (cf. plus haut), opacité **.6** si la notif est *lue*.
  - **Contenu** : ligne titre+heure ; le titre est précédé d'un **point ambré 7px** (animé
    `shimmer` doux) **seulement si non-lu**. Titre display 14.5, 700 (non-lu) / 600 (lu),
    couleur `ink` (non-lu) / `muted` (lu), `truncate`. Heure 11/600 tertiaire.
  - **Body** 12.6/500, `muted` (non-lu) / tertiaire (lu), `mt-[3] leading-[1.45]`.
  - **Lien optionnel** (`link`) : `flex-row items-center gap-1 mt-2`, 12.5/700 primary + chevron
    `chevron-forward` 13 → navigue vers l'écran concerné (ex. `/(tabs)/historique`,
    `/(tabs)/demandes`).
- **Variante sans timeline** (toggle « Fil chronologique » off) : pas de rail ni de trait,
  tuile 42, lignes séparées par un hairline `border-b` (sauf la dernière), `gap-[14]`.

### 5. État vide par filtre
Si une catégorie filtrée n'a ni triage ni fil : bloc centré (`py-[38] text-tertiary 13.5/`),
icône `notifications-outline` 30 + « Aucune notification dans cette catégorie. »

---

## Interactions & comportement
- **Navigation d'entrée** : cloche de l'accueil → `router.push('/notifications')`. Bouton
  retour = chrome natif (header expo-router) ou chevron custom.
- **Filtres** : `useState('all')` ; filtre la liste affichée (triage + fil). Les chips
  recalculent leurs compteurs depuis la liste.
- **Marquer comme lu** : tap sur une ligne non-lue → `markAsRead(id)` (le point disparaît,
  titre passe en 600 + couleur muted, tuile à .6). « Tout lire » → `markAllAsRead()` (ne
  touche pas aux items *à traiter*).
- **Traiter / Ignorer** : sur une carte triage, *Action* ou *Ignorer* retire la carte avec une
  **animation de collapse** (~0.42s : fondu + glissement `translateX(36px)` + `max-height`
  → 0). En prod, *Action* doit aussi **naviguer** vers l'écran de résolution
  (ex. `Justifier` → `/justify-absence?id=`, `Régulariser` → pointage, `C'est moi` →
  acquittement sécurité) ; *Ignorer* = dismiss local / `dismiss(id)`.
- **Animations** (reanimated en RN) :
  - `collapse` des cartes triage (cf. ci-dessus).
  - `pop` du disque « Tout est à jour » (`withSpring`, scale 0.6→1).
  - `shimmer` du point non-lu (opacité .55↔1, ~1.8s, en boucle douce).
  > ⚠️ **Toujours rendre l'état final visible sans animation** (pas d'`opacity:0` persistant si
  > l'anim ne tourne pas). Les contenus ne dépendent **pas** d'une animation d'entrée.

## State management
État **UI local** uniquement (la donnée vient de `useNotifications`) :
- `filter: 'all' | 'pointage' | 'conges' | 'securite'`.
- `collapsing: Record<id, boolean>` — cartes triage en cours de retrait (anim).
- Données : `notifications` (liste), `unreadCount`, `markAsRead(id)`, `markAllAsRead()`,
  `dismiss(id)` depuis le hook existant. Chaque notif expose au minimum :
  `{ id, category, tone, icon, title, body, time, unread, pinned?, action?, actionTone?,
  link?, group }`.
  - `category` → catégorie de filtre (`pointage` | `conges` | `securite`).
  - `tone` → couleur sémantique (`success`/`warning`/`primary`/`accent`/`danger`).
  - `pinned: true` → va dans « À traiter » (sinon dans le fil).
  - `group` → `today` | `week` | `earlier` (dériver de la date côté hook).

## Mapping icônes (Ionicons)
| Maquette (`ui.jsx`) | Ionicons | Emploi |
|---|---|---|
| `bell`        | `notifications-outline`     | absence à justifier, vide |
| `clock`       | `time-outline`              | oubli de pointage |
| `shield`      | `shield-checkmark-outline`  | nouvel appareil |
| `checkCircle` | `checkmark-circle`          | arrivée enregistrée, « Tout lire » |
| `check`       | `checkmark`                 | congé approuvé, « Tout est à jour » |
| `calendar`    | `calendar-outline`          | rappel solde |
| `trend`       | `trending-up`               | bilan de semaine |
| `lock`        | `lock-closed-outline`       | mot de passe modifié |
| `doc`         | `document-text-outline`     | justificatif accepté |
| `sparkle`     | `sparkles`                  | « n en attente » |
| `arrowRight`  | `arrow-forward`             | bouton action triage |
| `chevron`     | `chevron-forward`           | liens |

## Assets
Aucun asset binaire. Icônes = Ionicons. Tuiles/disques = vues + teintes (pas d'image).

## Contenu (copie exacte de la maquette — à remplacer par la vraie donnée)
- À traiter : « Absence à justifier » / « Oubli de pointage » / « Nouvel appareil connecté ».
- Aujourd'hui : « Arrivée enregistrée » / « Congé approuvé ».
- Cette semaine : « Rappel · solde de congés » / « Bilan de la semaine ».
- Plus tôt : « Mot de passe modifié » / « Justificatif accepté ».
> Ces libellés sont des **placeholders** : la vraie liste vient de `useNotifications`.

## Fichiers fournis
- `SmartAttendance - Notifications.html` — prototype interactif (ouvrir au navigateur ; panneau
  « Tweaks » : couleur, accent, police, arrondi, mode sombre, fil chronologique on/off).
- `notif-app.jsx` — écran Notifications + cartes triage + fil timeline + logique d'état (réf).
- `ui.jsx` — tokens (couleurs/typo/rayons), set d'icônes, primitives (`Card`, `Pill`, `Icon`).
  **Référence de valeurs**, pas du RN.

## Mapping fichiers cible (repo)
| Design | À recréer dans |
|---|---|
| Écran Notifications | `app/notifications.tsx` |
| Carte triage | `src/components/notifications/TriageCard.tsx` |
| Ligne de fil | `src/components/notifications/NotificationRow.tsx` |
| Filtres | `src/components/notifications/CategoryFilter.tsx` |
| Tokens / primitives | déjà créés à la refonte (`tailwind.config.js`, `src/components/ui/`) |
| Hook données | `useNotifications` (existant) |
