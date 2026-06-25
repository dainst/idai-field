import {
    KoreanFieldworkSoilColorPanelComponent
} from '../../../../../src/app/components/docedit/core/korean-fieldwork-soil-color-panel.component';
import * as fs from 'fs';
import * as path from 'path';


describe('KoreanFieldworkSoilColorPanelComponent', () => {

    let component: KoreanFieldworkSoilColorPanelComponent;


    beforeEach(() => {

        component = new KoreanFieldworkSoilColorPanelComponent();
    });

    it('uses Korean field-facing soil color labels', () => {

        const template = fs.readFileSync(
            path.resolve(
                __dirname,
                '../../../../../src/app/components/docedit/core/korean-fieldwork-soil-color-panel.html'
            ),
            'utf8'
        );

        expect(template).toContain('먼셀값');
        expect(template).not.toContain('Munsell 값');
        expect(template).toContain('사진 판독 후보');
        expect(template).toContain('사진에서 읽은 먼셀 후보');
        expect(template).toContain('토색 메모');
        expect(template).toContain('보정판 위치');
        expect(template).not.toContain('보정표');
    });


    it('records manual layer Munsell values and marks assist status as manually recorded', () => {

        component.document = { resource: { category: 'Layer' } } as any;
        component.fieldDefinitions = [
            { name: 'soilColorMunsellManual', editable: true },
            { name: 'soilColorAssistStatus', editable: true }
        ] as any;

        component.setLayerMunsell('10YR 4/3');

        expect(component.document.resource.soilColorMunsellManual).toBe('10YR 4/3');
        expect(component.document.resource.soilColorAssistStatus).toBe('manualRecorded');
    });


    it('resets layer assist status when a manual Munsell value is cleared', () => {

        const emittedStates: Array<Record<string, unknown>> = [];
        component.document = {
            resource: {
                category: 'Layer',
                soilColorMunsellManual: '10YR 4/3',
                soilColorAssistStatus: 'manualRecorded'
            }
        } as any;
        component.fieldDefinitions = [
            { name: 'soilColorMunsellManual', editable: true },
            { name: 'soilColorAssistStatus', editable: true }
        ] as any;
        component.onChanged.subscribe(() => emittedStates.push({ ...component.document.resource }));

        component.setLayerMunsell('');

        expect(component.document.resource.soilColorMunsellManual).toBeUndefined();
        expect(component.document.resource.soilColorAssistStatus).toBe('notRun');
        expect(emittedStates).toEqual([
            {
                category: 'Layer',
                soilColorAssistStatus: 'notRun'
            }
        ]);
    });


    it('appends numbered Munsell swatches for soil profile photos', () => {

        component.document = {
            resource: {
                category: 'SoilProfilePhoto',
                soilProfileColorSwatches: '1: 10YR 4/3'
            }
        } as any;
        component.fieldDefinitions = [
            { name: 'soilProfileColorSwatches', editable: true }
        ] as any;

        component.applyMunsellPreset('10YR 3/2');

        expect(component.document.resource.soilProfileColorSwatches).toBe('1: 10YR 4/3\n2: 10YR 3/2');
    });


    it('accepts photo-derived candidates for soil profile photos', () => {

        component.document = {
            resource: {
                category: 'SoilProfilePhoto',
                soilColorAssistCandidates: '사진 중앙부 평균 RGB 111/87/61\n1: 10YR 4/3 (보통, 차이 0.0)'
            }
        } as any;
        component.fieldDefinitions = [
            { name: 'soilProfileColorSwatches', editable: true },
            { name: 'soilColorAssistCandidates', editable: true },
            { name: 'soilColorAssistStatus', editable: true }
        ] as any;

        expect(component.getAssistCandidateOptions()).toEqual(['10YR 4/3']);

        component.applyAssistCandidate('10YR 4/3');

        expect(component.document.resource.soilProfileColorSwatches).toBe('1: 10YR 4/3');
        expect(component.document.resource.soilColorAssistStatus).toBe('reviewed');
    });


    it('uses the shared Munsell candidate parser for desktop review chips', () => {

        component.document = {
            resource: {
                category: 'SoilProfilePhoto',
                soilColorAssistCandidates: [
                    '1: 10YR 4/3 (높음)',
                    '2: GLEY 1 5/N (낮음)',
                    '3: 10YR 4/3 (중복)'
                ].join('\n')
            }
        } as any;
        component.fieldDefinitions = [
            { name: 'soilProfileColorSwatches', editable: true },
            { name: 'soilColorAssistCandidates', editable: true }
        ] as any;

        expect(component.getAssistCandidateOptions()).toEqual(['10YR 4/3', 'GLEY 1 5/N']);
    });


    it('emits reviewed status together with an accepted photo-derived candidate', () => {

        const emittedStates: Array<Record<string, unknown>> = [];
        component.document = {
            resource: {
                category: 'SoilProfilePhoto',
                soilColorAssistCandidates: '1: 10YR 4/3 (보통, 차이 0.0)'
            }
        } as any;
        component.fieldDefinitions = [
            { name: 'soilProfileColorSwatches', editable: true },
            { name: 'soilColorAssistCandidates', editable: true },
            { name: 'soilColorAssistStatus', editable: true }
        ] as any;
        component.onChanged.subscribe(() => emittedStates.push({ ...component.document.resource }));

        component.applyAssistCandidate('10YR 4/3');

        expect(emittedStates).toEqual([
            {
                category: 'SoilProfilePhoto',
                soilColorAssistCandidates: '1: 10YR 4/3 (보통, 차이 0.0)',
                soilColorAssistStatus: 'reviewed',
                soilProfileColorSwatches: '1: 10YR 4/3'
            }
        ]);
    });


    it('resets assist status when photo-derived candidates are cleared', () => {

        const emittedStates: Array<Record<string, unknown>> = [];
        component.document = {
            resource: {
                category: 'SoilProfilePhoto',
                soilColorAssistCandidates: '1: 10YR 4/3 (보통, 차이 0.0)',
                soilColorAssistStatus: 'candidatesAvailable'
            }
        } as any;
        component.fieldDefinitions = [
            { name: 'soilProfileColorSwatches', editable: true },
            { name: 'soilColorAssistCandidates', editable: true },
            { name: 'soilColorAssistStatus', editable: true }
        ] as any;
        component.onChanged.subscribe(() => emittedStates.push({ ...component.document.resource }));

        component.setAssistCandidates('');

        expect(component.document.resource.soilColorAssistCandidates).toBeUndefined();
        expect(component.document.resource.soilColorAssistStatus).toBe('notRun');
        expect(emittedStates).toEqual([
            {
                category: 'SoilProfilePhoto',
                soilColorAssistStatus: 'notRun'
            }
        ]);
    });
});
