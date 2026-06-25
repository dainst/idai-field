import {
    KoreanFieldworkNarrativeAssistPanelComponent
} from '../../../../../src/app/components/docedit/core/korean-fieldwork-narrative-assist-panel.component';


describe('KoreanFieldworkNarrativeAssistPanelComponent', () => {

    it('applies narrative snippets to the edited document', () => {

        const component = new KoreanFieldworkNarrativeAssistPanelComponent();
        const onChanged = jest.fn();
        component.document = {
            resource: {
                id: 'feature-1',
                identifier: 'feature-1',
                category: 'Feature',
                relations: {},
                description: '기존 관찰.'
            }
        } as any;
        component.fieldDefinitions = [
            { name: 'description', inputType: 'textarea', editable: true }
        ] as any;
        component.onChanged.subscribe(onChanged);

        const group = component.getFieldGroups()
            .find(entry => entry.fieldName === 'description');
        const snippet = group?.snippets.find(entry => entry.id === 'feature-exposure');

        component.applySnippet(snippet!);

        expect(component.document.resource.description).toBe(
            '기존 관찰.\n평면 노출 상태, 경계의 명확성, 교란 여부를 확인함.'
        );
        expect(onChanged).toHaveBeenCalled();
    });


    it('applies a feature field-note snippet that ties description to sketch and evidence numbers', () => {

        const component = new KoreanFieldworkNarrativeAssistPanelComponent();
        const onChanged = jest.fn();
        component.document = {
            resource: {
                id: 'feature-1',
                identifier: 'feature-1',
                category: 'Feature',
                relations: {},
                description: '평면 일부 확인.'
            }
        } as any;
        component.fieldDefinitions = [
            { name: 'description', inputType: 'textarea', editable: true }
        ] as any;
        component.onChanged.subscribe(onChanged);

        const group = component.getFieldGroups()
            .find(entry => entry.fieldName === 'description');
        const snippet = group?.snippets.find(entry => entry.id === 'feature-field-note-flow');

        component.applySnippet(snippet!);

        expect(component.document.resource.description).toContain(
            '[스케치·약측] 약도/평면/단면 스케치 번호, 장축×단축, 깊이, 단면 위치를 적음.'
        );
        expect(component.document.resource.description).toContain(
            '[유구 성격] 미정/추정으로 둘 수 있으며'
        );
        expect(component.document.resource.description).toContain(
            '[사진·도면 번호] 사진 번호와 도면 번호를 서로 대조.'
        );
        expect(onChanged).toHaveBeenCalled();
    });


    it('shows checklist state for desktop field-note flow', () => {

        const component = new KoreanFieldworkNarrativeAssistPanelComponent();
        component.document = {
            resource: {
                id: 'soil-photo-1',
                identifier: 'soil-photo-1',
                category: 'SoilProfilePhoto',
                relations: {},
                description: '사진 1 토색 10YR 4/3.'
            }
        } as any;
        component.fieldDefinitions = [
            { name: 'description', inputType: 'textarea', editable: true },
            { name: 'interpretation', inputType: 'textarea', editable: true }
        ] as any;

        expect(component.hasChecklistItems()).toBe(true);
        expect(component.getChecklistItems()).toEqual([
            expect.objectContaining({ id: 'observation', isComplete: true }),
            expect.objectContaining({ id: 'interpretation', isComplete: false }),
            expect.objectContaining({ id: 'evidenceNumbers', isComplete: true })
        ]);
    });


    it('stays hidden when no narrative text fields are available', () => {

        const component = new KoreanFieldworkNarrativeAssistPanelComponent();
        component.document = {
            resource: {
                id: 'feature-1',
                identifier: 'feature-1',
                category: 'Feature',
                relations: {}
            }
        } as any;
        component.fieldDefinitions = [
            { name: 'featureRecordingStatus', inputType: 'dropdown', editable: true }
        ] as any;

        expect(component.shouldShow()).toBe(false);
    });
});
