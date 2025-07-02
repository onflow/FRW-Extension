import i18n from 'i18next';

import messages from '../../messages.json';

export const fetchLocale = async (locale) => {
  const res = messages;
  const data = res;
  return Object.keys(data).reduce((res, key) => {
    return {
      ...res,
      [key.replace(/__/g, ' ')]: data[key].message,
    };
  }, {});
};

i18n.init({
  fallbackLng: 'en',
  defaultNS: 'translations',
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
});

export const I18N_NS = 'translations';

export const addResourceBundle = async (locale: string) => {
  if (i18n.hasResourceBundle(locale, I18N_NS)) return;
  const bundle = await fetchLocale(locale);

  i18n.addResourceBundle(locale, 'translations', bundle);
};

addResourceBundle('en');

i18n.on('languageChanged', function (lng) {
  addResourceBundle(lng);
});

export default i18n;
