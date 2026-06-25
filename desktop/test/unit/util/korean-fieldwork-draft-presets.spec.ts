import {
    CategoryForm,
    NewResource
} from 'idai-field-core';
import {
    getKoreanFieldworkDraftPresets
} from '../../../src/app/util/korean-fieldwork-draft-presets';


describe('korean-fieldwork-draft-presets', () => {

    it('offers feature-specific presets with only fields present on the form', () => {

        const presets = getKoreanFieldworkDraftPresets(
            createCategoryForm([
                'featureRecordingStatus',
                'featureInvestigationChecklist'
            ]),
            createResource('Feature')
        );
        const candidatePreset = presets.find(preset => preset.id === 'feature-candidate');

        expect(candidatePreset?.updates).toEqual({
            featureRecordingStatus: 'candidate',
            featureInvestigationChecklist: ['preInvestigationPhotoTaken']
        });
        expect(candidatePreset?.fieldNames).toEqual([
            'featureRecordingStatus',
            'featureInvestigationChecklist'
        ]);
    });


    it('keeps feature presets away from operation records', () => {

        const presets = getKoreanFieldworkDraftPresets(
            createCategoryForm([
                'recordCreationTiming',
                'fieldRecordQuality'
            ]),
            createResource('Operation')
        );

        expect(presets.map(preset => preset.id)).toEqual([
            'field-start',
            'needs-review'
        ]);
    });


    it('hides presets when no preset field exists on the category form', () => {

        expect(getKoreanFieldworkDraftPresets(
            createCategoryForm(['shortDescription']),
            createResource('Trench')
        )).toEqual([]);
    });
});


const createCategoryForm = (fieldNames: string[]): CategoryForm => ({
    groups: [
        {
            name: 'fieldwork',
            fields: fieldNames.map(name => ({ name }))
        }
    ]
} as CategoryForm);


const createResource = (category: string): NewResource => ({
    identifier: `${category}-1`,
    category,
    relations: {}
});
