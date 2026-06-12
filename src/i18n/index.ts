import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './en.json';
import fr from './fr.json';

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

export default i18n;
