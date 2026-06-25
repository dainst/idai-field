interface KakaoSatellitePickerHtmlOptions {
  javaScriptKey: string;
  latitude: number;
  longitude: number;
}

export const buildKakaoSatellitePickerHtml = ({
  javaScriptKey,
  latitude,
  longitude,
}: KakaoSatellitePickerHtmlOptions): string => {
  const safeKey = encodeURIComponent(javaScriptKey.trim());
  const safeLatitude = Number.isFinite(latitude) ? latitude : 37.5665;
  const safeLongitude = Number.isFinite(longitude) ? longitude : 126.9780;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no, width=device-width" />
  <style>
    html, body, #map {
      height: 100%;
      margin: 0;
      padding: 0;
      width: 100%;
    }
    .banner {
      background: rgba(21, 31, 38, 0.88);
      border-radius: 4px;
      color: white;
      font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      left: 12px;
      max-width: calc(100% - 24px);
      padding: 8px 10px;
      position: absolute;
      right: 12px;
      top: 12px;
      z-index: 10;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="banner">위성지도를 눌러 조사 경계 초안을 만들 위치를 선택하세요.</div>
  <script>
    function post(type, payload) {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
        type: type,
        payload: payload || {}
      }));
    }

    function loadScript() {
      var script = document.createElement('script');
      script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=${safeKey}&autoload=false';
      script.onload = function() {
        kakao.maps.load(initMap);
      };
      script.onerror = function() {
        post('error', { message: '카카오 지도 스크립트를 불러오지 못했습니다.' });
      };
      document.head.appendChild(script);
    }

    function initMap() {
      try {
        var center = new kakao.maps.LatLng(${safeLatitude}, ${safeLongitude});
        var map = new kakao.maps.Map(document.getElementById('map'), {
          center: center,
          level: 3
        });
        map.setMapTypeId(kakao.maps.MapTypeId.HYBRID);

        var marker = new kakao.maps.Marker({
          map: map,
          position: center
        });

        kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
          var latLng = mouseEvent.latLng;
          marker.setPosition(latLng);
          post('pick', {
            latitude: latLng.getLat(),
            longitude: latLng.getLng()
          });
        });

        post('ready');
      } catch (error) {
        post('error', { message: error && error.message ? error.message : String(error) });
      }
    }

    loadScript();
  </script>
</body>
</html>`;
};
