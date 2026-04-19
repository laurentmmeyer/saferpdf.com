import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";

const SUPPORTED = ["en", "fr", "de"];

function detectLanguage() {
  if (typeof document === "undefined") return "en";

  const htmlLang = document.documentElement.lang?.slice(0, 2).toLowerCase();
  if (htmlLang && SUPPORTED.includes(htmlLang)) return htmlLang;

  const pathLang = window.location.pathname.split("/")[1]?.toLowerCase();
  if (pathLang && SUPPORTED.includes(pathLang)) return pathLang;

  return "en";
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    de: { translation: de },
  },
  lng: detectLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
