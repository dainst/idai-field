import {
  CategoryForm,
  NewResource,
} from 'idai-field-core';
import {
  getKoreanFieldworkFeatureTypeOption,
} from './korean-fieldwork-feature-types';
import {
  getStringArrayFieldValues,
  toggleStringArrayFieldValue,
} from './korean-fieldwork-quick-record';

export interface KoreanFieldworkFeatureAttributeOption {
  label: string;
  value: string;
}

export interface KoreanFieldworkFeatureAttributeGroup {
  fieldName: string;
  title: string;
  options: readonly KoreanFieldworkFeatureAttributeOption[];
}

const DEFAULT_FEATURE_OBSERVATION_PLACEHOLDER =
  '유구 성격 미정이면 미정으로 두고, 평면/단면 스케치 번호, 장축×단축·깊이, 충전토·중복 관계, 사진·도면 번호';
const FEATURE_OBSERVATION_GROUP_LIMIT = 3;
const FEATURE_OBSERVATION_OPTION_LIMIT = 4;

const FEATURE_ATTRIBUTE_GROUPS_BY_TYPE: Record<string, readonly KoreanFieldworkFeatureAttributeGroup[]> = {
  burial: [
    {
      fieldName: 'tombBurialStructureInvestigation',
      title: '매장 구조',
      options: [
        { value: 'gravePitShoulderLine', label: '묘광 어깨선' },
        { value: 'coffinChamberRoomSeparated', label: '관·곽·실 분리' },
        { value: 'floorAndBeddingRecorded', label: '바닥·시상' },
        { value: 'entrancePassageRecorded', label: '입구·연도·묘도' },
        { value: 'robberyDisturbanceSeparated', label: '도굴·교란' },
      ],
    },
    {
      fieldName: 'tombInteriorRecoveryRecord',
      title: '내부 수습',
      options: [
        { value: 'nearFloorFineInvestigation', label: '바닥 근처 정밀조사' },
        { value: 'smallFindLossCaution', label: '소형유물 유실 주의' },
        { value: 'organicDiscoloration', label: '유기물 변색' },
        { value: 'uniqueRecoveryNumber', label: '고유번호 수습' },
        { value: 'bulkRecovery', label: '일괄수습' },
      ],
    },
    {
      fieldName: 'tombPassageClosureSequence',
      title: '폐쇄·연도',
      options: [
        { value: 'corridorFrontClosure', label: '연도 전면 폐쇄' },
        { value: 'corridorInteriorClosure', label: '연도 내부 폐쇄' },
        { value: 'closureStoneBeforeRemoval', label: '폐쇄석 제거 전 기록' },
        { value: 'closureSoilRecorded', label: '폐쇄토 기록' },
        { value: 'reopenedOrRepaired', label: '재개방·수리' },
      ],
    },
  ],
  building: [
    {
      fieldName: 'surfaceBuildingJudgement',
      title: '건물 판단',
      options: [
        { value: 'groundLevelBuildingCandidate', label: '지면식 후보' },
        { value: 'raisedFloorBuildingCandidate', label: '고상식 후보' },
        { value: 'regularPostholeArrangement', label: '주혈 배치 정연' },
        { value: 'postholeSizeDirectionRecorded', label: '주혈 크기·방향' },
        { value: 'livingSurfaceConfirmed', label: '생활면 확인' },
      ],
    },
    {
      fieldName: 'foundationTraceRecord',
      title: '기초 흔적',
      options: [
        { value: 'pillarSeatTrace', label: '기둥자리' },
        { value: 'packingStone', label: '적심석' },
        { value: 'reinforcementSoil', label: '보강토' },
        { value: 'foundationStone', label: '기초석' },
        { value: 'noTraceConfirmed', label: '흔적 없음' },
      ],
    },
  ],
  dwelling: [
    {
      fieldName: 'pitDwellingExposureBaulk',
      title: '노출·둑',
      options: [
        { value: 'initialStratigraphyChecked', label: '최초 층위 확인' },
        { value: 'shoulderLineRecorded', label: '어깨선 기록' },
        { value: 'baulkPlanSet', label: '토층둑 설정' },
        { value: 'sectionPhotoImmediate', label: '단면 즉시 촬영' },
        { value: 'plasticCoverOrShade', label: '보양·차광' },
      ],
    },
    {
      fieldName: 'pitDwellingFloorFacility',
      title: '바닥·시설',
      options: [
        { value: 'floorSurfaceIdentified', label: '바닥면' },
        { value: 'wallFloorJunctionFollowed', label: '벽·바닥 접점' },
        { value: 'postholesChecked', label: '주혈' },
        { value: 'hearthChecked', label: '노지' },
        { value: 'wallGrooveChecked', label: '벽구' },
        { value: 'entranceChecked', label: '출입구' },
      ],
    },
    {
      fieldName: 'pitDwellingFireEvidence',
      title: '피열 흔적',
      options: [
        { value: 'charredTimberRecorded', label: '탄화목' },
        { value: 'burntSoilRecorded', label: '소토' },
        { value: 'ashLayerRecorded', label: '재층' },
        { value: 'heatAlteredFloor', label: '피열 바닥' },
        { value: 'timberDirectionMapped', label: '목재 방향' },
        { value: 'fireTypeNotAssumed', label: '화재 유형 단정 금지' },
      ],
    },
  ],
  kiln: [
    {
      fieldName: 'potteryKilnIdentification',
      title: '가마 판정',
      options: [
        { value: 'firingFeature', label: '소성유구' },
        { value: 'structuralKilnCandidate', label: '구조요 후보' },
        { value: 'fireboxPresent', label: '화구 확인' },
        { value: 'firingCombustionSeparated', label: '소성·연소부 분리' },
        { value: 'typeNameDeferred', label: '형식명 보류' },
      ],
    },
    {
      fieldName: 'potteryKilnPartInvestigation',
      title: '가마 부위',
      options: [
        { value: 'fireboxRecorded', label: '화구' },
        { value: 'combustionPartRecorded', label: '연소부' },
        { value: 'firingPartRecorded', label: '소성부' },
        { value: 'fluePartRecorded', label: '연도부' },
        { value: 'ashDumpRecorded', label: '회구부' },
        { value: 'floorStepChecked', label: '요상 단' },
        { value: 'wallFloorSectionCut', label: '벽체·요상 절개' },
        { value: 'stratigraphicCollection', label: '층위별 수습' },
      ],
    },
    {
      fieldName: 'potteryKilnStructureContext',
      title: '구조·피열',
      options: [
        { value: 'planShapeRecorded', label: '평면형' },
        { value: 'scaleRecorded', label: '규모' },
        { value: 'firingCombustionRatio', label: '소성·연소 비율' },
        { value: 'flameFlowRecorded', label: '화염 흐름' },
        { value: 'oxidationReductionBoundary', label: '산화·환원 경계' },
        { value: 'wallCollapseFragment', label: '함몰 벽체편' },
        { value: 'ceilingFragment', label: '천장편' },
        { value: 'originalGroundCutDepth', label: '원지반 굴착 깊이' },
      ],
    },
  ],
  ditch: [
    {
      fieldName: 'firstExposureRecord',
      title: '윤곽·단면',
      options: [
        { value: 'firstExposurePhoto', label: '최초 노출 사진' },
        { value: 'featureLineVisible', label: '유구선 가시' },
        { value: 'shoulderLineRecorded', label: '어깨선' },
        { value: 'sectionCrossCheck', label: '단면 대조' },
        { value: 'confirmedBeforeInternalExcavation', label: '내부조사 전 확정' },
      ],
    },
  ],
  pit: [
    {
      fieldName: 'firstExposureRecord',
      title: '최초 노출',
      options: [
        { value: 'firstExposurePhoto', label: '최초 노출 사진' },
        { value: 'featureLineVisible', label: '유구선 가시' },
        { value: 'shoulderLineRecorded', label: '어깨선' },
        { value: 'sectionCrossCheck', label: '단면 대조' },
        { value: 'confirmedBeforeInternalExcavation', label: '내부조사 전 확정' },
      ],
    },
    {
      fieldName: 'pitFeatureFunctionAssessment',
      title: '기능 후보',
      options: [
        { value: 'storageCandidate', label: '창고 후보' },
        { value: 'dumpCandidate', label: '폐기장 후보' },
        { value: 'clayExtractionPitCandidate', label: '태토 채취장 후보' },
        { value: 'hearthEvidence', label: '노지 근거' },
        { value: 'functionNotAssumed', label: '성격 자동판정 금지' },
      ],
    },
  ],
  posthole: [
    {
      fieldName: 'postholeGroupSurvey',
      title: '주혈 배열',
      options: [
        { value: 'postholeArrayMapped', label: '배열 도면화' },
        { value: 'bayUnitRecorded', label: '칸 단위' },
        { value: 'diameterDepthRecorded', label: '직경·깊이' },
        { value: 'fillAndTampingRecorded', label: '충전토·다짐' },
        { value: 'centralAxisChecked', label: '중심축' },
        { value: 'baySpacingChecked', label: '주간거리' },
      ],
    },
    {
      fieldName: 'foundationTraceRecord',
      title: '기둥 흔적',
      options: [
        { value: 'pillarSeatTrace', label: '기둥자리' },
        { value: 'packingStone', label: '적심석' },
        { value: 'reinforcementSoil', label: '보강토' },
        { value: 'postholeIndependentFoundationCheck', label: '굴립주·독립기초' },
        { value: 'noTraceConfirmed', label: '흔적 없음' },
      ],
    },
  ],
  fence: [
    {
      fieldName: 'postholeGroupSurvey',
      title: '목책열 조사',
      options: [
        { value: 'postholeArrayMapped', label: '배열 도면화' },
        { value: 'bayUnitRecorded', label: '칸 단위' },
        { value: 'diameterDepthRecorded', label: '직경·깊이' },
        { value: 'fillAndTampingRecorded', label: '충전토·다짐' },
        { value: 'centralAxisChecked', label: '중심축' },
        { value: 'baySpacingChecked', label: '주간거리' },
      ],
    },
  ],
  production: [
    {
      fieldName: 'productionProcessSystem',
      title: '공정 체계',
      options: [
        { value: 'rawMaterialProcurement', label: '원료 채취' },
        { value: 'rawMaterialProcessing', label: '원료 가공' },
        { value: 'forming', label: '성형' },
        { value: 'drying', label: '건조' },
        { value: 'firing', label: '소성' },
        { value: 'discard', label: '폐기' },
        { value: 'localRepertoireCompared', label: '지역 양식 비교' },
      ],
    },
    {
      fieldName: 'productionSiteAssociatedFacility',
      title: '부속시설',
      options: [
        { value: 'clayPit', label: '채토장' },
        { value: 'workshop', label: '공방' },
        { value: 'dryingArea', label: '건조장' },
        { value: 'wasteDeposit', label: '폐기장' },
      ],
    },
  ],
};

export const KOREAN_FIELDWORK_FEATURE_ATTRIBUTE_FIELD_NAMES: readonly string[] =
  Array.from(new Set(
    Object.values(FEATURE_ATTRIBUTE_GROUPS_BY_TYPE)
      .flatMap((groups) => groups.map((group) => group.fieldName))
  ));

export const getKoreanFieldworkFeatureAttributeGroups = (
  category: CategoryForm | undefined,
  resource: NewResource
): readonly KoreanFieldworkFeatureAttributeGroup[] => {
  const featureType = getKoreanFieldworkFeatureTypeOption(resource.featureType)?.value;
  if (!featureType) return [];

  const fieldNames = getCategoryFieldNames(category);

  return (FEATURE_ATTRIBUTE_GROUPS_BY_TYPE[featureType] ?? [])
    .filter((group) => fieldNames.has(group.fieldName));
};

export const getKoreanFieldworkFeatureAttributeValues = (
  resource: NewResource,
  fieldName: string
): string[] => getStringArrayFieldValues(resource, fieldName);

export const getKoreanFieldworkFeatureAttributeUpdate = (
  resource: NewResource,
  fieldName: string,
  value: string
): Record<string, unknown> => ({
  [fieldName]: toggleStringArrayFieldValue(resource, fieldName, value),
});

export const getKoreanFieldworkFeatureObservationPlaceholder = (
  category: CategoryForm | undefined,
  resource: NewResource
): string => {
  const featureTypeLabel = getKoreanFieldworkFeatureTypeOption(resource.featureType)?.label;
  const groups = getKoreanFieldworkFeatureAttributeGroups(category, resource);
  if (!featureTypeLabel || groups.length === 0) return DEFAULT_FEATURE_OBSERVATION_PLACEHOLDER;

  const groupSummaries = groups
    .slice(0, FEATURE_OBSERVATION_GROUP_LIMIT)
    .map((group) => {
      const optionLabels = group.options
        .slice(0, FEATURE_OBSERVATION_OPTION_LIMIT)
        .map((option) => option.label)
        .join(', ');

      return `${group.title}: ${optionLabels}`;
    })
    .join(' / ');

  return `${featureTypeLabel} 관찰 - ${groupSummaries} / 야장 근거: 평면·단면 스케치 번호, 약측값, 사진·도면 번호, 성격 미정/추정 사유`;
};

const getCategoryFieldNames = (category: CategoryForm | undefined): Set<string> =>
  new Set(
    category?.groups.flatMap((group) =>
      group.fields.map((field) => field.name)
    ) ?? []
  );
