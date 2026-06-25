import {
    getKoreanFieldworkDefaultFieldValues,
    isKoreanFieldworkFeatureCategory
} from '../../../src/app/util/korean-fieldwork-draft-defaults';


describe('Korean fieldwork draft defaults', () => {

    it('adds workflow defaults for Korean fieldwork feature geometry drafts', () => {

        const category = createCategory('Feature', [
            field('featureRecordingStatus', 'KoreanFieldwork-featureRecordingStatus'),
            field('featureGeometryEditStatus'),
            field('featureGeometryRevisionHistory'),
            field('featureInvestigationChecklist'),
            field('featureSoilProfilePhotoCount'),
            field('geometrySource'),
            field('geometryConfidence')
        ]);

        expect(isKoreanFieldworkFeatureCategory(category)).toBe(true);
        expect(getKoreanFieldworkDefaultFieldValues(category, { geometryType: 'Polygon' })).toEqual({
            featureRecordingStatus: 'candidate',
            featureGeometryEditStatus: 'roughSketch',
            featureGeometryRevisionHistory: '[]',
            featureInvestigationChecklist: [],
            featureSoilProfilePhotoCount: 0,
            geometrySource: 'tabletSketch',
            geometryConfidence: 'rough'
        });
    });


    it('adds trench, layer, and soil profile photo defaults only for configured fields', () => {

        expect(getKoreanFieldworkDefaultFieldValues(createCategory('Trench', [
            field('recordCreationTiming', 'KoreanFieldwork-recordCreationTiming'),
            field('fieldRecordQuality'),
            field('featureInvestigationChecklist')
        ]))).toEqual({
            featureInvestigationChecklist: [],
            fieldRecordQuality: [],
            recordCreationTiming: 'duringFieldwork'
        });

        expect(getKoreanFieldworkDefaultFieldValues(createCategory('Layer', [
            field('layerSequenceMeaning', 'KoreanFieldwork-layerSequenceMeaning'),
            field('soilColorAssistStatus')
        ]))).toEqual({
            layerSequenceMeaning: 'latestToEarliest',
            soilColorAssistStatus: 'notRun'
        });

        expect(getKoreanFieldworkDefaultFieldValues(createCategory('SoilProfilePhoto', [
            field('layerSequenceMeaning', 'KoreanFieldwork-layerSequenceMeaning'),
            field('soilProfileAnnotationStrokes'),
            field('soilProfileColorSwatches'),
            field('soilColorAssistStatus'),
            field('soilProfilePhotoQuality')
        ]))).toEqual({
            layerSequenceMeaning: 'latestToEarliest',
            soilColorAssistStatus: 'notRun',
            soilProfileAnnotationStrokes: '[]',
            soilProfileColorSwatches: '[]',
            soilProfilePhotoQuality: 0.35
        });
    });


    it('adds tablet-parity defaults for photos, survey boundaries, and pen memos', () => {

        expect(getKoreanFieldworkDefaultFieldValues(createCategory('Photo', [
            field('fieldworkPhotoQuality'),
            field('fieldworkPhotoSizeHintKb'),
            field('mediaEvidenceRole')
        ]))).toEqual({
            fieldworkPhotoQuality: 0.35,
            fieldworkPhotoSizeHintKb: 512,
            mediaEvidenceRole: ['fieldResultRecord']
        });

        expect(getKoreanFieldworkDefaultFieldValues(createCategory('SurveyBoundary', [
            field('shortDescription'),
            field('referenceBasemapProvider'),
            field('surveyBoundaryAccuracy'),
            field('surveyBoundaryNote'),
            field('surveyBoundarySource'),
            field('surveyBoundaryType', 'KoreanFieldwork-surveyBoundaryType')
        ]), {
            boundarySummary: '  1구역 북쪽 능선부터 남쪽 농로까지  '
        })).toEqual({
            shortDescription: '1구역 북쪽 능선부터 남쪽 농로까지',
            referenceBasemapProvider: 'none',
            surveyBoundaryAccuracy: 'visualReference',
            surveyBoundaryNote: '1구역 북쪽 능선부터 남쪽 농로까지',
            surveyBoundarySource: 'manualBasemapTrace',
            surveyBoundaryType: 'operationBoundary'
        });

        expect(getKoreanFieldworkDefaultFieldValues(createCategory('PenMemo', [
            field('penMemoStrokes'),
            field('penMemoTranscriptionStatus')
        ]))).toEqual({
            penMemoStrokes: '[]',
            penMemoTranscriptionStatus: 'pending'
        });
    });


    it('does not add defaults for non-Korean categories', () => {

        expect(getKoreanFieldworkDefaultFieldValues(createCategory('Layer', [
            field('layerSequenceMeaning', 'SomeOther-layerSequenceMeaning'),
            field('soilColorAssistStatus')
        ]))).toEqual({});
    });


    it('can seed imported survey boundary defaults for desktop file-import flows', () => {

        expect(getKoreanFieldworkDefaultFieldValues(createCategory('SurveyBoundary', [
            field('shortDescription'),
            field('referenceBasemapProvider'),
            field('surveyBoundaryAccuracy'),
            field('surveyBoundaryNote'),
            field('surveyBoundarySource'),
            field('surveyBoundaryType', 'KoreanFieldwork-surveyBoundaryType')
        ]), {
            boundaryAccuracy: 'importedReference',
            boundarySource: 'shpImport',
            boundarySummary: '  SHP 가져오기 경계  ',
            referenceBasemapProvider: 'importedVectorLayer'
        })).toEqual({
            shortDescription: 'SHP 가져오기 경계',
            referenceBasemapProvider: 'importedVectorLayer',
            surveyBoundaryAccuracy: 'importedReference',
            surveyBoundaryNote: 'SHP 가져오기 경계',
            surveyBoundarySource: 'shpImport',
            surveyBoundaryType: 'operationBoundary'
        });
    });
});


const createCategory = (name: string, fields: any[]) => ({
    name,
    groups: [{
        fields,
        name: 'koreanFieldwork'
    }]
} as any);


const field = (name: string, valuelistId?: string) => ({
    name,
    ...(valuelistId ? { valuelist: { id: valuelistId } } : {})
});
