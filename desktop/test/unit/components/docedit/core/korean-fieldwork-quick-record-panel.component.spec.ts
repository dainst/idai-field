import {
    KoreanFieldworkQuickRecordPanelComponent
} from '../../../../../src/app/components/docedit/core/korean-fieldwork-quick-record-panel.component';


describe('KoreanFieldworkQuickRecordPanelComponent', () => {

    let component: KoreanFieldworkQuickRecordPanelComponent;


    beforeEach(() => {

        component = new KoreanFieldworkQuickRecordPanelComponent(
            {} as any,
            {
                get: (field: any) => field.label ?? field.name,
                getValueLabel: (_: any, valueId: string) => valueId,
                orderKeysByLabels: (valuelist: any) => Object.keys(valuelist.values)
            } as any
        );
        component.document = { resource: { category: 'Feature' } } as any;
        component.fieldDefinitions = [
            {
                name: 'featureInvestigationChecklist',
                editable: true,
                inputType: 'checkboxes'
            },
            {
                name: 'featureRecordingStatus',
                editable: true,
                inputType: 'dropdown'
            }
        ] as any;
        (component as any).valuelists = {
            featureInvestigationChecklist: {
                values: {
                    preInvestigationPhotoTaken: {},
                    soilProfilePhotoLinked: {}
                }
            },
            featureRecordingStatus: {
                values: {
                    candidate: {},
                    investigating: {}
                }
            }
        };
    });


    it('toggles checkbox values as string arrays', () => {

        component.toggleValue('featureInvestigationChecklist', 'preInvestigationPhotoTaken');
        component.toggleValue('featureInvestigationChecklist', 'soilProfilePhotoLinked');

        expect(component.document.resource.featureInvestigationChecklist).toEqual([
            'preInvestigationPhotoTaken',
            'soilProfilePhotoLinked'
        ]);
        expect(component.isActive('featureInvestigationChecklist', 'soilProfilePhotoLinked')).toBe(true);

        component.toggleValue('featureInvestigationChecklist', 'preInvestigationPhotoTaken');

        expect(component.document.resource.featureInvestigationChecklist).toEqual(['soilProfilePhotoLinked']);
    });


    it('sets and clears single-value fields', () => {

        component.toggleValue('featureRecordingStatus', 'candidate');
        expect(component.document.resource.featureRecordingStatus).toBe('candidate');
        expect(component.isActive('featureRecordingStatus', 'candidate')).toBe(true);

        component.toggleValue('featureRecordingStatus', 'candidate');
        expect(component.document.resource.featureRecordingStatus).toBeUndefined();
    });


    it('uses field-facing labels instead of raw configuration labels', () => {

        expect(component.getFieldLabel('featureRecordingStatus')).toBe('유구 진행');
        expect(component.getFieldLabel('featureInvestigationChecklist')).toBe('조사 단계 확인');
    });


    it('keeps period and feature type out of the minimum record flow', () => {

        expect(component.primaryFieldNames).toEqual([
            'featureRecordingStatus',
            'featureInvestigationChecklist'
        ]);
    });
});
