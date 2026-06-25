import {
    extractMunsellCandidateOptions,
    getMunsellCandidateSummaryLabel
} from '../../../src/app/util/korean-fieldwork-soil-color-candidates';


describe('korean-fieldwork-soil-color-candidates', () => {

    it('extracts unique Munsell options from photo-derived candidate text', () => {

        const candidates = extractMunsellCandidateOptions([
            '사진 중앙부 평균 RGB 111/87/61',
            '1: 10YR 4/3 (높음, 차이 0.0)',
            '2: 7.5YR 4/3 (보통, 차이 8.1)',
            '3: 10YR 4/3 (중복)',
            '4: GLEY 1 5/N (낮음)'
        ].join('\n'));

        expect(candidates).toEqual(['10YR 4/3', '7.5YR 4/3', 'GLEY 1 5/N']);
    });


    it('builds a concise desktop review label for candidate lists', () => {

        expect(getMunsellCandidateSummaryLabel(
            '1: 10YR 4/3 (높음)\n2: 7.5YR 4/3 (보통)'
        )).toBe('먼셀 후보 10YR 4/3, 7.5YR 4/3');

        expect(getMunsellCandidateSummaryLabel('사진 색상 샘플을 읽지 못했습니다.')).toBe('');
    });
});
