import { Ionicons } from '@expo/vector-icons';
import {
  Camera,
  CameraView,
} from 'expo-camera';
import * as FileSystem from 'expo-file-system';
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
import { createSoilColorAssistUpdatesFromPhotoBase64 } from './soil-color-photo-assist';

export interface FieldworkPhotoCaptureData {
  imageUri: string;
  originalFilename: string;
  width: number;
  height: number;
  fieldworkPhotoUri: string;
  fieldworkPhotoSizeHintKb: number;
  fieldworkPhotoQuality: number;
  fieldworkPhotoCapturedAt: string;
  imageRights?: Record<string, string>;
  draughtsmen?: string[];
}

export interface SoilProfileCaptureData {
  soilProfilePhotoUri: string;
  originalFilename: string;
  width: number;
  height: number;
  soilProfilePhotoSizeHintKb: number;
  soilProfilePhotoQuality: number;
  soilProfilePhotoCapturedAt: string;
  soilColorAssistCandidates?: string;
  soilColorAssistStatus?: string;
  imageRights?: Record<string, string>;
  draughtsmen?: string[];
}

interface FieldworkCaptureMetadataOptions {
  username?: string;
}

interface FieldworkCaptureImageDimensions {
  width?: number;
  height?: number;
}

interface FieldworkCameraButtonProps<TCaptureData> {
  buttonTitle: string;
  captureButtonTestID: string;
  closeButtonTestID: string;
  includeBase64?: boolean;
  openButtonTestID: string;
  capturedUri?: string;
  onCapture: (data: TCaptureData) => void;
  createCaptureData: (
    uri: string,
    capturedAt: Date,
    base64?: string,
    metadataOptions?: FieldworkCaptureMetadataOptions,
    dimensions?: FieldworkCaptureImageDimensions
  ) => TCaptureData;
  username?: string;
}

interface SoilProfileCameraButtonProps {
  onCapture: (data: SoilProfileCaptureData) => void;
  capturedUri?: string;
  username?: string;
}

interface PhotoCameraButtonProps {
  onCapture: (data: FieldworkPhotoCaptureData) => void;
  capturedUri?: string;
  username?: string;
}

export const createFieldworkPhotoCaptureData = (
  uri: string,
  capturedAt: Date = new Date(),
  _base64?: string,
  metadataOptions: FieldworkCaptureMetadataOptions = {},
  dimensions: FieldworkCaptureImageDimensions = {}
): FieldworkPhotoCaptureData => ({
  imageUri: uri,
  originalFilename: getFilenameFromUri(uri),
  width: getImageDimension(dimensions.width),
  height: getImageDimension(dimensions.height),
  fieldworkPhotoUri: uri,
  fieldworkPhotoSizeHintKb: SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT,
  fieldworkPhotoQuality: SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
  fieldworkPhotoCapturedAt: capturedAt.toISOString(),
  ...createImageAuthorshipMetadata(metadataOptions.username),
});

export const createSoilProfileCaptureData = (
  uri: string,
  capturedAt: Date = new Date(),
  base64?: string,
  metadataOptions: FieldworkCaptureMetadataOptions = {},
  dimensions: FieldworkCaptureImageDimensions = {}
): SoilProfileCaptureData => ({
  soilProfilePhotoUri: uri,
  originalFilename: getFilenameFromUri(uri),
  width: getImageDimension(dimensions.width),
  height: getImageDimension(dimensions.height),
  soilProfilePhotoSizeHintKb: SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT,
  soilProfilePhotoQuality: SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
  soilProfilePhotoCapturedAt: capturedAt.toISOString(),
  ...createSoilColorAssistUpdatesFromPhotoBase64(base64),
  ...createImageAuthorshipMetadata(metadataOptions.username),
});

export const PhotoCameraButton: React.FC<PhotoCameraButtonProps> = ({
  onCapture,
  capturedUri,
  username,
}) => (
  <FieldworkCameraButton
    buttonTitle="현장사진 촬영"
    captureButtonTestID="fieldworkPhotoCameraCaptureButton"
    closeButtonTestID="fieldworkPhotoCameraCloseButton"
    openButtonTestID="fieldworkPhotoCameraButton"
    capturedUri={capturedUri}
    onCapture={onCapture}
    createCaptureData={createFieldworkPhotoCaptureData}
    username={username}
  />
);

const SoilProfileCameraButton: React.FC<SoilProfileCameraButtonProps> = ({
  onCapture,
  capturedUri,
  username,
}) => (
  <FieldworkCameraButton
    buttonTitle="토층사진 촬영"
    captureButtonTestID="soilProfileCameraCaptureButton"
    closeButtonTestID="soilProfileCameraCloseButton"
    openButtonTestID="soilProfileCameraButton"
    capturedUri={capturedUri}
    includeBase64={true}
    onCapture={onCapture}
    createCaptureData={createSoilProfileCaptureData}
    username={username}
  />
);

const FIELDWORK_CAPTURE_DIRECTORY_NAME = 'fieldwork-captures';

const FieldworkCameraButton = <TCaptureData,>({
  buttonTitle,
  captureButtonTestID,
  closeButtonTestID,
  openButtonTestID,
  capturedUri,
  includeBase64 = false,
  onCapture,
  createCaptureData,
  username,
}: FieldworkCameraButtonProps<TCaptureData>) => {
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [captureError, setCaptureError] = useState(false);
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
      setCaptureError(false);
      const picture = await cameraRef.current.takePictureAsync({
        quality: SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
        base64: includeBase64,
        exif: false,
        skipProcessing: false,
      });

      if (!picture) return;

      const capturedAt = new Date();
      const persistedUri = await persistFieldworkCaptureFile(picture.uri, capturedAt);

      onCapture(createCaptureData(
        persistedUri,
        capturedAt,
        picture.base64,
        { username },
        {
          width: picture.width,
          height: picture.height,
        }
      ));
      setCameraActive(false);
    } catch {
      setCaptureError(true);
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
      {captureError && (
        <Text style={styles.warning}>사진을 저장하지 못했습니다. 다시 촬영하세요.</Text>
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

export const persistFieldworkCaptureFile = async (
  uri: string,
  capturedAt: Date = new Date()
): Promise<string> => {
  if (!FileSystem.documentDirectory) {
    throw new Error('Document directory is not available.');
  }

  const targetDirectory = `${FileSystem.documentDirectory.replace(/\/+$/, '')}/${FIELDWORK_CAPTURE_DIRECTORY_NAME}`;
  await FileSystem.makeDirectoryAsync(targetDirectory, { intermediates: true });

  const targetUri = `${targetDirectory}/${getPersistentCaptureFilename(uri, capturedAt)}`;
  await FileSystem.copyAsync({
    from: uri,
    to: targetUri,
  });

  return targetUri;
};

const getFilenameFromUri = (uri: string): string => {
  const [path] = uri.split('?');
  const filename = path.split('/').filter(Boolean).pop();

  return filename && filename.trim().length > 0
    ? decodeURIComponent(filename)
    : `fieldwork-photo-${Date.now()}.jpg`;
};

const getPersistentCaptureFilename = (uri: string, capturedAt: Date): string => {
  const filename = getFilenameFromUri(uri);
  const extension = getImageFileExtension(filename);
  const basename = getSafeFilenameBase(filename);
  const timestamp = capturedAt.toISOString().replace(/[:.]/g, '-');

  return `fieldwork-photo-${timestamp}-${basename}.${extension}`;
};

const getImageFileExtension = (filename: string): string => {
  const extension = filename.split('.').pop();

  return extension && /^[a-z0-9]+$/i.test(extension)
    ? extension.toLowerCase()
    : 'jpg';
};

const getSafeFilenameBase = (filename: string): string => {
  const basename = filename.replace(/\.[^.]*$/, '')
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  return basename || 'capture';
};

const getImageDimension = (dimension: number | undefined): number => (
  typeof dimension === 'number' && Number.isFinite(dimension) && dimension > 0
    ? Math.round(dimension)
    : 1
);

const createImageAuthorshipMetadata = (
  username: string | undefined
): Pick<FieldworkPhotoCaptureData, 'imageRights' | 'draughtsmen'> => {
  const normalizedUsername = username?.trim();

  if (!normalizedUsername || normalizedUsername === 'anonymous') return {};

  return {
    draughtsmen: [normalizedUsername],
    imageRights: {
      de: normalizedUsername,
      en: normalizedUsername,
      ko: normalizedUsername,
    },
  };
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
