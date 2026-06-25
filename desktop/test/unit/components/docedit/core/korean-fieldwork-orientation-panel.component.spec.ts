import {
    KoreanFieldworkOrientationPanelComponent
} from '../../../../../src/app/components/docedit/core/korean-fieldwork-orientation-panel.component';


describe('KoreanFieldworkOrientationPanelComponent', () => {

    let component: KoreanFieldworkOrientationPanelComponent;


    beforeEach(() => {

        component = new KoreanFieldworkOrientationPanelComponent();
    });


    it('normalizes long-axis orientation entries', () => {

        expect(component.normalizeLongAxisOrientation('n-e')).toBe('N-E');
        expect(component.normalizeLongAxisOrientation('북에서 동쪽으로')).toBe('N-E');
        expect(component.normalizeLongAxisOrientation('남서')).toBe('S-W');
        expect(component.normalizeLongAxisOrientation('n-23도-e')).toBe('N-23°-E');
        expect(component.normalizeLongAxisOrientation('북 23도 동')).toBe('N-23°-E');
        expect(component.normalizeLongAxisOrientation('북에서 동쪽으로 23도')).toBe('N-23°-E');
        expect(component.normalizeLongAxisOrientation('NE 23')).toBe('N-23°-E');
        expect(component.normalizeLongAxisOrientation('남서 45도')).toBe('S-45°-W');
    });


    it('keeps invalid long-axis orientation entries unchanged and marks them invalid', () => {

        component.document = { resource: { category: 'Feature', longAxisOrientation: 'N-120°-E' } } as any;

        expect(component.normalizeLongAxisOrientation('N-120°-E')).toBe('N-120°-E');
        expect(component.isOrientationInvalid()).toBe(true);
    });


    it('describes valid long-axis orientation entries in Korean', () => {

        expect(component.describeLongAxisOrientation('N-23°-E')).toBe('N-23°-E = 북에서 동쪽으로 23°');
        expect(component.describeLongAxisOrientation('N-E')).toBe('N-E = 북에서 동쪽으로 기운 장축');
        expect(component.describeLongAxisOrientation('남서 45도')).toBe('S-45°-W = 남에서 서쪽으로 45°');
    });


    it('defaults the orientation reference to magnetic north when a quadrant is selected', () => {

        component.document = { resource: { category: 'Feature' } } as any;
        component.fieldDefinitions = [
            { name: 'longAxisOrientation', editable: true },
            { name: 'orientationReference', editable: true }
        ] as any;

        component.applyOrientationPreset('N-W');

        expect(component.document.resource.longAxisOrientation).toBe('N-W');
        expect(component.document.resource.orientationReference).toBe('자북');
        expect(component.isOrientationPresetActive('N-W')).toBe(true);
    });


    it('defaults the orientation reference to magnetic north when a bearing is typed', () => {

        component.document = { resource: { category: 'Feature' } } as any;
        component.fieldDefinitions = [
            { name: 'longAxisOrientation', editable: true },
            { name: 'orientationReference', editable: true }
        ] as any;

        component.setLongAxisOrientation('N-23°-E');

        expect(component.document.resource.longAxisOrientation).toBe('N-23°-E');
        expect(component.document.resource.orientationReference).toBe('자북');
    });
});
