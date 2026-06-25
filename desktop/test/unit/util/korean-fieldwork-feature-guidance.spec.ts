import {
    applyKoreanFieldworkFeatureGuidancePreset,
    getKoreanFieldworkActiveFeatureGuidancePreset,
    getKoreanFieldworkFeatureGuidanceChecklistFields,
    getKoreanFieldworkFeatureGuidanceNarrativeTarget,
    getKoreanFieldworkFeatureGuidanceNarrativeValue,
    getKoreanFieldworkFeatureGuidanceSelectedAttributeLabels,
    getKoreanFieldworkFeatureGuidanceValueLabel,
    KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS
} from '../../../src/app/util/korean-fieldwork-feature-guidance';

const config = require('../../../../core/config/Config-KoreanFieldwork.json');
const valuelists = require('../../../../core/config/Library/Valuelists/Valuelists.json');


describe('korean-fieldwork-feature-guidance', () => {

    it('finds the active preset from feature interpretation values', () => {

        const preset = getKoreanFieldworkActiveFeatureGuidancePreset(createDocument({
            featureInterpretationType: ['kiln']
        }) as any);

        expect(preset?.id).toBe('kiln');
    });


    it('replaces the primary guided interpretation while preserving other interpretations', () => {

        const document = createDocument({
            featureInterpretationType: ['pitFeature', 'other']
        });
        const kilnPreset = KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS.find(preset => preset.id === 'kiln')!;

        applyKoreanFieldworkFeatureGuidancePreset(document as any, kilnPreset);

        expect(document.resource.featureType).toBe('kiln');
        expect(document.resource.featureInterpretationType).toEqual(['other', 'kiln']);
    });


    it('clears guided interpretation values when the feature type is set back to unknown', () => {

        const document = createDocument({
            featureType: 'kiln',
            featureInterpretationType: ['kiln', 'other']
        });
        const unknownPreset = KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS.find(preset => preset.id === 'unknown')!;

        applyKoreanFieldworkFeatureGuidancePreset(document as any, unknownPreset);

        expect(document.resource.featureType).toBe('unknown');
        expect(document.resource.featureInterpretationType).toEqual(['other']);
    });


    it('keeps unknown feature narratives tied to sketches and rough measurements', () => {

        const unknownPreset = KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS.find(preset => preset.id === 'unknown')!;

        expect(unknownPreset.narrativeTemplate).toContain('- 스케치/약측 기준:');
        expect(unknownPreset.narrativeTemplate).toContain('- 사진/도면 번호:');
    });


    it('keeps every feature narrative tied to sketches, rough measurements, and drawing numbers', () => {

        for (const preset of KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS) {
            expect(preset.narrativeTemplate).toContain('- 스케치/약측 기준:');
            expect(preset.narrativeTemplate).toContain('- 사진/도면 번호:');
        }
    });


    it('clears stale feature-specific attributes when changing the feature type', () => {

        const document = createDocument({
            featureType: 'kiln',
            featureInterpretationType: ['kiln', 'other'],
            potteryKilnPartInvestigation: ['combustionPartRecorded'],
            potteryKilnStructureContext: ['planShapeRecorded'],
            firstExposureRecord: ['featureLineVisible'],
            featureInvestigationChecklist: ['preInvestigationPhotoTaken']
        });
        const pitPreset = KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS.find(preset => preset.id === 'pit')!;

        applyKoreanFieldworkFeatureGuidancePreset(document as any, pitPreset);

        expect(document.resource.featureType).toBe('pit');
        expect(document.resource.featureInterpretationType).toEqual(['other', 'pitFeature']);
        expect(document.resource.potteryKilnPartInvestigation).toBeUndefined();
        expect(document.resource.potteryKilnStructureContext).toBeUndefined();
        expect(document.resource.firstExposureRecord).toEqual(['featureLineVisible']);
        expect(document.resource.featureInvestigationChecklist).toEqual(['preInvestigationPhotoTaken']);
    });


    it('clears all feature-specific attributes when the feature type is unknown', () => {

        const document = createDocument({
            featureType: 'kiln',
            featureInterpretationType: ['kiln'],
            potteryKilnPartInvestigation: ['combustionPartRecorded'],
            firstExposureRecord: ['featureLineVisible']
        });
        const unknownPreset = KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS.find(preset => preset.id === 'unknown')!;

        applyKoreanFieldworkFeatureGuidancePreset(document as any, unknownPreset);

        expect(document.resource.potteryKilnPartInvestigation).toBeUndefined();
        expect(document.resource.firstExposureRecord).toBeUndefined();
    });


    it('returns editable checklist fields for the active feature preset', () => {

        const kilnPreset = KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS.find(preset => preset.id === 'kiln')!;
        const checklists = getKoreanFieldworkFeatureGuidanceChecklistFields(
            kilnPreset,
            createDocument({ featureInterpretationType: ['kiln'] }) as any,
            [
                field('potteryKilnPartInvestigation', 'checkboxes'),
                field('potteryKilnStructureContext', 'checkboxes'),
                field('potteryKilnIdentification', 'dropdown')
            ] as any
        );

        expect(checklists.map(checklist => checklist.fieldName)).toEqual([
            'potteryKilnPartInvestigation',
            'potteryKilnStructureContext'
        ]);
    });


    it('keeps linear feature presets connected to guided attributes', () => {

        const ditchPreset = KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS.find(preset => preset.id === 'ditch')!;
        const checklists = getKoreanFieldworkFeatureGuidanceChecklistFields(
            ditchPreset,
            createDocument({ featureType: 'ditch' }) as any,
            [field('firstExposureRecord', 'checkboxes')] as any
        );

        expect(checklists.map(checklist => checklist.fieldName)).toEqual(['firstExposureRecord']);
        expect(checklists[0].valueIds).toContain('sectionCrossCheck');
    });


    it('summarizes selected feature-specific attributes with fieldwork labels', () => {

        const kilnPreset = KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS.find(preset => preset.id === 'kiln')!;
        const labels = getKoreanFieldworkFeatureGuidanceSelectedAttributeLabels(
            createDocument({
                featureType: 'kiln',
                potteryKilnPartInvestigation: ['combustionPartRecorded', 'firingPartRecorded'],
                potteryKilnStructureContext: ['planShapeRecorded'],
                firstExposureRecord: ['featureLineVisible']
            }) as any,
            kilnPreset.checklists
        );

        expect(labels).toEqual(['연소부', '소성부', '평면형']);
        expect(getKoreanFieldworkFeatureGuidanceValueLabel('unknownValue')).toBe('unknownValue');
    });


    it('chooses an editable narrative target and avoids duplicate templates', () => {

        const document = createDocument({ description: '기존 관찰.' });
        const kilnPreset = KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS.find(preset => preset.id === 'kiln')!;
        const target = getKoreanFieldworkFeatureGuidanceNarrativeTarget(
            document as any,
            [field('description', 'text')] as any
        );

        const once = getKoreanFieldworkFeatureGuidanceNarrativeValue(document as any, kilnPreset, target!);
        document.resource.description = once;
        const twice = getKoreanFieldworkFeatureGuidanceNarrativeValue(document as any, kilnPreset, target!);

        expect(target).toBe('description');
        expect(once).toContain('가마 구조 관찰:');
        expect(twice).toBe(once);
    });


    it('uses checklist values that exist in the Korean fieldwork configuration', () => {

        const fieldToValuelist = (config as any).forms['Feature:default'].valuelists;

        for (const preset of KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS) {
            for (const checklist of preset.checklists) {
                const valuelistId = fieldToValuelist[checklist.fieldName];
                const configuredValues = (valuelists as any)[valuelistId]?.values ?? {};

                expect(valuelistId).toBeDefined();
                expect(checklist.valueIds.length).toBeGreaterThan(0);
                for (const valueId of checklist.valueIds) {
                    expect(configuredValues[valueId]).toBeDefined();
                }
            }
        }
    });
});


const createDocument = (resource: any = {}) => ({
    resource: {
        id: 'feature-1',
        identifier: 'feature-1',
        category: 'Feature',
        relations: {},
        ...resource
    }
});


const field = (name: string, inputType: string = 'text', editable: boolean = true) => ({
    name,
    inputType,
    editable
});
