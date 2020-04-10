import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { Cookie } from '@nimiq/utils';

Vue.use(VueI18n);

const DEFAULT_LANGUAGE = 'en';
const SUPPORTED_LANGUAGES = [DEFAULT_LANGUAGE];
const loadedLanguage: string[] = []; // our default language that is preloaded, if any

export const i18n = new VueI18n({
    locale: DEFAULT_LANGUAGE, // set locale (2 letters format: 'en')
    fallbackLocale: DEFAULT_LANGUAGE, // fallback locale if no translation found
    silentTranslationWarn: true, // disable the "no translation found" warning
});

function setI18nLanguage(lang: string) {
    const { hostname } = window.location;
    const cookieDomain = hostname.includes('nimiq-testnet.com') ? 'nimiq-testnet.com'
        : hostname.includes('nimiq.com') ? 'nimiq.com'
            : undefined;

    Cookie.setCookie('lang', lang, { domain: cookieDomain });
    i18n.locale = lang;
    return lang;
}

export function loadLanguageAsync(lang: string) {
    if (!SUPPORTED_LANGUAGES.includes(lang)) lang = DEFAULT_LANGUAGE;

    // If the language was already loaded
    if (loadedLanguage.includes(lang)) {
        return Promise.resolve(setI18nLanguage(lang));
    }

    // If the language hasn't been loaded yet
    return import(/* webpackChunkName: "lang-[request]" */ `@/i18n/${lang}.po`).then(
        (messages) => {
            i18n.setLocaleMessage(lang, messages.default);
            loadedLanguage.push(lang);
            return setI18nLanguage(lang);
        },
    );
}

export function autodetectLanguage() {
    const langCookie = Cookie.getCookie('lang');
    const langRaw = window.navigator.language;
    const langParts = langRaw.replace('-', '_').split('_');
    return langCookie || langParts[0];
}
