// Ordered by Name
export const DEFAULT_PROJECT_LANGUAGES: ReadonlyArray<string> = ['en'];
export const KOREAN_FIELDWORK_CONFIGURATION_NAME = 'KoreanFieldwork';
export const KOREAN_FIELDWORK_GROUP_NAME = 'koreanFieldwork';
export const KOREAN_FIELDWORK_PROJECT_IDENTIFIER = 'korean-fieldwork';
export const KOREAN_FIELDWORK_PROJECT_LABEL = '현장 기록';
export const KOREAN_FIELDWORK_PROJECT_LANGUAGES: ReadonlyArray<string> = ['ko'];
export const KOREAN_FIELDWORK_TEMPLATE_ID = 'koreanFieldwork';
export const KOREAN_FIELDWORK_LAYER_SEQUENCE_MEANING_DEFAULT = 'latestToEarliest';
export const KOREAN_FIELDWORK_RECORD_CREATION_TIMING_DURING_FIELDWORK = 'duringFieldwork';
export const KOREAN_FIELDWORK_SOIL_COLOR_ASSIST_STATUS_DEFAULT = 'notRun';
export const KOREAN_FIELDWORK_SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT = 512;
export const KOREAN_FIELDWORK_SOIL_PROFILE_PHOTO_QUALITY_DEFAULT = 0.35;
export const KOREAN_FIELDWORK_FEATURE_RECORDING_STATUS_CANDIDATE = 'candidate';
export const KOREAN_FIELDWORK_FEATURE_GEOMETRY_EDIT_STATUS_ROUGH_SKETCH = 'roughSketch';
export const KOREAN_FIELDWORK_FEATURE_GEOMETRY_REVISION_HISTORY_DEFAULT = '[]';
export const KOREAN_FIELDWORK_GEOMETRY_SOURCE_GPS_APPROXIMATE = 'gpsApproximate';
export const KOREAN_FIELDWORK_GEOMETRY_SOURCE_TABLET_SKETCH = 'tabletSketch';
export const KOREAN_FIELDWORK_GEOMETRY_CONFIDENCE_ROUGH = 'rough';
export const KOREAN_FIELDWORK_SURVEY_BOUNDARY_TYPE_DEFAULT = 'operationBoundary';
export const KOREAN_FIELDWORK_SURVEY_BOUNDARY_SOURCE_DEFAULT = 'manualBasemapTrace';
export const KOREAN_FIELDWORK_SURVEY_BOUNDARY_SOURCE_CSV_IMPORT = 'csvImport';
export const KOREAN_FIELDWORK_SURVEY_BOUNDARY_SOURCE_DXF_IMPORT = 'dxfImport';
export const KOREAN_FIELDWORK_SURVEY_BOUNDARY_SOURCE_GEOJSON_IMPORT = 'geoJsonImport';
export const KOREAN_FIELDWORK_SURVEY_BOUNDARY_SOURCE_GPS_WALKOVER = 'gpsWalkover';
export const KOREAN_FIELDWORK_SURVEY_BOUNDARY_SOURCE_SHP_IMPORT = 'shpImport';
export const KOREAN_FIELDWORK_SURVEY_BOUNDARY_ACCURACY_DEFAULT = 'visualReference';
export const KOREAN_FIELDWORK_SURVEY_BOUNDARY_ACCURACY_APPROXIMATE_GPS = 'approximateGps';
export const KOREAN_FIELDWORK_SURVEY_BOUNDARY_ACCURACY_IMPORTED_REFERENCE = 'importedReference';
export const KOREAN_FIELDWORK_REFERENCE_BASEMAP_PROVIDER_DEFAULT = 'none';
export const KOREAN_FIELDWORK_REFERENCE_BASEMAP_PROVIDER_GOOGLE_HYBRID = 'googleHybrid';
export const KOREAN_FIELDWORK_REFERENCE_BASEMAP_PROVIDER_GOOGLE_SATELLITE = 'googleSatellite';
export const KOREAN_FIELDWORK_REFERENCE_BASEMAP_PROVIDER_KAKAO_HYBRID = 'kakaoHybrid';
export const KOREAN_FIELDWORK_REFERENCE_BASEMAP_PROVIDER_IMPORTED_RASTER_LAYER = 'importedRasterLayer';
export const KOREAN_FIELDWORK_REFERENCE_BASEMAP_PROVIDER_IMPORTED_VECTOR_LAYER = 'importedVectorLayer';
export const KOREAN_FIELDWORK_GPS_DRAFT_BOUNDARY_HALF_SIZE_METERS = 20;

export const PROJECT_MAPPING = {
    'abbircella': { prefix: 'AbbirCella', label: 'AbbirCella' },
    'al-ula': { prefix: 'AlUla', label: 'Al Ula' },
    'ayamonte': { prefix: 'Ayamonte', label: 'Ayamonte' },
    'bogazkoy-hattusa': { prefix: 'Boha', label: 'Boğazköy-Ḫattuša' },
    'bourgou': { prefix: 'Bourgou', label: 'Henchir el Bourgu' },
    'campidoglio': { prefix: 'Campidoglio', label: 'Campidoglio' },
    'castiglione': { prefix: 'Castiglione', label: 'Castiglione' },
    'chimtou': { prefix: 'Bourgou', label: 'Chimtou' },
    'elephantine': { prefix: 'Elephantine', label: 'Elephantine' },
    'gadara_bm': { prefix: 'Gadara', label: 'Gadara' },
    'goebekli_tepe': { prefix: 'GoebekliTepe', label: 'Göbekli Tepe' },
    'heliopolis-project': { prefix: 'Heliopolis', label: 'Heliopolis' },
    'kalapodi': { prefix: 'Kalapodi', label: 'Kalapodi' },
    'karthagocircus': { prefix: 'KarthagoCircus', label: 'Karthago Circus' },
    'kephissostal': { prefix: 'Kephissostal', label: 'Kephissostal' },
    'kgr': { prefix: 'KGR', label: 'KGR' },
    [KOREAN_FIELDWORK_PROJECT_IDENTIFIER]: {
        prefix: KOREAN_FIELDWORK_CONFIGURATION_NAME,
        label: KOREAN_FIELDWORK_PROJECT_LABEL
    },
    'meninx-project': { prefix: 'Meninx', label: 'Meninx' },
    'milet': { prefix: 'Milet', label: 'Milet' },
    'monte-turcisi': { prefix: 'MonTur', label: 'Monte Turcisi' },
    'olympia': { prefix: 'Olympia', label: 'Olympia' },
    'pergamongrabung': { prefix: 'Pergamon', label: 'Pergamon' },
    'postumii': { prefix: 'Postumii', label: 'Postumii' },
    'selinunt': { prefix: 'Selinunt', label: 'Selinunt' },
    'seli-bauteile': { prefix: 'SelinuntBauteile', label: 'Selinunt Bauteile' },
    'sel-akropolis': { prefix: 'SelinuntAkropolis', label: 'Selinunt Akropolis' },
    'sudan-heritage': { prefix: 'SudanHeritage', label: 'Sudan Heritage' },
    'uruk': { prefix: 'Uruk', label: 'Uruk' }
};


export function getConfigurationName(projectIdentifier: string, customConfigurationName?: string): string {

    if (customConfigurationName) return customConfigurationName;

    for (let [identifier, project] of Object.entries(PROJECT_MAPPING)) {
        if (projectIdentifier === identifier) return project.prefix;
        if (identifier !== KOREAN_FIELDWORK_PROJECT_IDENTIFIER
                && projectIdentifier.startsWith(identifier + '-')) return project.prefix;
    }

    return 'Default';
}


export function isKoreanFieldworkProject(projectIdentifier: string): boolean {

    return getConfigurationName(projectIdentifier) === KOREAN_FIELDWORK_CONFIGURATION_NAME;
}


export function getDefaultProjectLanguages(projectIdentifier: string): string[] {

    return (isKoreanFieldworkProject(projectIdentifier)
        ? KOREAN_FIELDWORK_PROJECT_LANGUAGES
        : DEFAULT_PROJECT_LANGUAGES
    ).slice();
}
