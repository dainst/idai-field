import {
    getKoreanFieldworkNarrativeChecklistItems,
    getKoreanFieldworkNarrativeFieldGroups,
    getKoreanFieldworkNarrativeSnippetValue
} from '../../../src/app/util/korean-fieldwork-narrative-assist';


describe('korean-fieldwork-narrative-assist', () => {

    it('returns category-specific narrative snippets for Korean fieldwork records', () => {

        const document = createDocument('Feature');
        const groups = getKoreanFieldworkNarrativeFieldGroups(document as any, [
            field('shortDescription'),
            field('description'),
            field('interpretation')
        ] as any);

        expect(groups.map(group => group.fieldName)).toEqual([
            'shortDescription',
            'description',
            'interpretation'
        ]);
        expect(groups.find(group => group.fieldName === 'shortDescription')?.snippets
            .map(snippet => snippet.id)).toEqual([
            'common-field-checked',
            'feature-candidate-summary'
        ]);
        expect(groups.find(group => group.fieldName === 'description')?.snippets
            .map(snippet => snippet.id)).toEqual(expect.arrayContaining([
            'feature-exposure',
            'feature-field-note-flow',
            'feature-sketch-measure-evidence',
            'feature-shape-scale'
        ]));
    });


    it('does not duplicate appended narrative text', () => {

        const document = createDocument('Sample', {
            description: '시료 채취 위치, 목적, 주변 퇴적 상태와 오염 가능성을 함께 기록함.'
        });
        const [group] = getKoreanFieldworkNarrativeFieldGroups(document as any, [
            field('description')
        ] as any);
        const snippet = group.snippets.find(entry => entry.id === 'sample-context');

        expect(getKoreanFieldworkNarrativeSnippetValue(document as any, snippet!))
            .toBe('시료 채취 위치, 목적, 주변 퇴적 상태와 오염 가능성을 함께 기록함.');
    });


    it('adds structured field-note snippets for soil colors and evidence numbers', () => {

        const groups = getKoreanFieldworkNarrativeFieldGroups(createDocument('Layer') as any, [
            field('description')
        ] as any);
        const snippets = groups[0].snippets.map(snippet => snippet.id);

        expect(snippets).toEqual(expect.arrayContaining([
            'layer-boundary',
            'layer-field-note-color'
        ]));

        const snippet = groups[0].snippets.find(entry => entry.id === 'layer-field-note-color')!;
        expect(getKoreanFieldworkNarrativeSnippetValue(createDocument('Layer') as any, snippet))
            .toContain('[관찰 내용] 사진 위 표시 번호별 토색을 기록.');
    });


    it('adds feature field-note snippets that bind descriptions to sketches, measurements, and evidence numbers', () => {

        const [group] = getKoreanFieldworkNarrativeFieldGroups(createDocument('Feature') as any, [
            field('description')
        ] as any);
        const fieldNoteSnippet = group.snippets.find(entry => entry.id === 'feature-field-note-flow')!;
        const sketchMeasureSnippet = group.snippets.find(entry => entry.id === 'feature-sketch-measure-evidence')!;

        expect(getKoreanFieldworkNarrativeSnippetValue(createDocument('Feature') as any, fieldNoteSnippet))
            .toContain('[사진·도면 번호] 사진 번호와 도면 번호를 서로 대조.');
        expect(getKoreanFieldworkNarrativeSnippetValue(createDocument('Feature') as any, fieldNoteSnippet))
            .toContain('[유구 성격] 미정/추정으로 둘 수 있으며');
        expect(getKoreanFieldworkNarrativeSnippetValue(createDocument('Feature') as any, sketchMeasureSnippet))
            .toBe('[스케치·약측] 약도/평면/단면 스케치 번호, 측정 기준선, 장축×단축, 깊이, 촬영·도면 번호, 설명에서 참조할 부분을 함께 기록.');
    });


    it('summarizes the desktop field-note checklist from current narrative fields', () => {

        const items = getKoreanFieldworkNarrativeChecklistItems(createDocument('SoilProfilePhoto', {
            description: '[관찰 내용] 사진 1 토색 10YR 4/3.',
            interpretation: ''
        }) as any, [
            field('description', 'textarea'),
            field('interpretation', 'textarea')
        ] as any);

        expect(items).toEqual([
            expect.objectContaining({ id: 'observation', isComplete: true }),
            expect.objectContaining({ id: 'interpretation', isComplete: false }),
            expect.objectContaining({ id: 'evidenceNumbers', isComplete: true })
        ]);
    });


    it('omits fields that are not editable text fields', () => {

        const groups = getKoreanFieldworkNarrativeFieldGroups(createDocument('Feature') as any, [
            field('shortDescription', 'dropdown'),
            field('description', 'textarea', false)
        ] as any);

        expect(groups).toEqual([]);
    });
});


const createDocument = (category: string, resource: any = {}) => ({
    resource: {
        id: 'record-1',
        identifier: 'record-1',
        category,
        relations: {},
        ...resource
    }
});


const field = (name: string, inputType: string = 'input', editable: boolean = true) => ({
    name,
    inputType,
    editable
});
