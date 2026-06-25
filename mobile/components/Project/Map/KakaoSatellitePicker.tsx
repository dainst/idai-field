import React, { useMemo, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { buildKakaoSatellitePickerHtml } from './kakao-satellite-picker-html';

export interface KakaoSatellitePickedLocation {
  latitude: number;
  longitude: number;
}

interface KakaoSatellitePickerProps {
  initialLocation?: KakaoSatellitePickedLocation;
  javaScriptKey: string;
  onClose: () => void;
  onPickLocation: (location: KakaoSatellitePickedLocation) => void;
  visible: boolean;
}

const DEFAULT_LOCATION = {
  latitude: 37.5665,
  longitude: 126.9780,
};

const KakaoSatellitePicker: React.FC<KakaoSatellitePickerProps> = ({
  initialLocation,
  javaScriptKey,
  onClose,
  onPickLocation,
  visible,
}) => {
  const [message, setMessage] = useState(
    '위성지도에서 조사 경계 중심점을 눌러 주세요.'
  );
  const mapHtml = useMemo(
    () => buildKakaoSatellitePickerHtml({
      javaScriptKey,
      latitude: initialLocation?.latitude ?? DEFAULT_LOCATION.latitude,
      longitude: initialLocation?.longitude ?? DEFAULT_LOCATION.longitude,
    }),
    [initialLocation, javaScriptKey]
  );

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ready') {
        setMessage('스카이뷰가 열렸습니다. 위치를 누르면 경계 초안이 만들어집니다.');
        return;
      }

      if (data.type === 'pick') {
        const { latitude, longitude } = data.payload ?? {};
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          setMessage('선택한 위치로 조사 경계 초안을 만듭니다.');
          onPickLocation({ latitude, longitude });
        }
        return;
      }

      if (data.type === 'error') {
        setMessage(data.payload?.message ?? '카카오 지도를 불러오지 못했습니다.');
      }
    } catch {
      setMessage('카카오 지도 메시지를 읽지 못했습니다.');
    }
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
      visible={visible}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>위성지도에서 경계 찍기</Text>
            <Text style={styles.message}>{message}</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onClose}
            style={styles.closeButton}
            testID="kakao-satellite-picker-close"
          >
            <Text style={styles.closeText}>닫기</Text>
          </TouchableOpacity>
        </View>
        <WebView
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          onMessage={onMessage}
          source={{ html: mapHtml, baseUrl: 'https://localhost' }}
          style={styles.webView}
          testID="kakao-satellite-picker-webview"
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#24495d',
    borderRadius: 4,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 12,
  },
  closeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  container: {
    backgroundColor: '#eef2f4',
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomColor: '#ccd6df',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerText: {
    flex: 1,
  },
  message: {
    color: '#526272',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  title: {
    color: '#20313a',
    fontSize: 17,
    fontWeight: '800',
  },
  webView: {
    flex: 1,
  },
});

export default KakaoSatellitePicker;
