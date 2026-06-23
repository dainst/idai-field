import AsyncStorage from '@react-native-async-storage/async-storage';

export type KoreanFieldworkInvestigationModeId =
  'trialTrench'
  | 'excavation'
  | 'surfaceSurvey'
  | 'watchingBrief';

export interface KoreanFieldworkInvestigationMode {
  detail: string;
  id: KoreanFieldworkInvestigationModeId;
  label: string;
  primaryAction: string;
  requirements: readonly string[];
}

export const KOREAN_FIELDWORK_INVESTIGATION_MODES: readonly KoreanFieldworkInvestigationMode[] = [
  {
    id: 'trialTrench',
    label: '표본·시굴조사',
    detail: '트렌치 단위로 토층과 유구 확인 과정을 기록',
    primaryAction: '트렌치부터 잡기',
    requirements: [
      '트렌치 번호와 위치',
      '토층 정리 여부',
      '유구 확인 여부',
      '피트 조사와 피트 토층도',
      '정방향·사선·토층·유구 사진',
      '최종 트렌치 번호 정리',
    ],
  },
  {
    id: 'excavation',
    label: '발굴조사',
    detail: '제토 뒤 확인한 유구를 조사 단계별로 기록',
    primaryAction: '유구부터 기록',
    requirements: [
      '제토와 유구 성격 파악',
      '유물 성격과 시대 추정',
      '조사 전 사진',
      '반절·토층둑·조사 중 사진',
      '토층 사진과 유물 노출 사진',
      '유물 수습과 완료 사진',
      '실측',
    ],
  },
  {
    id: 'surfaceSurvey',
    label: '지표조사',
    detail: '조사 범위와 지표에서 보이는 자료를 빠르게 기록',
    primaryAction: '범위와 산포 기록',
    requirements: [
      '조사 범위',
      '지표 노출 상태',
      '유물 산포와 수습 위치',
      '사진과 위치 기록',
    ],
  },
  {
    id: 'watchingBrief',
    label: '참관·입회조사',
    detail: '공사·입회 현장에서 확인한 변동 사항을 남김',
    primaryAction: '입회 내용 기록',
    requirements: [
      '공사 구간과 입회 범위',
      '확인된 유구·유물 여부',
      '사진과 위치',
      '후속 조치 필요 여부',
    ],
  },
];

const STORAGE_KEY_PREFIX = 'koreanFieldwork.investigationMode.v1';

export const createKoreanFieldworkInvestigationModeStorageKey = (
  projectId: string
): string => `${STORAGE_KEY_PREFIX}.${projectId}`;

export const getKoreanFieldworkInvestigationMode = (
  id: unknown
): KoreanFieldworkInvestigationMode | undefined =>
  typeof id === 'string'
    ? KOREAN_FIELDWORK_INVESTIGATION_MODES.find((mode) => mode.id === id)
    : undefined;

export const loadKoreanFieldworkInvestigationModeId = async (
  projectId: string
): Promise<KoreanFieldworkInvestigationModeId | undefined> => {
  const storedValue = await AsyncStorage.getItem(
    createKoreanFieldworkInvestigationModeStorageKey(projectId)
  );

  return getKoreanFieldworkInvestigationMode(storedValue)?.id;
};

export const saveKoreanFieldworkInvestigationModeId = async (
  projectId: string,
  modeId: KoreanFieldworkInvestigationModeId
) => {
  await AsyncStorage.setItem(
    createKoreanFieldworkInvestigationModeStorageKey(projectId),
    modeId
  );
};
