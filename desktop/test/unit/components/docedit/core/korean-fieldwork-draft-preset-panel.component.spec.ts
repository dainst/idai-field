import {
    KoreanFieldworkDraftPresetPanelComponent
} from '../../../../../src/app/components/docedit/core/korean-fieldwork-draft-preset-panel.component';


describe('KoreanFieldworkDraftPresetPanelComponent', () => {

    it('offers and applies feature draft presets', () => {

        const component = createComponent();
        const onChanged = jest.fn();
        component.onChanged.subscribe(onChanged);
        component.document = {
            resource: {
                category: 'Feature',
                relations: {}
            }
        } as any;
        component.fieldDefinitions = [
            { name: 'featureRecordingStatus' },
            { name: 'featureInvestigationChecklist' },
            { name: 'recordCreationTiming' },
            { name: 'fieldRecordQuality' }
        ] as any;

        component.ngOnChanges();

        expect(component.shouldShow()).toBe(true);
        expect(component.getPresets().map(preset => preset.id)).toEqual([
            'field-start',
            'needs-review',
            'feature-candidate',
            'feature-investigation',
            'feature-closeout'
        ]);

        component.applyPreset(component.getPresets().find(preset =>
            preset.id === 'feature-investigation'
        )!);

        expect(component.document.resource).toMatchObject({
            featureRecordingStatus: 'investigating',
            recordCreationTiming: 'duringFieldwork',
            fieldRecordQuality: ['immediateRecording'],
            featureInvestigationChecklist: [
                'preInvestigationPhotoTaken',
                'inProgressPhotoTaken'
            ]
        });
        expect(onChanged).toHaveBeenCalled();
    });


    it('copies array values when presets are applied', () => {

        const component = createComponent();
        component.document = {
            resource: {
                category: 'Feature',
                relations: {}
            }
        } as any;
        component.fieldDefinitions = [
            { name: 'featureInvestigationChecklist' }
        ] as any;

        component.ngOnChanges();
        const preset = component.getPresets().find(entry => entry.id === 'feature-closeout')!;
        component.applyPreset(preset);
        component.document.resource.featureInvestigationChecklist.push('customStep');

        expect(preset.updates.featureInvestigationChecklist).toEqual([
            'measuredDrawingCompleted',
            'findsRecovered',
            'completionPhotoTaken'
        ]);
    });


    it('stays hidden when the current form has no preset fields', () => {

        const component = createComponent();
        component.document = {
            resource: {
                category: 'Feature',
                relations: {}
            }
        } as any;
        component.fieldDefinitions = [
            { name: 'shortDescription' }
        ] as any;

        component.ngOnChanges();

        expect(component.shouldShow()).toBe(false);
        expect(component.getPresets()).toEqual([]);
    });
});


const createComponent = () => new KoreanFieldworkDraftPresetPanelComponent({
    getCategory: (categoryName: string) => ({
        name: categoryName,
        groups: [
            {
                name: 'fieldwork',
                fields: [
                    { name: 'featureRecordingStatus' },
                    { name: 'featureInvestigationChecklist' },
                    { name: 'recordCreationTiming' },
                    { name: 'fieldRecordQuality' },
                    { name: 'verificationState' }
                ]
            }
        ]
    })
} as any);
