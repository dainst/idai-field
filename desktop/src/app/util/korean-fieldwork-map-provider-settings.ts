export interface KoreanFieldworkMapProviderSettings {
    kakaoLocalRestApiKey: string;
    kakaoMapJavaScriptKey: string;
    kakaoNativeAppKey: string;
}

export const KOREAN_FIELDWORK_MAP_PROVIDER_FIELDS = [
    'kakaoLocalRestApiKey',
    'kakaoMapJavaScriptKey',
    'kakaoNativeAppKey'
] as const;

export function getKoreanFieldworkDefaultMapProviderSettings(): KoreanFieldworkMapProviderSettings {

    return {
        kakaoLocalRestApiKey: '',
        kakaoMapJavaScriptKey: '',
        kakaoNativeAppKey: ''
    };
}

export function normalizeKoreanFieldworkMapProviderSettings(settings: any): KoreanFieldworkMapProviderSettings {

    const defaults = getKoreanFieldworkDefaultMapProviderSettings();
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return defaults;

    return {
        kakaoLocalRestApiKey: getString(settings.kakaoLocalRestApiKey),
        kakaoMapJavaScriptKey: getString(settings.kakaoMapJavaScriptKey),
        kakaoNativeAppKey: getString(settings.kakaoNativeAppKey)
    };
}

export function hasKoreanFieldworkSatelliteMapDisplayKey(settings: any): boolean {

    const normalized = normalizeKoreanFieldworkMapProviderSettings(settings);
    return !!normalized.kakaoMapJavaScriptKey.trim();
}

export function getKoreanFieldworkSatelliteMapProviderNotice(settings: any): string {

    const normalized = normalizeKoreanFieldworkMapProviderSettings(settings);

    if (normalized.kakaoMapJavaScriptKey.trim()) {
        return '카카오 지도 JavaScript 키가 저장되어 있습니다. 태블릿에서는 WebView 스카이뷰 선택창으로 조사 경계 초안을 만들 수 있고, 데스크톱에서는 SHP/DXF/CSV 경계를 가져와 같은 프로젝트로 동기화할 수 있습니다.';
    }

    if (normalized.kakaoNativeAppKey.trim()) {
        return '카카오 Native App 키가 저장되어 있습니다. 현재 태블릿 위성지도는 JavaScript 키 WebView 경로를 우선 사용합니다. 데스크톱에서는 SHP/DXF/CSV 경계를 가져와 같은 프로젝트로 동기화하세요.';
    }

    if (normalized.kakaoLocalRestApiKey.trim()) {
        return '카카오 Local REST 키는 저장되어 있습니다. 이 키는 주소 검색과 좌표 변환용이며, 위성지도 화면에는 JavaScript 키 또는 Native App 키가 필요합니다.';
    }

    return '위성지도 경계 작업에는 카카오 지도 JavaScript 키를 우선 사용합니다. Native App 키는 네이티브 지도 연동용으로 보관할 수 있고, REST 키만으로는 지도 화면을 표시할 수 없습니다.';
}

function getString(value: unknown): string {

    return typeof value === 'string' ? value : '';
}
