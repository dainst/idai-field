import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getUserInterfaceLanguage } from '../shared/languages';
import messagesDE from './messages.de.json';
import messagesEN from './messages.en.json';


i18n.use(initReactI18next)
    .init({
        lng: getUserInterfaceLanguage(),
        fallbackLng: 'en',
        resources: {
            en: {
                translation: messagesEN
            },
            de: {
                translation: messagesDE
            }
        },
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
