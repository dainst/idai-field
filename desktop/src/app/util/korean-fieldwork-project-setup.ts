import { CategoryForm, Document, ProjectConfiguration } from 'idai-field-core';


export interface KoreanFieldworkInvestigationModeOption {
    value: string;
    label: string;
    detail: string;
}

export interface KoreanFieldworkProjectSetupDefaults {
    boundarySummary?: string;
    investigationModeId?: string;
}

export const KOREAN_FIELDWORK_DEFAULT_INVESTIGATION_MODE = 'trialTrench';
export const KOREAN_FIELDWORK_PROJECT_INVESTIGATION_MODE_FIELD = 'projectInvestigationMode';
export const KOREAN_FIELDWORK_PROJECT_BOUNDARY_SUMMARY_FIELD = 'projectBoundarySummary';

export const KOREAN_FIELDWORK_INVESTIGATION_MODES: KoreanFieldworkInvestigationModeOption[] = [
    {
        value: 'trialTrench',
        label: '표본·시굴조사',
        detail: '트렌치 단위로 토층과 유구 확인 과정을 기록'
    },
    {
        value: 'excavation',
        label: '발굴조사',
        detail: '제토 뒤 확인한 유구를 조사 단계별로 기록'
    },
    {
        value: 'surfaceSurvey',
        label: '지표조사',
        detail: '조사 범위와 지표에서 보이는 자료를 빠르게 기록'
    },
    {
        value: 'watchingBrief',
        label: '참관·입회조사',
        detail: '공사·입회 현장에서 확인한 변동 사항을 남김'
    }
];

export function getKoreanFieldworkInvestigationModeLabel(modeId: string|undefined): string {

    return getKoreanFieldworkInvestigationModeOption(modeId)?.label
        ?? modeId
        ?? '';
}


export function getKoreanFieldworkInvestigationModeOption(
        modeId: unknown): KoreanFieldworkInvestigationModeOption|undefined {

    return typeof modeId === 'string'
        ? KOREAN_FIELDWORK_INVESTIGATION_MODES.find(mode => mode.value === modeId)
        : undefined;
}

export function isKoreanFieldworkProjectSetupFilledIn(modeId: string|undefined,
                                                      boundarySummary: string|undefined): boolean {

    return !!modeId?.trim() && !!boundarySummary?.trim();
}

export function isKoreanFieldworkProject(projectDocument: Document|undefined,
                                         projectConfiguration: ProjectConfiguration): boolean {

    return hasKoreanFieldworkProjectFields(projectConfiguration)
        || !!getKoreanFieldworkProjectResourceValue(projectDocument, KOREAN_FIELDWORK_PROJECT_INVESTIGATION_MODE_FIELD)
        || !!getKoreanFieldworkProjectResourceValue(projectDocument, KOREAN_FIELDWORK_PROJECT_BOUNDARY_SUMMARY_FIELD);
}

export function hasKoreanFieldworkProjectFields(projectConfiguration: ProjectConfiguration): boolean {

    try {
        const projectCategory = projectConfiguration.getCategory('Project');

        return !!CategoryForm.getField(projectCategory, KOREAN_FIELDWORK_PROJECT_INVESTIGATION_MODE_FIELD)
            && !!CategoryForm.getField(projectCategory, KOREAN_FIELDWORK_PROJECT_BOUNDARY_SUMMARY_FIELD);
    } catch (err) {
        return false;
    }
}

export function getKoreanFieldworkProjectResourceValue(projectDocument: Document|undefined,
                                                       fieldName: string): string|undefined {

    const value = (projectDocument?.resource as any)?.[fieldName];
    const normalizedValue = typeof value === 'string'
        ? value.trim()
        : undefined;

    return normalizedValue && normalizedValue.length > 0
        ? normalizedValue
        : undefined;
}


export function getKoreanFieldworkProjectSetupDefaultsFromDocument(
        projectDocument: Document|undefined): KoreanFieldworkProjectSetupDefaults {

    const boundarySummary = getKoreanFieldworkProjectResourceValue(
        projectDocument,
        KOREAN_FIELDWORK_PROJECT_BOUNDARY_SUMMARY_FIELD
    );
    const investigationModeId = getKoreanFieldworkInvestigationModeOption(
        (projectDocument?.resource as any)?.[KOREAN_FIELDWORK_PROJECT_INVESTIGATION_MODE_FIELD]
    )?.value;

    return {
        boundarySummary,
        investigationModeId
    };
}


export function createKoreanFieldworkProjectSetupResourceUpdates(
        defaults: KoreanFieldworkProjectSetupDefaults|string,
        boundarySummary?: string) {

    const setupDefaults = typeof defaults === 'string'
        ? {
            investigationModeId: defaults,
            boundarySummary
        }
        : defaults;
    const normalizedBoundarySummary = setupDefaults.boundarySummary?.trim();
    const updates: { [fieldName: string]: string } = {};

    if (getKoreanFieldworkInvestigationModeOption(setupDefaults.investigationModeId)) {
        updates.projectInvestigationMode = setupDefaults.investigationModeId as string;
    }

    if (normalizedBoundarySummary) {
        updates.projectBoundarySetupState = 'draftBoundary';
        updates.projectBoundarySummary = normalizedBoundarySummary;
        updates.shortDescription = normalizedBoundarySummary;
    }

    return updates;
}
