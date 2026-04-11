import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enEditor from './locales/en/editor.json';
import enExecution from './locales/en/execution.json';
import enErrors from './locales/en/errors.json';
import ruCommon from './locales/ru/common.json';
import ruEditor from './locales/ru/editor.json';
import ruExecution from './locales/ru/execution.json';
import ruErrors from './locales/ru/errors.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        editor: enEditor,
        execution: enExecution,
        errors: enErrors,
      },
      ru: {
        common: ruCommon,
        editor: ruEditor,
        execution: ruExecution,
        errors: ruErrors,
      },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'app_language',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
