/* eslint-disable @typescript-eslint/no-explicit-any */
import { clone } from 'tsfun';
import configAbbirCella from '../../../config/Config-AbbirCella.json';
import configAlUla from '../../../config/Config-AlUla.json';
import configAyamonte from '../../../config/Config-Ayamonte.json';
import configBoha from '../../../config/Config-Boha.json';
import configBourgou from '../../../config/Config-Bourgou.json';
import configCampidoglio from '../../../config/Config-Campidoglio.json';
import configCastiglione from '../../../config/Config-Castiglione.json';
import configDefault from '../../../config/Config-Default.json';
import configElephantine from '../../../config/Config-Elephantine.json';
import configGadara from '../../../config/Config-Gadara.json';
import configGoebekliTepe from '../../../config/Config-GoebekliTepe.json';
import configHeliopolis from '../../../config/Config-Heliopolis.json';
import configKalapodi from '../../../config/Config-Kalapodi.json';
import configKarthagoCircus from '../../../config/Config-KarthagoCircus.json';
import configKephissostal from '../../../config/Config-Kephissostal.json';
import configKGR from '../../../config/Config-KGR.json';
import configMeninx from '../../../config/Config-Meninx.json';
import configMilet from '../../../config/Config-Milet.json';
import configMonTur from '../../../config/Config-MonTur.json';
import configOlympia from '../../../config/Config-Olympia.json';
import configPergamon from '../../../config/Config-Pergamon.json';
import configPostumii from '../../../config/Config-Postumii.json';
import configSelinunt from '../../../config/Config-Selinunt.json';
import configSelinuntAkropolis from '../../../config/Config-SelinuntAkropolis.json';
import configSelinuntBauteile from '../../../config/Config-SelinuntBauteile.json';
import configSudanHeritage from '../../../config/Config-SudanHeritage.json';
import configUruk from '../../../config/Config-Uruk.json';
import coreLanguageDe from '../../../config/Core/Language.de.json';
import coreLanguageEn from '../../../config/Core/Language.en.json';
import coreLanguageEs from '../../../config/Core/Language.es.json';
import coreLanguageIt from '../../../config/Core/Language.it.json';
import coreLanguageFr from '../../../config/Core/Language.fr.json';
import coreLanguageUk from '../../../config/Core/Language.uk.json';
import languageAbbirCella_en from '../../../config/Language-AbbirCella.en.json';
import languageAbbirCella_fr from '../../../config/Language-AbbirCella.fr.json';
import languageAlUla_en from '../../../config/Language-AlUla.en.json';
import languageAyamonte_de from '../../../config/Language-Ayamonte.de.json';
import languageAyamonte_en from '../../../config/Language-Ayamonte.en.json';
import languageAyamonte_es from '../../../config/Language-Ayamonte.es.json';
import languageBoha_de from '../../../config/Language-Boha.de.json';
import languageBourgou_de from '../../../config/Language-Bourgou.de.json';
import languageBourgou_en from '../../../config/Language-Bourgou.en.json';
import languageBourgou_fr from '../../../config/Language-Bourgou.fr.json';
import languageCampidoglio_en from '../../../config/Language-Campidoglio.en.json';
import languageCastiglione_en from '../../../config/Language-Castiglione.en.json';
import languageDefault_de from '../../../config/Language-Default.de.json';
import languageDefault_en from '../../../config/Language-Default.en.json';
import languageElephantine_de from '../../../config/Language-Elephantine.de.json';
import languageElephantine_en from '../../../config/Language-Elephantine.en.json';
import languageGadara_de from '../../../config/Language-Gadara.de.json';
import languageGadara_en from '../../../config/Language-Gadara.en.json';
import languageGoebekliTepe_en from '../../../config/Language-GoebekliTepe.en.json';
import languageHeliopolis_en from '../../../config/Language-Heliopolis.en.json';
import languageKalapodi_de from '../../../config/Language-Kalapodi.de.json';
import languageKarthagoCircus_en from '../../../config/Language-KarthagoCircus.en.json';
import languageKarthagoCircus_fr from '../../../config/Language-KarthagoCircus.fr.json';
import languageKephissostal_de from '../../../config/Language-Kephissostal.de.json';
import languageKGR_de from '../../../config/Language-KGR.de.json';
import languageMeninx_de from '../../../config/Language-Meninx.de.json';
import languageMeninx_en from '../../../config/Language-Meninx.en.json';
import languageMilet_de from '../../../config/Language-Milet.de.json';
import languageMilet_en from '../../../config/Language-Milet.en.json';
import languageMilet_fr from '../../../config/Language-Milet.fr.json';
import languageMonTur_de from '../../../config/Language-MonTur.de.json';
import languagePergamon_de from '../../../config/Language-Pergamon.de.json';
import languagePergamon_en from '../../../config/Language-Pergamon.en.json';
import languagePostumii_de from '../../../config/Language-Postumii.de.json';
import languagePostumii_it from '../../../config/Language-Postumii.it.json';
import languageOlympia_de from '../../../config/Language-Olympia.de.json';
import languageOlympia_en from '../../../config/Language-Olympia.en.json';
import languageSelinunt_de from '../../../config/Language-Selinunt.de.json';
import languageSelinunt_en from '../../../config/Language-Selinunt.en.json';
import languageSelinunt_it from '../../../config/Language-Selinunt.it.json';
import languageSelinuntBauteile_de from '../../../config/Language-SelinuntBauteile.de.json';
import languageSelinuntBauteile_en from '../../../config/Language-SelinuntBauteile.en.json';
import languageSelinuntBauteile_it from '../../../config/Language-SelinuntBauteile.it.json';
import languageSelinuntAkropolis_de from '../../../config/Language-SelinuntAkropolis.de.json';
import languageSudanHeritage_en from '../../../config/Language-SudanHeritage.en.json';
import languageUruk_en from '../../../config/Language-Uruk.en.json';
import libraryForms from '../../../config/Library/Forms.json';
import libraryCategories from '../../../config/Library/Categories.json';
import libraryTemplates from '../../../config/Library/Templates/Templates.json';
import libraryTemplatesLanguageDe from '../../../config/Library/Templates/Language.de.json';
import libraryTemplatesLanguageEn from '../../../config/Library/Templates/Language.en.json';
import libraryTemplatesLanguageIt from '../../../config/Library/Templates/Language.it.json';
import libraryTemplatesLanguageUk from '../../../config/Library/Templates/Language.uk.json';
import libraryLanguageDe from '../../../config/Library/Language.de.json';
import libraryLanguageEn from '../../../config/Library/Language.en.json';
import libraryLanguageEs from '../../../config/Library/Language.es.json';
import libraryLanguageIt from '../../../config/Library/Language.it.json';
import libraryLanguageFr from '../../../config/Library/Language.fr.json';
import libraryLanguageUk from '../../../config/Library/Language.uk.json';
import libraryValuelists from '../../../config/Library/Valuelists.json';
import { LanguageConfiguration } from '../model';


const PATH_MAP: Record<string, any> = {
    '/Core/Language.de.json': coreLanguageDe,
    '/Core/Language.en.json': coreLanguageEn,
    '/Core/Language.es.json': coreLanguageEs,
    '/Core/Language.it.json': coreLanguageIt,
    '/Core/Language.fr.json': coreLanguageFr,
    '/Core/Language.uk.json': coreLanguageUk,
    '/Library/Categories.json': libraryCategories,
    '/Library/Forms.json': libraryForms,
    '/Library/Templates/Templates.json': libraryTemplates,
    '/Library/Templates/Language.de.json': libraryTemplatesLanguageDe,
    '/Library/Templates/Language.en.json': libraryTemplatesLanguageEn,
    '/Library/Templates/Language.it.json': libraryTemplatesLanguageIt,
    '/Library/Templates/Language.uk.json': libraryTemplatesLanguageUk,
    '/Library/Language.de.json': libraryLanguageDe,
    '/Library/Language.en.json': libraryLanguageEn,
    '/Library/Language.es.json': libraryLanguageEs,
    '/Library/Language.it.json': libraryLanguageIt,
    '/Library/Language.fr.json': libraryLanguageFr,
    '/Library/Language.uk.json': libraryLanguageUk,
    '/Library/Valuelists.json': libraryValuelists,
    '/Config-Default.json': configDefault,
    '/Config-AbbirCella.json': configAbbirCella,
    '/Config-AlUla.json': configAlUla,
    '/Config-Ayamonte.json': configAyamonte,
    '/Config-Boha.json': configBoha,
    '/Config-Bourgou.json': configBourgou,
    '/Config-Campidoglio.json': configCampidoglio,
    '/Config-Castiglione.json': configCastiglione,
    '/Config-Elephantine.json': configElephantine,
    '/Config-Gadara.json': configGadara,
    '/Config-GoebekliTepe.json': configGoebekliTepe,
    '/Config-Heliopolis.json': configHeliopolis,
    '/Config-Kalapodi.json': configKalapodi,
    '/Config-KarthagoCircus.json': configKarthagoCircus,
    '/Config-Kephissostal.json': configKephissostal,
    '/Config-KGR.json': configKGR,
    '/Config-Meninx.json': configMeninx,
    '/Config-Milet.json': configMilet,
    '/Config-MonTur.json': configMonTur,
    '/Config-Olympia.json': configOlympia,
    '/Config-Pergamon.json': configPergamon,
    '/Config-Postumii.json': configPostumii,
    '/Config-Selinunt.json': configSelinunt,
    '/Config-SelinuntAkropolis.json': configSelinuntAkropolis,
    '/Config-SelinuntBauteile.json': configSelinuntBauteile,
    '/Config-SudanHeritage.json': configSudanHeritage,
    '/Config-Uruk.json': configUruk
};


const CUSTOM_LANGUAGE_CONFIGURATIONS: Record<string, { [language: string]: LanguageConfiguration }> = {
    'AbbirCella': { en: languageAbbirCella_en, fr: languageAbbirCella_fr },
    'AlUla': { en: languageAlUla_en },
    'Ayamonte': { de: languageAyamonte_de, en: languageAyamonte_en, es: languageAyamonte_es },
    'Boha': { de: languageBoha_de },
    'Bourgou': { de: languageBourgou_de, en: languageBourgou_en, fr: languageBourgou_fr },
    'Campidoglio': { en: languageCampidoglio_en },
    'Castiglione': { en: languageCastiglione_en },
    'Default': { de: languageDefault_de, en: languageDefault_en },
    'Elephantine': { de: languageElephantine_de, en: languageElephantine_en },
    'Gadara': { de: languageGadara_de, en: languageGadara_en },
    'GoebekliTepe': { en: languageGoebekliTepe_en },
    'Heliopolis': { en: languageHeliopolis_en },
    'Kalapodi': { de: languageKalapodi_de },
    'KarthagoCircus': { en: languageKarthagoCircus_en, fr: languageKarthagoCircus_fr },
    'Kephissostal': { de: languageKephissostal_de },
    'KGR': { de: languageKGR_de },
    'Meninx': { de: languageMeninx_de, en: languageMeninx_en },
    'Milet': { de: languageMilet_de, en: languageMilet_en, fr: languageMilet_fr },
    'MonTur': { de: languageMonTur_de },
    'Olympia': { de: languageOlympia_de, en: languageOlympia_en },
    'Pergamon': { de: languagePergamon_de, en: languagePergamon_en },
    'Postumii': { de: languagePostumii_de, it: languagePostumii_it },
    'Selinunt': { de: languageSelinunt_de, en: languageSelinunt_en, it: languageSelinunt_it },
    'SelinuntBauteile' : { de: languageSelinuntBauteile_de, en: languageSelinuntBauteile_en, it: languageSelinuntBauteile_it },
    'SelinuntAkropolis' : { de: languageSelinuntAkropolis_de },
    'SudanHeritage': { en: languageSudanHeritage_en },
    'Uruk': { en: languageUruk_en }
};


export class ConfigReader {

    exists = (path: string): boolean => (path in PATH_MAP);

    read = (path: string): any => clone(PATH_MAP[path]);

    getCustomLanguageConfigurations = (projectPrefix: string) => CUSTOM_LANGUAGE_CONFIGURATIONS[projectPrefix];
}
