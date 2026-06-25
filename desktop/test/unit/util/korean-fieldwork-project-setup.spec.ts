import {
    createKoreanFieldworkProjectSetupResourceUpdates,
    getKoreanFieldworkInvestigationModeLabel,
    getKoreanFieldworkProjectSetupDefaultsFromDocument,
    getKoreanFieldworkProjectResourceValue,
    hasKoreanFieldworkProjectFields,
    isKoreanFieldworkProject
} from '../../../src/app/util/korean-fieldwork-project-setup';


describe('korean-fieldwork-project-setup', () => {

    it('recognizes Korean fieldwork projects from project category fields', () => {

        expect(isKoreanFieldworkProject(createProjectDocument({}), createProjectConfiguration())).toBe(true);
        expect(hasKoreanFieldworkProjectFields(createProjectConfiguration())).toBe(true);
    });


    it('recognizes Korean fieldwork projects from stored setup values', () => {

        const projectDocument = createProjectDocument({
            projectInvestigationMode: 'excavation'
        });

        expect(isKoreanFieldworkProject(projectDocument, createProjectConfiguration(false))).toBe(true);
    });


    it('ignores blank project setup values', () => {

        const projectDocument = createProjectDocument({
            projectInvestigationMode: '  ',
            projectBoundarySummary: ''
        });

        expect(isKoreanFieldworkProject(projectDocument, createProjectConfiguration(false))).toBe(false);
        expect(getKoreanFieldworkProjectResourceValue(projectDocument as any, 'projectInvestigationMode'))
            .toBeUndefined();
    });


    it('provides readable investigation mode labels', () => {

        expect(getKoreanFieldworkInvestigationModeLabel('trialTrench')).toBe('표본·시굴조사');
        expect(getKoreanFieldworkInvestigationModeLabel('unknownMode')).toBe('unknownMode');
    });
    it('loads tablet-synced setup defaults from the project document', () => {

        expect(getKoreanFieldworkProjectSetupDefaultsFromDocument(createProjectDocument({
            projectInvestigationMode: 'excavation',
            projectBoundarySummary: '  Area 1 boundary  '
        }) as any)).toEqual({
            investigationModeId: 'excavation',
            boundarySummary: 'Area 1 boundary'
        });
    });


    it('ignores invalid project document mode values while keeping boundary defaults', () => {

        expect(getKoreanFieldworkProjectSetupDefaultsFromDocument(createProjectDocument({
            projectInvestigationMode: 'bad-mode',
            projectBoundarySummary: 'Area 1 boundary'
        }) as any)).toEqual({
            investigationModeId: undefined,
            boundarySummary: 'Area 1 boundary'
        });
    });


    it('builds partial tablet-sync project document updates', () => {

        expect(createKoreanFieldworkProjectSetupResourceUpdates({
            investigationModeId: 'surfaceSurvey'
        })).toEqual({
            projectInvestigationMode: 'surfaceSurvey'
        });
        expect(createKoreanFieldworkProjectSetupResourceUpdates({
            boundarySummary: '  Area 2 boundary  '
        })).toEqual({
            projectBoundarySetupState: 'draftBoundary',
            projectBoundarySummary: 'Area 2 boundary',
            shortDescription: 'Area 2 boundary'
        });
    });
});


const createProjectConfiguration = (withKoreanFields: boolean = true) => ({
    getCategory: (categoryName: string) => {
        if (categoryName !== 'Project') return undefined;

        return {
            groups: [
                {
                    name: 'stem',
                    fields: withKoreanFields
                        ? [
                            { name: 'projectInvestigationMode' },
                            { name: 'projectBoundarySummary' }
                        ]
                        : []
                }
            ]
        };
    }
});


const createProjectDocument = (fields: { [fieldName: string]: unknown }) => ({
    resource: {
        id: 'project',
        identifier: 'fieldwork-1',
        category: 'Project',
        relations: {},
        ...fields
    }
});
