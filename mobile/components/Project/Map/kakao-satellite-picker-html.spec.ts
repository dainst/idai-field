import { buildKakaoSatellitePickerHtml } from './kakao-satellite-picker-html';

describe('buildKakaoSatellitePickerHtml', () => {
  it('loads the Kakao map script with the JavaScript key and hybrid map type', () => {
    const html = buildKakaoSatellitePickerHtml({
      javaScriptKey: 'js key/with spaces',
      latitude: 36.12,
      longitude: 127.45,
    });

    expect(html).toContain('dapi.kakao.com/v2/maps/sdk.js');
    expect(html).toContain('appkey=js%20key%2Fwith%20spaces');
    expect(html).toContain('kakao.maps.MapTypeId.HYBRID');
    expect(html).toContain('new kakao.maps.LatLng(36.12, 127.45)');
  });

  it('posts picked WGS84 coordinates back to React Native', () => {
    const html = buildKakaoSatellitePickerHtml({
      javaScriptKey: 'js-key',
      latitude: Number.NaN,
      longitude: Number.NaN,
    });

    expect(html).toContain('window.ReactNativeWebView.postMessage');
    expect(html).toContain("post('pick'");
    expect(html).toContain('latitude: latLng.getLat()');
    expect(html).toContain('longitude: latLng.getLng()');
    expect(html).toContain('new kakao.maps.LatLng(37.5665, 126.978)');
  });
});
