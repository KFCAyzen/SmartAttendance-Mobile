# Icône SmartAttendance — jeu d'export

Direction **Visage × Prisme**, réglage **Ton sur ton** (visage dégradé).
Palette : bleu `#2F5BFF` → violet `#7E5BFF`, fond encre `#0B0F22`.

## Fichiers à intégrer (Expo / `app.json`)

Déposez ces fichiers dans `assets/images/` :

| Fichier | Rôle dans `app.json` |
|---|---|
| `icon.png` (1024², plein cadre) | `expo.icon` — iOS + Android legacy |
| `android-icon-foreground.png` (transparent) | `android.adaptiveIcon.foregroundImage` |
| `android-icon-background.png` | `android.adaptiveIcon.backgroundImage` |
| `android-icon-monochrome.png` (transparent) | `android.adaptiveIcon.monochromeImage` |
| `splash-icon.png` | `expo-splash-screen.image` |
| `favicon.png` (48²) | `web.favicon` |

### Ajustement recommandé dans `app.json`
Le fond adaptatif est désormais sombre — alignez la couleur de repli :

```json
"adaptiveIcon": {
  "backgroundColor": "#0B0F22",
  "foregroundImage": "./assets/images/android-icon-foreground.png",
  "backgroundImage": "./assets/images/android-icon-background.png",
  "monochromeImage": "./assets/images/android-icon-monochrome.png"
}
```

Pour le splash, un fond sombre met mieux l'icône en valeur :
`"backgroundColor": "#0B0F22"`.

## Aperçus (non destinés à l'app)
`ios-preview.png`, `android-preview-circle.png` — rendus masqués pour visualisation.

> Toutes les icônes sont vectorielles à l'origine : si vous voulez d'autres tailles,
> un format clair, ou un ajustement, je régénère en quelques secondes.
