import {
  getKakaoSatelliteBasemapStatusMessage,
  KAKAO_SATELLITE_BASEMAP_TITLE,
} from './korean-fieldwork-map-provider-status';

describe('korean-fieldwork-map-provider-status', () => {
  it('names the satellite basemap alert', () => {
    expect(KAKAO_SATELLITE_BASEMAP_TITLE).toBe('위성지도 연결');
  });

  it('explains that a Kakao REST key is for local APIs, not map display', () => {
    expect(getKakaoSatelliteBasemapStatusMessage({
      kakaoLocalRestApiKey: 'rest-key',
    })).toContain('REST 키');
    expect(getKakaoSatelliteBasemapStatusMessage({
      kakaoLocalRestApiKey: 'rest-key',
    })).toContain('주소 검색과 좌표 변환용');
    expect(getKakaoSatelliteBasemapStatusMessage({
      kakaoLocalRestApiKey: 'rest-key',
    })).toContain('JavaScript 키 또는 Android Native App 키');
  });

  it('recognizes a stored Kakao JavaScript map key', () => {
    expect(getKakaoSatelliteBasemapStatusMessage({
      kakaoMapJavaScriptKey: 'js-key',
    })).toContain('HYBRID(스카이뷰)');
    expect(getKakaoSatelliteBasemapStatusMessage({
      kakaoMapJavaScriptKey: 'js-key',
    })).toContain('https://localhost');
  });

  it('recognizes a stored Kakao native app key', () => {
    expect(getKakaoSatelliteBasemapStatusMessage({
      kakaoNativeAppKey: 'native-key',
    })).toContain('JavaScript 키 WebView 경로를 우선 사용');
    expect(getKakaoSatelliteBasemapStatusMessage({
      kakaoNativeAppKey: 'native-key',
    })).toContain('데스크톱에서 가져온 뒤 동기화');
  });
});
