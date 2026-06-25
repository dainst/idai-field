interface KoreanFieldworkMapStartPanelCopyOptions {
  hasBoundarySummary?: boolean;
  hasLegacyRecordsToWrap?: boolean;
  hasPrimaryOperation?: boolean;
  legacyRootDocumentCount?: number;
}

export interface KoreanFieldworkMapStartPanelCopy {
  detail: string;
  fileImportActionTitle: string;
  primaryActionTitle: string;
  satelliteActionTitle: string;
  title: string;
}

export const getKoreanFieldworkMapStartPanelCopy = (
  options: KoreanFieldworkMapStartPanelCopyOptions
): KoreanFieldworkMapStartPanelCopy => {
  if (options.hasPrimaryOperation) {
    return {
      title: '조사 경계 생성',
      detail: 'GPS로 임시 경계를 만들거나 파일·위성지도 기준을 연결합니다',
      fileImportActionTitle: 'SHP/DXF/CSV',
      primaryActionTitle: 'GPS 임시 경계',
      satelliteActionTitle: '위성지도',
    };
  }

  if (options.hasLegacyRecordsToWrap) {
    return {
      title: '조사 경계 생성',
      detail: `${options.legacyRootDocumentCount ?? 0}개 기존 기록은 유지하고 새 조사 경계 아래에서 계속 기록합니다`,
      fileImportActionTitle: 'SHP/DXF/CSV',
      primaryActionTitle: 'GPS 임시 경계',
      satelliteActionTitle: '위성지도',
    };
  }

  return {
    title: '조사 경계 생성',
    detail: options.hasBoundarySummary
      ? '프로젝트에 적은 경계를 GPS·파일·위성지도 기준으로 확정합니다'
      : '조사 구역을 GPS·파일·위성지도 기준으로 먼저 정합니다',
    fileImportActionTitle: 'SHP/DXF/CSV',
    primaryActionTitle: 'GPS 임시 경계',
    satelliteActionTitle: '위성지도',
  };
};
