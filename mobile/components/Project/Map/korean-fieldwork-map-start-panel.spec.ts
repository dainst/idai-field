import {
  getKoreanFieldworkMapStartPanelCopy,
} from './korean-fieldwork-map-start-panel';

describe('korean-fieldwork-map-start-panel', () => {
  it('starts empty maps from survey boundary confirmation wording', () => {
    expect(getKoreanFieldworkMapStartPanelCopy({
      hasBoundarySummary: true,
    })).toEqual({
      title: '조사 경계 생성',
      detail: '프로젝트에 적은 경계를 GPS·파일·위성지도 기준으로 확정합니다',
      fileImportActionTitle: 'SHP/DXF/CSV',
      primaryActionTitle: 'GPS 임시 경계',
      satelliteActionTitle: '위성지도',
    });
  });

  it('keeps legacy record wrapping behind boundary creation wording', () => {
    expect(getKoreanFieldworkMapStartPanelCopy({
      hasLegacyRecordsToWrap: true,
      legacyRootDocumentCount: 3,
    })).toEqual({
      title: '조사 경계 생성',
      detail: '3개 기존 기록은 유지하고 새 조사 경계 아래에서 계속 기록합니다',
      fileImportActionTitle: 'SHP/DXF/CSV',
      primaryActionTitle: 'GPS 임시 경계',
      satelliteActionTitle: '위성지도',
    });
  });

  it('shows boundary confirmation once a fieldwork unit exists', () => {
    expect(getKoreanFieldworkMapStartPanelCopy({
      hasPrimaryOperation: true,
    })).toEqual({
      title: '조사 경계 생성',
      detail: 'GPS로 임시 경계를 만들거나 파일·위성지도 기준을 연결합니다',
      fileImportActionTitle: 'SHP/DXF/CSV',
      primaryActionTitle: 'GPS 임시 경계',
      satelliteActionTitle: '위성지도',
    });
  });
});
