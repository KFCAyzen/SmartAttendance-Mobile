import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './en.json';
import fr from './fr.json';
import schoolEn from './school.en.json';
import schoolFr from './school.fr.json';

const LANGUAGE_KEY = 'sa.language';
const deviceLanguage = getLocales()[0]?.languageCode ?? 'fr';

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  lng: deviceLanguage === 'en' ? 'en' : 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

// Le choix explicite de l'utilisateur (async) prime sur la langue de l'appareil.
void AsyncStorage.getItem(LANGUAGE_KEY).then((saved) => {
  if (saved && saved !== i18n.language) void i18n.changeLanguage(saved);
});

export async function setLanguage(lng: 'fr' | 'en') {
  await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  await i18n.changeLanguage(lng);
}

// Bascule le vocabulaire selon le contexte de l'instance : les overlays
// « école » ne redéfinissent que les clés qui changent (étudiants, classes,
// autorisations…), le reste hérite des fichiers de base.
export function applyAppContext(context: 'ENTERPRISE' | 'SCHOOL') {
  // Restaure d'abord le vocabulaire de base (annule un éventuel overlay).
  i18n.addResourceBundle('fr', 'translation', fr, true, true);
  i18n.addResourceBundle('en', 'translation', en, true, true);
  if (context === 'SCHOOL') {
    i18n.addResourceBundle('fr', 'translation', schoolFr, true, true);
    i18n.addResourceBundle('en', 'translation', schoolEn, true, true);
  }
  // Re-render des composants abonnés sans changer de langue.
  void i18n.changeLanguage(i18n.language);
}

export default i18n;
