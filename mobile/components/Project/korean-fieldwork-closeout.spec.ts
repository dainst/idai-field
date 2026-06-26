import {
  getKoreanFieldworkCloseoutSummary,
  makeKoreanFieldworkCloseoutSummary,
} from './korean-fieldwork-closeout';

describe('Korean fieldwork closeout summary', () => {
  it('blocks closeout when critical issues remain', () => {
    const summary = getKoreanFieldworkCloseoutSummary([
      createIssue('warning', 'feature-2', '이어서 볼 유구', 'w'),
      createIssue('critical', 'feature-1', '먼저 볼 유구', 'c'),
      createIssue('info', 'sample-1', '살펴볼 시료', 'i'),
    ] as any);

    expect(summary.status).toBe('blocked');
    expect(summary.title).toBe('먼저 볼 항목');
    expect(summary.counts).toEqual({ critical: 1, warning: 1, info: 1 });
    expect(summary.issues.map((issue) => issue.ruleId)).toEqual(['c', 'w', 'i']);
  });

  it('keeps a review state for warning and info issues', () => {
    const summary = getKoreanFieldworkCloseoutSummary([
      createIssue('info', 'find-1', '유물', 'i'),
      createIssue('warning', 'feature-1', '유구', 'w'),
    ] as any);

    expect(summary.status).toBe('needsReview');
    expect(summary.title).toBe('마감 전 확인');
    expect(summary.detail).toBe('이어서 볼 항목 1건, 살펴볼 항목 1건이 남아 있습니다.');
  });

  it('returns a clear state when no issues remain', () => {
    const summary = getKoreanFieldworkCloseoutSummary([]);

    expect(summary.status).toBe('clear');
    expect(summary.title).toBe('마감 가능');
    expect(summary.issues).toEqual([]);
  });

  it('builds closeout summary from project documents', () => {
    const feature = createDocument('feature-1', 'Feature', 'feature-1', {
      featureRecordingStatus: 'confirmed',
      featureInvestigationChecklist: [],
    });

    const summary = makeKoreanFieldworkCloseoutSummary([feature] as any);

    expect(summary.status).toBe('needsReview');
    expect(summary.counts.warning).toBe(1);
    expect(summary.issues[0]).toMatchObject({
      documentId: 'feature-1',
      ruleId: 'feature-complete-photo',
    });
  });

  it('adds soil color review issues to mobile closeout', () => {
    const soilProfilePhoto = createDocument(
      'soil-photo-1',
      'SoilProfilePhoto',
      '토층사진 1',
      {
        originalFilename: 'soil-profile-1.jpg',
        width: 3000,
        height: 2000,
        soilProfilePhotoCapturedAt: '2026-06-23T01:02:03.000Z',
        soilColorAssistStatus: 'candidatesAvailable',
        soilColorAssistCandidates: '1: 10YR 4/3 (높음, 차이 0.0)',
        soilProfileColorSwatches: '[]',
      }
    );

    const summary = makeKoreanFieldworkCloseoutSummary([soilProfilePhoto] as any);

    expect(summary.status).toBe('needsReview');
    expect(summary.counts.warning).toBe(2);
    expect(summary.issues.map((issue) => issue.ruleId)).toEqual([
      'soil-color-candidates-review',
      'soil-profile-color-swatches-missing',
    ]);
    expect(summary.issues[0].message).toBe(
      '사진에서 읽은 먼셀 후보를 검토해야 합니다.'
    );
    expect(summary.issues[0].recommendedAction).toContain('먼셀 후보 10YR 4/3');
  });

  it('adds missing report metadata issues for mobile photo records', () => {
    const photo = createDocument('photo-1', 'Photo', '사진 1', {
      originalFilename: '',
      width: 4032,
    });
    const soilProfilePhoto = createDocument(
      'soil-photo-1',
      'SoilProfilePhoto',
      '토층사진 1',
      {
        originalFilename: 'soil-profile-1.jpg',
        width: '3000',
        soilProfileColorSwatches: '10YR 4/3',
      }
    );

    const summary = makeKoreanFieldworkCloseoutSummary([
      photo,
      soilProfilePhoto,
    ] as any);

    expect(summary.status).toBe('needsReview');
    expect(summary.counts.warning).toBe(2);
    expect(summary.issues.map((issue) => issue.ruleId)).toEqual([
      'fieldwork-photo-report-metadata-missing',
      'soil-profile-photo-report-metadata-missing',
    ]);
    expect(summary.issues[0]).toMatchObject({
      documentId: 'photo-1',
      relatedFields: [
        'originalFilename',
        'fieldworkPhotoCapturedAt',
        'height',
      ],
    });
    expect(summary.issues[0].recommendedAction).toContain('원본 파일명');
    expect(summary.issues[0].recommendedAction).toContain('촬영시각');
    expect(summary.issues[1]).toMatchObject({
      documentId: 'soil-photo-1',
      relatedFields: ['soilProfilePhotoCapturedAt', 'height'],
    });
  });

  it('adds missing Field Hub upload issues for local tablet photo records', () => {
    const photo = createDocument('photo-1', 'Photo', 'A photo', {
      fieldworkPhotoCapturedAt: '2026-06-23T01:02:03.000Z',
      fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
      originalFilename: 'photo-1.jpg',
      width: 4032,
      height: 3024,
    });
    const soilProfilePhoto = createDocument(
      'soil-photo-1',
      'SoilProfilePhoto',
      'B soil',
      {
        soilProfilePhotoCapturedAt: '2026-06-23T01:02:03.000Z',
        soilProfilePhotoUri: 'file:///tablet/photos/soil-photo-1.jpg',
        originalFilename: 'soil-profile-1.jpg',
        width: 3000,
        height: 2000,
        soilProfileColorSwatches: '10YR 4/3',
      }
    );
    const uploadedPhoto = createDocument('photo-2', 'Photo', 'C uploaded', {
      fieldworkPhotoCapturedAt: '2026-06-23T01:02:03.000Z',
      fieldworkPhotoUri: 'file:///tablet/photos/photo-2.jpg',
      originalFilename: 'photo-2.jpg',
      width: 4032,
      height: 3024,
      digitalSourcePreservation: [
        'originalPhoto',
        'originalImage',
        'webOrServerBackup',
        'backupVerified',
      ],
      fieldworkImageUploadStatus: 'uploaded',
      fieldworkImageUploadedAt: '2026-06-23T01:03:00.000Z',
      fieldworkImageUploadedUri: 'file:///tablet/photos/photo-2.jpg',
      fieldworkImageUploadTarget:
        'https://field.example/files/fieldwork/photo-2?type=original_image',
      fieldworkImageUploadedProject: 'fieldwork',
      fieldworkImageUploadedSizeBytes: 481516,
      fieldworkImageUploadedMd5: 'tablet-md5',
      fieldworkImageStoredSizeBytes: 481516,
      fieldworkImageStoredMd5: 'tablet-md5',
      fieldworkImageStoredSha256: 'server-sha256',
    });
    const drawing = createDocument('drawing-1', 'Drawing', 'D drawing', {
      fileUri: 'file:///tablet/drawings/drawing-1.jpg',
    });
    const uploadedDrawing = createDocument('drawing-2', 'Drawing', 'E uploaded', {
      fileUri: 'file:///tablet/drawings/drawing-2.jpg',
      digitalSourcePreservation: [
        'originalDrawing',
        'webOrServerBackup',
        'backupVerified',
      ],
      fieldworkImageUploadStatus: 'uploaded',
      fieldworkImageUploadedAt: '2026-06-23T01:04:00.000Z',
      fieldworkImageUploadedUri: 'file:///tablet/drawings/drawing-2.jpg',
      fieldworkImageUploadTarget:
        'https://field.example/files/fieldwork/drawing-2?type=original_image',
      fieldworkImageUploadedProject: 'fieldwork',
      fieldworkImageUploadedSizeBytes: 481516,
      fieldworkImageUploadedMd5: 'drawing-md5',
      fieldworkImageStoredSizeBytes: 481516,
      fieldworkImageStoredMd5: 'drawing-md5',
      fieldworkImageStoredSha256: 'drawing-server-sha256',
    });

    const summary = makeKoreanFieldworkCloseoutSummary([
      photo,
      soilProfilePhoto,
      uploadedPhoto,
      drawing,
      uploadedDrawing,
    ] as any);

    expect(summary.status).toBe('needsReview');
    expect(summary.counts.warning).toBe(3);
    expect(summary.issues.map((issue) => issue.ruleId)).toEqual([
      'fieldwork-photo-upload-missing',
      'soil-profile-photo-upload-missing',
      'fieldwork-drawing-upload-missing',
    ]);
    expect(summary.issues[0]).toMatchObject({
      documentId: 'photo-1',
      relatedFields: [
        'fieldworkImageUploadStatus',
        'fieldworkImageUploadedAt',
        'fieldworkImageUploadedUri',
        'fieldworkImageUploadTarget',
        'fieldworkImageUploadedProject',
        'fieldworkImageUploadedSizeBytes',
        'fieldworkImageUploadedMd5',
        'fieldworkImageStoredSizeBytes',
        'fieldworkImageStoredMd5',
        'fieldworkImageStoredSha256',
        'digitalSourcePreservation',
      ],
    });
    expect(summary.issues[2]).toMatchObject({
      documentId: 'drawing-1',
      message: '도면 원본의 Field Hub 백업이 아직 확인되지 않았습니다.',
      relatedFields: [
        'fieldworkImageUploadStatus',
        'fieldworkImageUploadedAt',
        'fieldworkImageUploadedUri',
        'fieldworkImageUploadTarget',
        'fieldworkImageUploadedProject',
        'fieldworkImageUploadedSizeBytes',
        'fieldworkImageUploadedMd5',
        'fieldworkImageStoredSizeBytes',
        'fieldworkImageStoredMd5',
        'fieldworkImageStoredSha256',
        'digitalSourcePreservation',
      ],
    });
    expect(summary.issues[0].recommendedAction).toContain('서버 업로드 시각');
  });

  it('keeps tablet media in closeout when upload audit fields are incomplete', () => {
    const partialUpload = createDocument('photo-1', 'Photo', 'A photo', {
      fieldworkPhotoCapturedAt: '2026-06-23T01:02:03.000Z',
      fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
      originalFilename: 'photo-1.jpg',
      width: 4032,
      height: 3024,
      fieldworkImageUploadStatus: 'uploaded',
      fieldworkImageUploadedAt: '2026-06-23T01:03:00.000Z',
      fieldworkImageUploadedUri: 'file:///tablet/photos/previous-photo.jpg',
      fieldworkImageUploadTarget:
        'https://field.example/files/fieldwork/photo-1?type=original_image',
      fieldworkImageUploadedProject: 'fieldwork',
      digitalSourcePreservation: ['webOrServerBackup'],
    });

    const summary = makeKoreanFieldworkCloseoutSummary([partialUpload] as any);

    expect(summary.issues.map((issue) => issue.ruleId)).toEqual([
      'fieldwork-photo-upload-missing',
    ]);
  });

  it('keeps tablet media in closeout when the upload target points to another file', () => {
    const wrongTargetUpload = createDocument('photo-1', 'Photo', 'A photo', {
      fieldworkPhotoCapturedAt: '2026-06-23T01:02:03.000Z',
      fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
      originalFilename: 'photo-1.jpg',
      width: 4032,
      height: 3024,
      digitalSourcePreservation: [
        'originalPhoto',
        'originalImage',
        'webOrServerBackup',
        'backupVerified',
      ],
      fieldworkImageUploadStatus: 'uploaded',
      fieldworkImageUploadedAt: '2026-06-23T01:03:00.000Z',
      fieldworkImageUploadedUri: 'file:///tablet/photos/photo-1.jpg',
      fieldworkImageUploadTarget:
        'https://field.example/files/fieldwork/other-photo?type=original_image',
      fieldworkImageUploadedProject: 'fieldwork',
      fieldworkImageUploadedSizeBytes: 481516,
      fieldworkImageUploadedMd5: 'tablet-md5',
      fieldworkImageStoredSizeBytes: 481516,
      fieldworkImageStoredMd5: 'tablet-md5',
      fieldworkImageStoredSha256: 'server-sha256',
    });

    const summary = makeKoreanFieldworkCloseoutSummary([wrongTargetUpload] as any);

    expect(summary.issues.map((issue) => issue.ruleId)).toEqual([
      'fieldwork-photo-upload-missing',
    ]);
  });

  it('adds unreviewed tablet handwriting issues to mobile closeout', () => {
    const handwrittenMemo = createDocument('memo-1', 'PenMemo', '메모 1', {
      penMemoStrokes: '{"version":1,"strokes":[{"points":[{"x":1,"y":2}]}]}',
      penMemoTranscriptionStatus: 'pending',
    });
    const reviewedMemo = createDocument('memo-2', 'PenMemo', '메모 2', {
      penMemoReviewedTranscript: '[관찰 내용] 바닥면 정리 완료.',
      penMemoStrokes: '{"version":1,"strokes":[{"points":[{"x":1,"y":2}]}]}',
      penMemoTranscriptionStatus: 'reviewed',
    });

    const summary = makeKoreanFieldworkCloseoutSummary([
      handwrittenMemo,
      reviewedMemo,
    ] as any);

    expect(summary.status).toBe('needsReview');
    expect(summary.counts.warning).toBe(1);
    expect(summary.issues[0]).toMatchObject({
      documentId: 'memo-1',
      ruleId: 'pen-memo-handwriting-transcription',
      message: '태블릿 손글씨 현장 메모가 아직 전사되지 않았습니다. 손그림 메모 1획 1점',
    });
    expect(summary.issues[0].recommendedAction).toContain(
      '태블릿 손글씨 원자료'
    );
  });
});

const createIssue = (
  severity: 'critical'|'warning'|'info',
  documentId: string,
  identifier: string,
  ruleId: string
) => ({
  severity,
  documentId,
  identifier,
  ruleId,
  category: 'Feature',
  message: 'message',
  relatedFields: [],
  recommendedAction: '확인하세요.',
  blocksSave: false,
});

const createDocument = (
  id: string,
  category: string,
  identifier: string,
  fields: Record<string, unknown> = {}
) => ({
  resource: {
    id,
    identifier,
    category,
    relations: {},
    ...fields,
  },
});
