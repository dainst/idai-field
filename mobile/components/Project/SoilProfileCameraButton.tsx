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

export interface FieldworkPhotoCaptureData {
  imageUri: string;
  originalFilename: string;
  fieldworkPhotoUri: string;
  fieldworkPhotoSizeHintKb: number;
  fieldworkPhotoQuality: number;
  fieldworkPhotoCapturedAt: string;
}

export interface SoilProfileCaptureData {
  soilProfilePhotoUri: string;
  soilProfilePhotoSizeHintKb: number;
  soilProfilePhotoQuality: number;
  soilProfilePhotoCapturedAt: string;
}

interface FieldworkCameraButtonProps<TCaptureData> {
  buttonTitle: string;
  captureButtonTestID: string;
  closeButtonTestID: string;
  openButtonTestID: string;
  capturedUri?: string;
  onCapture: (data: TCaptureData) => void;
  createCaptureData: (uri: string, capturedAt: Date) => TCaptureData;
}

interface SoilProfileCameraButtonProps {
  onCapture: (data: SoilProfileCaptureData) => void;
  capturedUri?: string;
}

interface PhotoCameraButtonProps {
  onCapture: (data: FieldworkPhotoCaptureData) => void;
  capturedUri?: string;
}

export const createFieldworkPhotoCaptureData = (
  uri: string,
  capturedAt: Date = new Date()
): FieldworkPhotoCaptureData => ({
  imageUri: uri,
  originalFilename: getFilenameFromUri(uri),
  fieldworkPhotoUri: uri,
  fieldworkPhotoSizeHintKb: SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT,
  fieldworkPhotoQuality: SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
  fieldworkPhotoCapturedAt: capturedAt.toISOString(),
});

export const createSoilProfileCaptureData = (
  uri: string,
  capturedAt: Date = new Date()
): SoilProfileCaptureData => ({
  soilProfilePhotoUri: uri,
  soilProfilePhotoSizeHintKb: SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT,
  soilProfilePhotoQuality: SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
  soilProfilePhotoCapturedAt: capturedAt.toISOString(),
});

export const PhotoCameraButton: React.FC<PhotoCameraButtonProps> = ({
  onCapture,
  capturedUri,
}) => (
  <FieldworkCameraButton
    buttonTitle="현장사진 촬영"
    captureButtonTestID="fieldworkPhotoCameraCaptureButton"
    closeButtonTestID="fieldworkPhotoCameraCloseButton"
    openButtonTestID="fieldworkPhotoCameraButton"
    capturedUri={capturedUri}
    onCapture={onCapture}
    createCaptureData={createFieldworkPhotoCaptureData}
  />
);

const SoilProfileCameraButton: React.FC<SoilProfileCameraButtonProps> = ({
  onCapture,
  capturedUri,
}) => (
  <FieldworkCameraButton
    buttonTitle="토층사진 촬영"
    captureButtonTestID="soilProfileCameraCaptureButton"
    closeButtonTestID="soilProfileCameraCloseButton"
    openButtonTestID="soilProfileCameraButton"
    capturedUri={capturedUri}
    onCapture={onCapture}
    createCaptureData={createSoilProfileCaptureData}
  />
);

const FieldworkCameraButton = <TCaptureData,>({
  buttonTitle,
  captureButtonTestID,
  closeButtonTestID,
  openButtonTestID,
  capturedUri,
  onCapture,
  createCaptureData,
}: FieldworkCameraButtonProps<TCaptureData>) => {
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

      onCapture(createCaptureData(picture.uri, new Date()));
      setCameraActive(false);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        variant="primary"
        title={buttonTitle}
        icon={<Ionicons name="camera-outline" size={18} />}
        onPress={() => { void openCamera(); }}
        testID={openButtonTestID}
      />
      {!!capturedUri && (
        <View style={styles.capturedNotice}>
          <Ionicons name="image-outline" size={16} color="#027a48" />
          <Text style={styles.capturedText} numberOfLines={1}>
            촬영됨 · {getFilenameFromUri(capturedUri)}
          </Text>
        </View>
      )}
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
              testID={closeButtonTestID}
            />
            <Button
              variant="primary"
              title={isCapturing ? '저장 중' : '촬영'}
              icon={<Ionicons name="radio-button-on" size={18} />}
              isDisabled={isCapturing}
              onPress={() => { void takePicture(); }}
              testID={captureButtonTestID}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getFilenameFromUri = (uri: string): string => {
  const [path] = uri.split('?');
  const filename = path.split('/').filter(Boolean).pop();

  return filename && filename.trim().length > 0
    ? decodeURIComponent(filename)
    : `fieldwork-photo-${Date.now()}.jpg`;
};

const styles = StyleSheet.create({
  container: {
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  capturedNotice: {
    alignItems: 'center',
    backgroundColor: '#ecfdf3',
    borderColor: '#abefc6',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 34,
    paddingHorizontal: 9,
  },
  capturedText: {
    color: '#027a48',
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
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
