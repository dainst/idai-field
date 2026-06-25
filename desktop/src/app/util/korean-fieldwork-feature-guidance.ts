import { Condition, Document, Field, Resource } from 'idai-field-core';


export type KoreanFieldworkFeatureNarrativeTarget = 'description'|'featureChecklistNote'|'interpretation';

export interface KoreanFieldworkFeatureGuidanceChecklist {
    fieldName: string;
    valueIds: readonly string[];
}

export interface KoreanFieldworkFeatureGuidancePreset {
    id: string;
    label: string;
    detail: string;
    icon: string;
    featureType: string;
    interpretationValue?: string;
    checklists: readonly KoreanFieldworkFeatureGuidanceChecklist[];
    narrativeTemplate: string;
}

const FEATURE_WORKFLOW_CATEGORIES = new Set(['Feature', 'FeatureGroup', 'FeatureSegment']);

const FEATURE_GUIDANCE_VALUE_LABELS: Readonly<Record<string, string>> = {
    gravePitShoulderLine: '묘광 어깨선',
    coffinChamberRoomSeparated: '관·곽·실 분리',
    floorAndBeddingRecorded: '바닥·시상',
    entrancePassageRecorded: '입구·연도·묘도',
    robberyDisturbanceSeparated: '도굴·교란',
    nearFloorFineInvestigation: '바닥 근처 정밀조사',
    smallFindLossCaution: '소형유물 유실 주의',
    organicDiscoloration: '유기물 변색',
    uniqueRecoveryNumber: '고유번호 수습',
    bulkRecovery: '일괄수습',
    corridorFrontClosure: '연도 전면 폐쇄',
    corridorInteriorClosure: '연도 내부 폐쇄',
    closureStoneBeforeRemoval: '폐쇄석 제거 전 기록',
    closureSoilRecorded: '폐쇄토 기록',
    reopenedOrRepaired: '재개방·수리',
    groundLevelBuildingCandidate: '지면식 후보',
    raisedFloorBuildingCandidate: '고상식 후보',
    regularPostholeArrangement: '주혈 배치 정연',
    postholeSizeDirectionRecorded: '주혈 크기·방향',
    livingSurfaceConfirmed: '생활면 확인',
    pillarSeatTrace: '기둥자리',
    packingStone: '적심석',
    reinforcementSoil: '보강토',
    foundationStone: '기초석',
    noTraceConfirmed: '흔적 없음',
    initialStratigraphyChecked: '최초 층위 확인',
    shoulderLineRecorded: '어깨선',
    baulkPlanSet: '토층둑 설정',
    sectionPhotoImmediate: '단면 즉시 촬영',
    plasticCoverOrShade: '보양·차광',
    floorSurfaceIdentified: '바닥면',
    wallFloorJunctionFollowed: '벽·바닥 접점',
    postholesChecked: '주혈',
    hearthChecked: '노지',
    wallGrooveChecked: '벽구',
    entranceChecked: '출입구',
    charredTimberRecorded: '탄화목',
    burntSoilRecorded: '소토',
    ashLayerRecorded: '재층',
    heatAlteredFloor: '피열 바닥',
    timberDirectionMapped: '목재 방향',
    fireTypeNotAssumed: '화재 유형 단정 금지',
    firingFeature: '소성유구',
    structuralKilnCandidate: '구조요 후보',
    fireboxPresent: '화구 확인',
    firingCombustionSeparated: '소성·연소부 분리',
    typeNameDeferred: '형식명 보류',
    fireboxRecorded: '화구',
    combustionPartRecorded: '연소부',
    firingPartRecorded: '소성부',
    fluePartRecorded: '연도부',
    ashDumpRecorded: '회구부',
    floorStepChecked: '요상 단',
    wallFloorSectionCut: '벽체·요상 절개',
    stratigraphicCollection: '층위별 수습',
    planShapeRecorded: '평면형',
    scaleRecorded: '규모',
    firingCombustionRatio: '소성·연소 비율',
    flameFlowRecorded: '화염 흐름',
    oxidationReductionBoundary: '산화·환원 경계',
    wallCollapseFragment: '함몰 벽체편',
    ceilingFragment: '천장편',
    originalGroundCutDepth: '원지반 굴착 깊이',
    firstExposurePhoto: '최초 노출 사진',
    featureLineVisible: '유구선 가시',
    sectionCrossCheck: '단면 대조',
    confirmedBeforeInternalExcavation: '내부조사 전 확정',
    storageCandidate: '창고 후보',
    dumpCandidate: '폐기장 후보',
    clayExtractionPitCandidate: '태토 채취장 후보',
    hearthEvidence: '노지 근거',
    functionNotAssumed: '성격 자동판정 금지',
    postholeArrayMapped: '배열 도면화',
    bayUnitRecorded: '칸 단위',
    diameterDepthRecorded: '직경·깊이',
    fillAndTampingRecorded: '충전토·다짐',
    centralAxisChecked: '중심축',
    baySpacingChecked: '주간거리',
    postholeIndependentFoundationCheck: '굴립주·독립기초',
    rawMaterialProcurement: '원료 채취',
    rawMaterialProcessing: '원료 가공',
    forming: '성형',
    drying: '건조',
    firing: '소성',
    discard: '폐기',
    localRepertoireCompared: '지역 양식 비교',
    clayPit: '채토장',
    workshop: '공방',
    dryingArea: '건조장',
    wasteDeposit: '폐기장'
};

const NARRATIVE_TARGET_ORDER: readonly KoreanFieldworkFeatureNarrativeTarget[] = [
    'description',
    'featureChecklistNote',
    'interpretation'
];

const FEATURE_GUIDANCE_EVIDENCE_LINES: readonly string[] = [
    '- 스케치/약측 기준:',
    '- 사진/도면 번호:'
];

const makeFeatureGuidanceNarrativeTemplate = (lines: readonly string[]): string => {

    const lineSet = new Set(lines);

    return [
        ...lines,
        ...FEATURE_GUIDANCE_EVIDENCE_LINES.filter(line => !lineSet.has(line))
    ].join('\n');
};

export const KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS: readonly KoreanFieldworkFeatureGuidancePreset[] = [
    {
        id: 'unknown',
        label: '미정',
        detail: '검출 직후 성격 보류',
        icon: 'mdi-help-circle-outline',
        featureType: 'unknown',
        checklists: [],
        narrativeTemplate: makeFeatureGuidanceNarrativeTemplate([
            '유구 성격 미정:',
            '- 검출 위치:',
            '- 평면 윤곽:',
            '- 스케치/약측 기준:',
            '- 충전토/주변토 차이:',
            '- 절단·중복 관계:',
            '- 추가 확인 필요:'
        ])
    },
    {
        id: 'kiln',
        label: '가마',
        detail: '연소부·소성부·연도부',
        icon: 'mdi-fire',
        featureType: 'kiln',
        interpretationValue: 'kiln',
        checklists: [
            {
                fieldName: 'potteryKilnPartInvestigation',
                valueIds: [
                    'fireboxRecorded',
                    'combustionPartRecorded',
                    'firingPartRecorded',
                    'fluePartRecorded',
                    'ashDumpRecorded',
                    'floorStepChecked',
                    'wallFloorSectionCut',
                    'stratigraphicCollection'
                ]
            },
            {
                fieldName: 'potteryKilnStructureContext',
                valueIds: [
                    'planShapeRecorded',
                    'scaleRecorded',
                    'firingCombustionRatio',
                    'flameFlowRecorded',
                    'oxidationReductionBoundary',
                    'wallCollapseFragment',
                    'ceilingFragment',
                    'originalGroundCutDepth'
                ]
            },
            {
                fieldName: 'potteryKilnIdentification',
                valueIds: [
                    'firingFeature',
                    'structuralKilnCandidate',
                    'fireboxPresent',
                    'firingCombustionSeparated',
                    'typeNameDeferred'
                ]
            }
        ],
        narrativeTemplate: makeFeatureGuidanceNarrativeTemplate([
            '가마 구조 관찰:',
            '- 화구:',
            '- 연소부:',
            '- 소성부:',
            '- 연도부:',
            '- 회구부/폐기장:',
            '- 요상·벽체·천장 흔적:',
            '- 소결·산화/환원 색 경계:'
        ])
    },
    {
        id: 'dwelling',
        label: '주거지',
        detail: '노출·바닥·내부시설',
        icon: 'mdi-home-outline',
        featureType: 'dwelling',
        interpretationValue: 'dwellingSite',
        checklists: [
            {
                fieldName: 'pitDwellingExposureBaulk',
                valueIds: [
                    'initialStratigraphyChecked',
                    'shoulderLineRecorded',
                    'baulkPlanSet',
                    'sectionPhotoImmediate',
                    'plasticCoverOrShade'
                ]
            },
            {
                fieldName: 'pitDwellingFloorFacility',
                valueIds: [
                    'floorSurfaceIdentified',
                    'wallFloorJunctionFollowed',
                    'postholesChecked',
                    'hearthChecked',
                    'wallGrooveChecked',
                    'entranceChecked'
                ]
            },
            {
                fieldName: 'pitDwellingFireEvidence',
                valueIds: [
                    'charredTimberRecorded',
                    'burntSoilRecorded',
                    'ashLayerRecorded',
                    'heatAlteredFloor',
                    'timberDirectionMapped',
                    'fireTypeNotAssumed'
                ]
            }
        ],
        narrativeTemplate: makeFeatureGuidanceNarrativeTemplate([
            '주거지 관찰:',
            '- 평면 윤곽:',
            '- 벽선/주혈:',
            '- 바닥면:',
            '- 노지/화덕:',
            '- 내부 퇴적:',
            '- 중복·절단 관계:'
        ])
    },
    {
        id: 'pit',
        label: '수혈',
        detail: '윤곽·충전토·기능',
        icon: 'mdi-circle-outline',
        featureType: 'pit',
        interpretationValue: 'pitFeature',
        checklists: [
            {
                fieldName: 'firstExposureRecord',
                valueIds: [
                    'firstExposurePhoto',
                    'featureLineVisible',
                    'shoulderLineRecorded',
                    'sectionCrossCheck',
                    'confirmedBeforeInternalExcavation'
                ]
            },
            {
                fieldName: 'pitFeatureFunctionAssessment',
                valueIds: [
                    'storageCandidate',
                    'dumpCandidate',
                    'clayExtractionPitCandidate',
                    'hearthEvidence',
                    'functionNotAssumed'
                ]
            }
        ],
        narrativeTemplate: makeFeatureGuidanceNarrativeTemplate([
            '수혈유구 관찰:',
            '- 평면 윤곽:',
            '- 충전토 색·입도:',
            '- 바닥면:',
            '- 벽면 경사:',
            '- 포함 유물/시료:',
            '- 기능 판단 근거:'
        ])
    },
    {
        id: 'posthole',
        label: '주혈',
        detail: '열·간격·기둥흔',
        icon: 'mdi-record-circle-outline',
        featureType: 'posthole',
        interpretationValue: 'posthole',
        checklists: [
            {
                fieldName: 'postholeGroupSurvey',
                valueIds: [
                    'postholeArrayMapped',
                    'bayUnitRecorded',
                    'diameterDepthRecorded',
                    'fillAndTampingRecorded',
                    'centralAxisChecked',
                    'baySpacingChecked'
                ]
            },
            {
                fieldName: 'foundationTraceRecord',
                valueIds: [
                    'pillarSeatTrace',
                    'packingStone',
                    'reinforcementSoil',
                    'postholeIndependentFoundationCheck',
                    'noTraceConfirmed'
                ]
            }
        ],
        narrativeTemplate: makeFeatureGuidanceNarrativeTemplate([
            '주혈 관찰:',
            '- 평면 위치:',
            '- 직경/깊이:',
            '- 기둥흔:',
            '- 충전토:',
            '- 열·간격 관계:',
            '- 관련 유구:'
        ])
    },
    {
        id: 'ditch',
        label: '구상유구',
        detail: '방향·폭·접속 관계',
        icon: 'mdi-vector-line',
        featureType: 'ditch',
        interpretationValue: 'ditchOrGully',
        checklists: [
            {
                fieldName: 'firstExposureRecord',
                valueIds: [
                    'firstExposurePhoto',
                    'featureLineVisible',
                    'shoulderLineRecorded',
                    'sectionCrossCheck',
                    'confirmedBeforeInternalExcavation'
                ]
            }
        ],
        narrativeTemplate: makeFeatureGuidanceNarrativeTemplate([
            '구상유구 관찰:',
            '- 진행 방향:',
            '- 폭/깊이:',
            '- 단면 형태:',
            '- 충전토:',
            '- 접속·절단 관계:',
            '- 기능 판단 근거:'
        ])
    },
    {
        id: 'tomb',
        label: '분묘',
        detail: '묘광·매장부·폐쇄',
        icon: 'mdi-rectangle-outline',
        featureType: 'burial',
        interpretationValue: 'tomb',
        checklists: [
            {
                fieldName: 'tombBurialStructureInvestigation',
                valueIds: [
                    'gravePitShoulderLine',
                    'coffinChamberRoomSeparated',
                    'floorAndBeddingRecorded',
                    'entrancePassageRecorded',
                    'robberyDisturbanceSeparated'
                ]
            },
            {
                fieldName: 'tombInteriorRecoveryRecord',
                valueIds: [
                    'nearFloorFineInvestigation',
                    'smallFindLossCaution',
                    'organicDiscoloration',
                    'uniqueRecoveryNumber',
                    'bulkRecovery'
                ]
            },
            {
                fieldName: 'tombPassageClosureSequence',
                valueIds: [
                    'corridorFrontClosure',
                    'corridorInteriorClosure',
                    'closureStoneBeforeRemoval',
                    'closureSoilRecorded',
                    'reopenedOrRepaired'
                ]
            }
        ],
        narrativeTemplate: makeFeatureGuidanceNarrativeTemplate([
            '분묘 관찰:',
            '- 묘광 윤곽:',
            '- 장축 방향:',
            '- 매장부/관흔:',
            '- 폐쇄 구조:',
            '- 부장품 위치:',
            '- 교란·재개방 흔적:'
        ])
    },
    {
        id: 'fence',
        label: '목책열',
        detail: '주혈열·진행 방향',
        icon: 'mdi-dots-horizontal',
        featureType: 'fence',
        checklists: [
            {
                fieldName: 'postholeGroupSurvey',
                valueIds: [
                    'postholeArrayMapped',
                    'bayUnitRecorded',
                    'diameterDepthRecorded',
                    'fillAndTampingRecorded',
                    'centralAxisChecked',
                    'baySpacingChecked'
                ]
            }
        ],
        narrativeTemplate: makeFeatureGuidanceNarrativeTemplate([
            '목책열 관찰:',
            '- 진행 방향:',
            '- 주혈 간격:',
            '- 직경/깊이:',
            '- 충전토/다짐:',
            '- 관련 유구:',
            '- 연장 여부:'
        ])
    },
    {
        id: 'building',
        label: '건물지',
        detail: '주혈 배치·건물 방향',
        icon: 'mdi-domain',
        featureType: 'building',
        interpretationValue: 'surfaceBuilding',
        checklists: [
            {
                fieldName: 'surfaceBuildingJudgement',
                valueIds: [
                    'groundLevelBuildingCandidate',
                    'raisedFloorBuildingCandidate',
                    'regularPostholeArrangement',
                    'postholeSizeDirectionRecorded',
                    'livingSurfaceConfirmed'
                ]
            },
            {
                fieldName: 'foundationTraceRecord',
                valueIds: [
                    'pillarSeatTrace',
                    'packingStone',
                    'reinforcementSoil',
                    'foundationStone',
                    'noTraceConfirmed'
                ]
            }
        ],
        narrativeTemplate: makeFeatureGuidanceNarrativeTemplate([
            '건물지 관찰:',
            '- 평면 배치:',
            '- 장축 방향:',
            '- 주혈/초석:',
            '- 생활면:',
            '- 내부시설:',
            '- 판단 근거:'
        ])
    },
    {
        id: 'production',
        label: '생산유구',
        detail: '공정·부속시설',
        icon: 'mdi-hammer-wrench',
        featureType: 'production',
        interpretationValue: 'productionFeature',
        checklists: [
            {
                fieldName: 'productionProcessSystem',
                valueIds: [
                    'rawMaterialProcurement',
                    'rawMaterialProcessing',
                    'forming',
                    'drying',
                    'firing',
                    'discard',
                    'localRepertoireCompared'
                ]
            },
            {
                fieldName: 'productionSiteAssociatedFacility',
                valueIds: [
                    'clayPit',
                    'workshop',
                    'dryingArea',
                    'wasteDeposit'
                ]
            }
        ],
        narrativeTemplate: makeFeatureGuidanceNarrativeTemplate([
            '생산유구 관찰:',
            '- 원료/채취 흔적:',
            '- 작업 공간:',
            '- 공정 순서:',
            '- 폐기물/불량품:',
            '- 부속시설:',
            '- 생산품 판단 근거:'
        ])
    }
];

const GUIDANCE_INTERPRETATION_VALUES = new Set(
    KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS
        .map(preset => preset.interpretationValue)
        .filter((value): value is string => value !== undefined)
);

const GUIDANCE_CHECKLIST_FIELD_NAMES = new Set(
    KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS.flatMap(preset =>
        preset.checklists.map(checklist => checklist.fieldName)
    )
);


export function isKoreanFieldworkFeatureGuidanceCategory(categoryName: string|undefined): boolean {

    return !!categoryName && FEATURE_WORKFLOW_CATEGORIES.has(categoryName);
}


export function getKoreanFieldworkActiveFeatureGuidancePreset(
        document: Document|undefined
): KoreanFieldworkFeatureGuidancePreset|undefined {

    if (!document?.resource) return undefined;

    const interpretationValues = getStringArrayResourceValue(document.resource, 'featureInterpretationType');

    return KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS.find(preset =>
        document.resource.featureType === preset.featureType
        || interpretationValues.includes(preset.interpretationValue)
    );
}


export function applyKoreanFieldworkFeatureGuidancePreset(
        document: Document|undefined,
        preset: KoreanFieldworkFeatureGuidancePreset
) {

    if (!document?.resource) return;

    document.resource.featureType = preset.featureType;

    const currentValues = getStringArrayResourceValue(document.resource, 'featureInterpretationType');
    const preservedValues = currentValues.filter(value => !GUIDANCE_INTERPRETATION_VALUES.has(value));
    document.resource.featureInterpretationType = preset.interpretationValue
        ? [...preservedValues, preset.interpretationValue]
        : preservedValues;

    removeInactiveFeatureGuidanceChecklistValues(document.resource, preset);
}


export function getKoreanFieldworkFeatureGuidanceChecklistFields(
        preset: KoreanFieldworkFeatureGuidancePreset|undefined,
        document: Document|undefined,
        fieldDefinitions: Field[]|undefined
): KoreanFieldworkFeatureGuidanceChecklist[] {

    if (!preset || !document?.resource) return [];

    return preset.checklists.filter(checklist =>
        isEditableChecklistField(checklist.fieldName, document, fieldDefinitions)
    );
}


export function getKoreanFieldworkFeatureGuidanceNarrativeTarget(
        document: Document|undefined,
        fieldDefinitions: Field[]|undefined
): KoreanFieldworkFeatureNarrativeTarget|undefined {

    if (!document?.resource) return undefined;

    return NARRATIVE_TARGET_ORDER.find(fieldName =>
        isEditableTextField(fieldName, document, fieldDefinitions)
    );
}


export function getKoreanFieldworkFeatureGuidanceNarrativeValue(
        document: Document,
        preset: KoreanFieldworkFeatureGuidancePreset,
        target: KoreanFieldworkFeatureNarrativeTarget
): string {

    const currentValue = getStringResourceFieldValue(document.resource, target);
    const trimmedCurrentValue = currentValue.trimEnd();

    if (trimmedCurrentValue.length === 0) return preset.narrativeTemplate;
    if (trimmedCurrentValue.includes(preset.narrativeTemplate)) return trimmedCurrentValue;

    return `${trimmedCurrentValue}\n${preset.narrativeTemplate}`;
}


export function getKoreanFieldworkFeatureGuidanceSelectedAttributeLabels(
        document: Document|undefined,
        checklists: readonly KoreanFieldworkFeatureGuidanceChecklist[]
): string[] {

    if (!document?.resource) return [];

    return checklists.flatMap(checklist =>
        getStringArrayResourceValue(document.resource, checklist.fieldName)
            .filter(valueId => checklist.valueIds.includes(valueId))
            .map(getKoreanFieldworkFeatureGuidanceValueLabel)
    );
}


export function getKoreanFieldworkFeatureGuidanceValueLabel(valueId: string): string {

    return FEATURE_GUIDANCE_VALUE_LABELS[valueId] ?? valueId;
}


function isEditableChecklistField(
        fieldName: string,
        document: Document,
        fieldDefinitions: Field[]|undefined
): boolean {

    const field = fieldDefinitions?.find(candidate => candidate.name === fieldName);

    return !!field
        && field.editable === true
        && ['checkboxes', 'valuelistMultiInput'].includes(field.inputType)
        && Condition.isFulfilled(field.condition, document.resource, fieldDefinitions, 'field');
}


function isEditableTextField(
        fieldName: string,
        document: Document,
        fieldDefinitions: Field[]|undefined
): boolean {

    const field = fieldDefinitions?.find(candidate => candidate.name === fieldName);

    return !!field
        && field.editable === true
        && ['input', 'textarea', 'text'].includes(field.inputType)
        && Condition.isFulfilled(field.condition, document.resource, fieldDefinitions, 'field');
}


function getStringArrayResourceValue(resource: Resource, fieldName: string): string[] {

    const value = resource[fieldName];

    return Array.isArray(value)
        ? value.filter(item => typeof item === 'string')
        : [];
}


function getStringResourceFieldValue(resource: Resource, fieldName: string): string {

    const value = resource[fieldName];

    return typeof value === 'string' ? value : '';
}


function removeInactiveFeatureGuidanceChecklistValues(
        resource: Resource,
        preset: KoreanFieldworkFeatureGuidancePreset
) {

    const activeFieldNames = new Set(preset.checklists.map(checklist => checklist.fieldName));

    for (const fieldName of GUIDANCE_CHECKLIST_FIELD_NAMES) {
        if (!activeFieldNames.has(fieldName)) delete resource[fieldName];
    }
}
