import {
    KoreanFieldworkFeatureGuidancePanelComponent
} from '../../../../../src/app/components/docedit/core/korean-fieldwork-feature-guidance-panel.component';
import * as fs from 'fs';
import * as path from 'path';


describe('KoreanFieldworkFeatureGuidancePanelComponent', () => {

    let component: KoreanFieldworkFeatureGuidancePanelComponent;


    beforeEach(() => {

        component = new KoreanFieldworkFeatureGuidancePanelComponent(
            { get: async () => ({}) } as any,
            {
                get: (field: any) => field.label ?? field.name,
                getValueLabel: (_: any, valueId: string) => valueId,
                orderKeysByLabels: (valuelist: any) => Object.keys(valuelist.values)
            } as any
        );
        component.document = {
            resource: {
                category: 'Feature',
                relations: {},
                featureInterpretationType: ['kiln']
            }
        } as any;
        component.fieldDefinitions = [
            {
                name: 'featureInterpretationType',
                editable: true,
                inputType: 'checkboxes'
            },
            {
                name: 'period',
                editable: true,
                inputType: 'dropdown',
                label: '시대/시기'
            },
            {
                name: 'potteryKilnPartInvestigation',
                editable: true,
                inputType: 'checkboxes',
                label: '가마 부위'
            },
            {
                name: 'description',
                editable: true,
                inputType: 'text',
                label: '서술'
            }
        ] as any;
        (component as any).valuelists = {
            period: {
                values: {
                    bronzeAge: {},
                    threeKingdoms: {}
                }
            },
            potteryKilnPartInvestigation: {
                values: {
                    combustionPartRecorded: {},
                    firingPartRecorded: {},
                    fluePartRecorded: {}
                }
            }
        };
    });


    it('shows kiln-specific checklist values for kiln features', () => {

        expect(component.shouldShow()).toBe(true);

        expect(component.getCoreAttributeTitle(component.getActivePreset()!)).toBe('가마 핵심 속성');

        const [checklist] = component.getGuidedChecklistFields();

        expect(checklist.fieldName).toBe('potteryKilnPartInvestigation');
        expect(component.getSuggestedValueIds(checklist)).toEqual([
            'combustionPartRecorded',
            'firingPartRecorded',
            'fluePartRecorded'
        ]);
    });


    it('toggles guided checklist values', () => {

        component.toggleChecklistValue('potteryKilnPartInvestigation', 'combustionPartRecorded');
        component.toggleChecklistValue('potteryKilnPartInvestigation', 'firingPartRecorded');

        expect(component.document.resource.potteryKilnPartInvestigation).toEqual([
            'combustionPartRecorded',
            'firingPartRecorded'
        ]);
        expect(component.isChecklistValueActive(
            'potteryKilnPartInvestigation',
            'firingPartRecorded'
        )).toBe(true);

        component.toggleChecklistValue('potteryKilnPartInvestigation', 'combustionPartRecorded');

        expect(component.document.resource.potteryKilnPartInvestigation).toEqual(['firingPartRecorded']);
    });


    it('sets period values inside the feature guidance flow', () => {

        expect(component.canRenderPeriodField()).toBe(true);
        expect(component.getChoiceValueIds(component.getPeriodFieldName())).toEqual([
            'bronzeAge',
            'threeKingdoms'
        ]);

        component.toggleChoiceValue(component.getPeriodFieldName(), 'threeKingdoms');

        expect(component.document.resource.period).toBe('threeKingdoms');
        expect(component.isChoiceValueActive(component.getPeriodFieldName(), 'threeKingdoms')).toBe(true);
    });


    it('keeps period, feature type, and core attributes in field recording order', () => {

        const template = fs.readFileSync(
            path.resolve(
                __dirname,
                '../../../../../src/app/components/docedit/core/korean-fieldwork-feature-guidance-panel.html'
            ),
            'utf8'
        );
        const periodIndex = template.indexOf('getPeriodFieldName()');
        const featureTypeIndex = template.indexOf('canSelectFeatureType()', periodIndex);
        const coreAttributeIndex = template.indexOf('getCoreAttributeTitle');

        expect(periodIndex).toBeGreaterThanOrEqual(0);
        expect(featureTypeIndex).toBeGreaterThan(periodIndex);
        expect(coreAttributeIndex).toBeGreaterThan(featureTypeIndex);
    });


    it('selects one primary feature guidance preset while preserving non-guidance interpretations', () => {

        component.document.resource.featureInterpretationType = ['pitFeature', 'other'];

        component.selectPreset(component.presets.find(preset => preset.id === 'kiln')!);

        expect(component.document.resource.featureType).toBe('kiln');
        expect(component.document.resource.featureInterpretationType).toEqual(['other', 'kiln']);
        expect(component.getCoreAttributeTitle(component.getActivePreset()!)).toBe('가마 핵심 속성');
    });


    it('appends the active preset narrative template without duplicating it', () => {

        component.applyNarrativeTemplate();
        component.applyNarrativeTemplate();

        expect(component.document.resource.description).toContain('가마 구조 관찰:');
        expect(component.document.resource.description.match(/연소부/g)).toHaveLength(1);
    });


    it('updates the feature observation note directly from the guidance panel', () => {

        component.updateNarrativeTargetValue('연소부 동측 벽면에 소결 흔적 확인.');

        expect(component.getNarrativeTargetValue()).toBe('연소부 동측 벽면에 소결 흔적 확인.');
        expect(component.document.resource.description).toBe('연소부 동측 벽면에 소결 흔적 확인.');
    });


    it('shows the selected feature type template as the observation placeholder', () => {

        expect(component.getNarrativePlaceholder()).toContain('가마 구조 관찰:');
        expect(component.getNarrativePlaceholder()).toContain('- 연소부:');
        expect(component.getNarrativePlaceholder()).toContain('- 소성부:');
        expect(component.getNarrativePlaceholder()).toContain('- 연도부:');
    });
});
