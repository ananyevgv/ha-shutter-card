// translations/index.js

import en from './en.json' assert { type: 'json' };
import ru from './ru.json' assert { type: 'json' };
import de from './de.json' assert { type: 'json' };
import fr from './fr.json' assert { type: 'json' };
import it from './it.json' assert { type: 'json' };
import nl from './nl.json' assert { type: 'json' };
import pl from './pl.json' assert { type: 'json' };
import pt from './pt.json' assert { type: 'json' };
import sv from './sv.json' assert { type: 'json' };
import hu from './hu.json' assert { type: 'json' };
import cs from './cs.json' assert { type: 'json' };
import sl from './sl.json' assert { type: 'json' };

// Все поддерживаемые языки
const TRANSLATIONS = {
  en,
  ru,
  de,
  fr,
  it,
  nl,
  pl,
  pt,
  sv,
  hu,
  cs,
  sl,
};

// Язык по умолчанию
export const DEFAULT_LANGUAGE = 'en';

// Список поддерживаемых языков
export const SUPPORTED_LANGUAGES = Object.keys(TRANSLATIONS);

// Функция получения перевода
export function getTranslation(lang = DEFAULT_LANGUAGE) {
  const langCode = lang.toLowerCase();
  if (TRANSLATIONS[langCode]) {
    return TRANSLATIONS[langCode];
  }
  return TRANSLATIONS[DEFAULT_LANGUAGE];
}

// Функция получения строки по ключу с подстановкой параметров
export function getLocalizedString(lang, key, params = {}) {
  const translations = getTranslation(lang);
  const keys = key.split('.');
  let value = translations;
  
  for (const k of keys) {
    if (value && value[k] !== undefined) {
      value = value[k];
    } else {
      // Если ключ не найден, пробуем на английском
      const fallback = getTranslation(DEFAULT_LANGUAGE);
      let fallbackValue = fallback;
      for (const fk of keys) {
        if (fallbackValue && fallbackValue[fk] !== undefined) {
          fallbackValue = fallbackValue[fk];
        } else {
          return key; // Возвращаем сам ключ
        }
      }
      value = fallbackValue;
      break;
    }
  }
  
  // Подстановка параметров {param}
  if (typeof value === 'string' && params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? params[paramKey] : match;
    });
  }
  
  return value;
}

// Экспортируем всё
export default {
  getTranslation,
  getLocalizedString,
  TRANSLATIONS,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
};
