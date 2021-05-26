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
import configGadara from '../../../config/Config-Gadara.json';
import configKalapodi from '../../../config/Config-Kalapodi.json';
import configKarthagoCircus from '../../../config/Config-KarthagoCircus.json';
import configKephissostal from '../../../config/Config-Kephissostal.json';
import configMeninx from '../../../config/Config-Meninx.json';
import configMilet from '../../../config/Config-Milet.json';
import configMonTur from '../../../config/Config-MonTur.json';
import configOlympia from '../../../config/Config-Olympia.json';
import configPergamon from '../../../config/Config-Pergamon.json';
import configPostumii from '../../../config/Config-Postumii.json';
import configSelinunt from '../../../config/Config-Selinunt.json';
import configSudanHeritage from '../../../config/Config-SudanHeritage.json';
import configUruk from '../../../config/Config-Uruk.json';
import coreLanguageDe from '../../../config/Core/Language.de.json';
import coreLanguageEn from '../../../config/Core/Language.en.json';
import coreLanguageEs from '../../../config/Core/Language.es.json';
import coreLanguageIt from '../../../config/Core/Language.it.json';
import languageAbbirCella_en from '../../../config/Language-AbbirCella.en.json';
import languageAbbirCella_fr from '../../../config/Language-AbbirCella.fr.json';
import languageAlUla_en from '../../../config/Language-AlUla.en.json';
import languageAyamonte_de from '../../../config/Language-Ayamonte.de.json';
import languageAyamonte_en from '../../../config/Language-Ayamonte.en.json';
import languageAyamonte_es from '../../../config/Language-Ayamonte.es.json';
import languageBoha_de from '../../../config/Language-Boha.de.json';
import languageBourgou_de from '../../../config/Language-Bourgou.de.json';
import languageBourgou_en from '../../../config/Language-Bourgou.en.json';
import languageCampidoglio_en from '../../../config/Language-Campidoglio.en.json';
import languageCastiglione_en from '../../../config/Language-Castiglione.en.json';
import languageDefault_de from '../../../config/Language-Default.de.json';
import languageDefault_en from '../../../config/Language-Default.en.json';
import languageGadara_de from '../../../config/Language-Gadara.de.json';
import languageGadara_en from '../../../config/Language-Gadara.en.json';
import languageKalapodi_de from '../../../config/Language-Kalapodi.de.json';
import languageKephissostal_de from '../../../config/Language-Kephissostal.de.json';
import languageMeninx_de from '../../../config/Language-Meninx.de.json';
import languageMeninx_en from '../../../config/Language-Meninx.en.json';
import languageMilet_de from '../../../config/Language-Milet.de.json';
import languageMilet_en from '../../../config/Language-Milet.en.json';
import languageMonTur_de from '../../../config/Language-MonTur.de.json';
import languagePergamon_de from '../../../config/Language-Pergamon.de.json';
import languagePergamon_en from '../../../config/Language-Pergamon.en.json';
import languagePostumii_de from '../../../config/Language-Postumii.de.json';
import languagePostumii_it from '../../../config/Language-Postumii.it.json';
import languageSelinunt_de from '../../../config/Language-Selinunt.de.json';
import languageSelinunt_it from '../../../config/Language-Selinunt.it.json';
import languageSudanHeritage_en from '../../../config/Language-SudanHeritage.en.json';
import languageUruk_en from '../../../config/Language-Uruk.en.json';
import libraryCategories from '../../../config/Library/Categories.json';
import libraryLanguageDe from '../../../config/Library/Language.de.json';
import libraryLanguageEn from '../../../config/Library/Language.en.json';
import libraryLanguageEs from '../../../config/Library/Language.es.json';
import libraryLanguageIt from '../../../config/Library/Language.it.json';
import libraryValuelists from '../../../config/Library/Valuelists.json';
import order from '../../../config/Order.json';
import search from '../../../config/Search.json';


const PATH_MAP: Record<string, any> = {
    '/Core/Language.de.json': coreLanguageDe,
    '/Core/Language.en.json': coreLanguageEn,
    '/Core/Language.es.json': coreLanguageEs,
    '/Core/Language.it.json': coreLanguageIt,
    '/Library/Categories.json': libraryCategories,
    '/Library/Language.de.json': libraryLanguageDe,
    '/Library/Language.en.json': libraryLanguageEn,
    '/Library/Language.es.json': libraryLanguageEs,
    '/Library/Language.it.json': libraryLanguageIt,
    '/Library/Valuelists.json': libraryValuelists,
    '/Config-Default.json': configDefault,
    '/Order.json': order,
    '/Search.json': search,
    '/Config-AbbirCella.json': configAbbirCella,
    '/Config-AlUla.json': configAlUla,
    '/Config-Ayamonte.json': configAyamonte,
    '/Config-Boha.json': configBoha,
    '/Config-Bourgou.json': configBourgou,
    '/Config-Campidoglio.json': configCampidoglio,
    '/Config-Castiglione.json': configCastiglione,
    '/Config-Gadara.json': configGadara,
    '/Config-Kalapodi.json': configKalapodi,
    '/Config-KarthagoCircus.json': configKarthagoCircus,
    '/Config-Kephissostal.json': configKephissostal,
    '/Config-Meninx.json': configMeninx,
    '/Config-Milet.json': configMilet,
    '/Config-MonTur.json': configMonTur,
    '/Config-Olympia.json': configOlympia,
    '/Config-Pergamon.json': configPergamon,
    '/Config-Postumii.json': configPostumii,
    '/Config-Selinunt.json': configSelinunt,
    '/Config-SudanHeritage.json': configSudanHeritage,
    '/Config-Uruk.json': configUruk,
    '/Language-AbbirCella.en.json': languageAbbirCella_en,
    '/Language-AbbirCella.fr.json': languageAbbirCella_fr,
    '/Language-AlUla.en.json': languageAlUla_en,
    '/Language-Ayamonte.de.json': languageAyamonte_de,
    '/Language-Ayamonte.en.json': languageAyamonte_en,
    '/Language-Ayamonte.es.json': languageAyamonte_es,
    '/Language-Boha.de.json': languageBoha_de,
    '/Language-Bourgou.de.json': languageBourgou_de,
    '/Language-Bourgou.en.json': languageBourgou_en,
    '/Language-Campidoglio.en.json': languageCampidoglio_en,
    '/Language-Castiglione.en.json': languageCastiglione_en,
    '/Language-Default.de.json': languageDefault_de,
    '/Language-Default.en.json': languageDefault_en,
    '/Language-Gadara.de.json': languageGadara_de,
    '/Language-Gadara.en.json': languageGadara_en,
    '/Language-Kalapodi.de.json': languageKalapodi_de,
    '/Language-Kephissostal.de.json': languageKephissostal_de,
    '/Language-Meninx.de.json': languageMeninx_de,
    '/Language-Meninx.en.json': languageMeninx_en,
    '/Language-Milet.de.json': languageMilet_de,
    '/Language-Milet.en.json': languageMilet_en,
    '/Language-MonTur.de.json': languageMonTur_de,
    '/Language-Pergamon.de.json': languagePergamon_de,
    '/Language-Pergamon.en.json': languagePergamon_en,
    '/Language-Postumii.de.json': languagePostumii_de,
    '/Language-Postumii.it.json': languagePostumii_it,
    '/Language-Selinunt.de.json': languageSelinunt_de,
    '/Language-Selinunt.it.json': languageSelinunt_it,
    '/Language-SudanHeritage.en.json': languageSudanHeritage_en,
    '/Language-Uruk.en.json': languageUruk_en,
};


export class ConfigReader {

    exists = (path: string): boolean => (path in PATH_MAP);

    read = (path: string): any => clone(PATH_MAP[path]);

    getCustomLanguageConfigurationFileNames = (_: string) => [];
}
