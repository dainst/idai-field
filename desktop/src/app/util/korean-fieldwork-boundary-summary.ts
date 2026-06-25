import { Document } from 'idai-field-core';


const SURVEY_BOUNDARY_CATEGORY = 'SurveyBoundary';

const BOUNDARY_SOURCE_LABELS: Readonly<Record<string, string>> = {
    csvImport: 'CSV 가져오기',
    dxfImport: 'DXF 가져오기',
    finalCad: '최종 CAD',
    geoJsonImport: 'GeoJSON 가져오기',
    gpsWalkover: 'GPS 임시',
    manualBasemapTrace: '배경지도 추적',
    officialSurvey: '정식 측량',
    shpImport: 'SHP 가져오기'
};

const BOUNDARY_ACCURACY_LABELS: Readonly<Record<string, string>> = {
    approximateGps: 'GPS 대략',
    final: '최종',
    importedReference: '가져온 참고자료',
    surveyed: '측량 반영'
};

const BOUNDARY_BASEMAP_PROVIDER_LABELS: Readonly<Record<string, string>> = {
    customWmts: 'WMTS/TMS',
    googleHybrid: 'Google 하이브리드',
    googleSatellite: 'Google 위성',
    importedRasterLayer: '가져온 래스터',
    importedVectorLayer: '가져온 벡터',
    kakaoHybrid: '카카오 위성지도',
    openStreetMap: 'OpenStreetMap'
};

const KAKAO_SATELLITE_BOUNDARY_METHOD_LABEL = '카카오 위성지도 기준';


export function getKoreanFieldworkBoundarySummaryLabel(documents: Document[],
                                                       boundarySummary?: string): string {

    const surveyBoundaryDocuments = getKoreanFieldworkSurveyBoundaryDocuments(documents);
    const normalizedBoundarySummary = normalizeText(boundarySummary);

    if (surveyBoundaryDocuments.length === 0) return normalizedBoundarySummary || '경계 없음';

    const primaryBoundary = surveyBoundaryDocuments[0];
    const baseLabel = normalizedBoundarySummary
        || getBoundaryDocumentLabel(primaryBoundary)
        || `경계 ${surveyBoundaryDocuments.length}건`;
    const methodLabel = getKoreanFieldworkBoundaryMethodLabel(primaryBoundary);
    const countLabel = surveyBoundaryDocuments.length > 1
        ? `경계 ${surveyBoundaryDocuments.length}건`
        : undefined;

    return [baseLabel, methodLabel, countLabel]
        .filter((label): label is string => !!label && label.length > 0)
        .join(' · ');
}


export function getKoreanFieldworkSurveyBoundaryDocuments(documents: Document[]): Document[] {

    return documents.filter(document => document.resource.category === SURVEY_BOUNDARY_CATEGORY);
}


export function getKoreanFieldworkBoundaryMethodLabel(document: Document): string|undefined {

    const source = normalizeText(document.resource.surveyBoundarySource);
    const accuracy = normalizeText(document.resource.surveyBoundaryAccuracy);
    const provider = normalizeText(document.resource.referenceBasemapProvider);
    const providerLabel = provider ? BOUNDARY_BASEMAP_PROVIDER_LABELS[provider] : undefined;

    if (source === 'manualBasemapTrace' && provider === 'kakaoHybrid') {
        return KAKAO_SATELLITE_BOUNDARY_METHOD_LABEL;
    }
    if (source === 'manualBasemapTrace' && providerLabel) return `${providerLabel} 기준`;

    const sourceLabel = source ? BOUNDARY_SOURCE_LABELS[source] : undefined;
    const accuracyLabel = accuracy ? BOUNDARY_ACCURACY_LABELS[accuracy] : undefined;

    return [sourceLabel, accuracyLabel]
        .filter((label): label is string => !!label && label.length > 0)
        .join(' · ') || providerLabel;
}


function getBoundaryDocumentLabel(document: Document): string|undefined {

    return normalizeText(document.resource.shortDescription)
        || normalizeText(document.resource.surveyBoundaryNote)
        || normalizeText(document.resource.identifier);
}


function normalizeText(value: unknown): string|undefined {

    const text = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
    return text.length > 0 ? text : undefined;
}
