import { Ionicons } from '@expo/vector-icons';
import {
  Camera,
  CameraView,
} from 'expo-camera';
import React, { useRef, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Button from '@/components/common/Button';
import {
  SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
  SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT,
} from './Map/korean-fieldwork-drafts';

export interface SoilProfileCaptureData {
  soilProfilePhotoUri: string;
  soilProfilePhotoSizeHintKb: number;
  soilProfilePhotoQuality: number;
  soilProfilePhotoCapturedAt: string;
}

interface SoilProfileCameraButtonProps {
  onCapture: (data: SoilProfileCaptureData) => void;
}

const SoilProfileCameraButton: React.FC<SoilProfileCameraButtonProps> = ({ onCapture }) => {
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const openCamera = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      setPermissionDenied(true);
      return;
    }

    setPermissionDenied(false);
    setCameraActive(true);
  };

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const picture = await cameraRef.current.takePictureAsync({
        quality: SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
        base64: false,
        exif: false,
        skipProcessing: false,
      });

      if (!picture) return;

      onCapture({
        soilProfilePhotoUri: picture.uri,
        soilProfilePhotoSizeHintKb: SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT,
        soilProfilePhotoQuality: SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
        soilProfilePhotoCapturedAt: new Date().toISOString(),
      });
      setCameraActive(false);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        variant="primary"
        title="토층사진 촬영"
        icon={<Ionicons name="camera-outline" size={18} />}
        onPress={() => { void openCamera(); }}
        testID="soilProfileCameraButton"
      />
      {permissionDenied && (
        <Text style={styles.warning}>카메라 권한이 필요합니다.</Text>
      )}
      <Modal
        visible={cameraActive}
        onRequestClose={() => setCameraActive(false)}
        animationType="slide"
      >
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing="back"
            mode="picture"
          />
          <View style={styles.cameraActions}>
            <Button
              variant="transparent"
              icon={<Ionicons name="close" size={25} />}
              onPress={() => setCameraActive(false)}
              testID="soilProfileCameraCloseButton"
            />
            <Button
              variant="primary"
              title={isCapturing ? '저장 중' : '촬영'}
              icon={<Ionicons name="radio-button-on" size={18} />}
              isDisabled={isCapturing}
              onPress={() => { void takePicture(); }}
              testID="soilProfileCameraCaptureButton"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  warning: {
    color: '#b00020',
    fontSize: 13,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraActions: {
    bottom: 30,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },
});

export default SoilProfileCameraButton;
