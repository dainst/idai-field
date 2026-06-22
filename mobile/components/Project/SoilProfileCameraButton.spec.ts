import {
  createFieldworkPhotoCaptureData,
  createSoilProfileCaptureData,
} from './SoilProfileCameraButton';
import {
  SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
  SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT,
} from './Map/korean-fieldwork-drafts';

describe('fieldwork camera capture data', () => {
  it('maps regular photo captures to reusable image fields', () => {
    const capturedAt = new Date('2026-06-23T01:02:03.000Z');

    expect(createFieldworkPhotoCaptureData(
      'file:///storage/emulated/0/DCIM/field%20photo.jpg?cache=1',
      capturedAt
    )).toEqual({
      imageUri: 'file:///storage/emulated/0/DCIM/field%20photo.jpg?cache=1',
      originalFilename: 'field photo.jpg',
      fieldworkPhotoUri: 'file:///storage/emulated/0/DCIM/field%20photo.jpg?cache=1',
      fieldworkPhotoSizeHintKb: SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT,
      fieldworkPhotoQuality: SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
      fieldworkPhotoCapturedAt: '2026-06-23T01:02:03.000Z',
    });
  });

  it('keeps soil profile captures in the dedicated soil profile fields', () => {
    const capturedAt = new Date('2026-06-23T01:02:03.000Z');

    expect(createSoilProfileCaptureData(
      'file:///storage/emulated/0/DCIM/profile.jpg',
      capturedAt
    )).toEqual({
      soilProfilePhotoUri: 'file:///storage/emulated/0/DCIM/profile.jpg',
      soilProfilePhotoSizeHintKb: SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT,
      soilProfilePhotoQuality: SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
      soilProfilePhotoCapturedAt: '2026-06-23T01:02:03.000Z',
    });
  });
});
