export interface KoreanFieldworkFeatureTypeOption {
  description: string;
  featureInterpretationTypeValue?: string;
  identifierPrefix: string;
  label: string;
  value: string;
}

export const KOREAN_FIELDWORK_FEATURE_TYPE_OPTIONS: readonly KoreanFieldworkFeatureTypeOption[] = [
  {
    value: 'unknown',
    label: '미정',
    identifierPrefix: '유구',
    description: '검출 직후 성격이 분명하지 않을 때',
  },
  {
    value: 'pit',
    label: '수혈',
    identifierPrefix: '수혈',
    featureInterpretationTypeValue: 'pitFeature',
    description: '평면 윤곽과 충전토를 먼저 확인',
  },
  {
    value: 'posthole',
    label: '주혈',
    identifierPrefix: '주혈',
    featureInterpretationTypeValue: 'posthole',
    description: '기둥 자리, 열·간격 관계를 확인',
  },
  {
    value: 'ditch',
    label: '구상유구',
    identifierPrefix: '구상유구',
    featureInterpretationTypeValue: 'ditchOrGully',
    description: '방향, 폭, 연결 관계를 확인',
  },
  {
    value: 'dwelling',
    label: '주거지',
    identifierPrefix: '주거지',
    featureInterpretationTypeValue: 'dwellingSite',
    description: '평면 형태와 내부 시설을 확인',
  },
  {
    value: 'burial',
    label: '토광묘',
    identifierPrefix: '토광묘',
    featureInterpretationTypeValue: 'tomb',
    description: '묘광 윤곽, 방향, 매장부를 확인',
  },
  {
    value: 'fence',
    label: '목책열',
    identifierPrefix: '목책열',
    description: '주혈열, 진행 방향, 간격을 확인',
  },
  {
    value: 'building',
    label: '건물지',
    identifierPrefix: '건물지',
    featureInterpretationTypeValue: 'surfaceBuilding',
    description: '주혈 배치와 건물 방향을 확인',
  },
];

export const KOREAN_FIELDWORK_FEATURE_TYPE_INTERPRETATION_VALUES =
  KOREAN_FIELDWORK_FEATURE_TYPE_OPTIONS
    .map((option) => option.featureInterpretationTypeValue)
    .filter((value): value is string => !!value);

export const getKoreanFieldworkFeatureTypeOption = (
  value: unknown
): KoreanFieldworkFeatureTypeOption | undefined =>
  typeof value === 'string'
    ? KOREAN_FIELDWORK_FEATURE_TYPE_OPTIONS.find((option) =>
      option.value === value)
    : undefined;

export const getKoreanFieldworkFeatureTypeLabel = (
  value: unknown
): string | undefined => getKoreanFieldworkFeatureTypeOption(value)?.label;

export const getKoreanFieldworkFeatureTypeLabelFromInterpretationType = (
  value: unknown
): string | undefined => {
  const values = Array.isArray(value) ? value : [value];
  const option = KOREAN_FIELDWORK_FEATURE_TYPE_OPTIONS.find((candidate) =>
    values.includes(candidate.featureInterpretationTypeValue)
  );

  return option?.label;
};

export const getKoreanFieldworkFeatureInterpretationTypeValue = (
  value: unknown
): string | undefined =>
  getKoreanFieldworkFeatureTypeOption(value)?.featureInterpretationTypeValue;
