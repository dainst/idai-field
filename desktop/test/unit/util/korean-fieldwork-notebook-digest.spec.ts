import {
    extractKoreanFieldworkFieldNoteInput,
    getKoreanFieldworkNotebookEntries,
    getKoreanFieldworkNotebookContinuationSeed,
    getKoreanFieldworkNotebookEntriesForDocument,
    makeKoreanFieldworkDailyNotebookDigest
} from '../../../src/app/util/korean-fieldwork-notebook-digest';


describe('korean-fieldwork-notebook-digest', () => {

    const today = new Date('2026-06-24T10:00:00');


    it('builds today digest entries from reviewed PenMemo records', () => {

        const feature = createDoc('feature-1', 'Feature', 'F-1');
        const memo = createDoc('memo-1', 'PenMemo', 'M-1', {
            date: '2026-06-24',
            penMemoReviewedTranscript: [
                '[관찰 내용] 북쪽 경계에서 소토와 재층 확인.',
                '[다음 작업] 사진 보강 후 단면 정리.'
            ].join('\n'),
            relations: { depicts: ['feature-1'] }
        });

        const digest = makeKoreanFieldworkDailyNotebookDigest([feature, memo] as any, today);

        expect(digest.dateLabel).toBe('2026-06-24');
        expect(digest.entries).toHaveLength(1);
        expect(digest.nextWorkEntries[0].targetLabel).toBe('F-1');
        expect(digest.nextWorkEntries[0].targetCategoryLabel).toBe('유구');
        expect(digest.nextWorkEntries[0].nextWork).toBe('사진 보강 후 단면 정리.');
        expect(digest.evidenceMissingEntries).toHaveLength(1);
    });


    it('creates notebook entries from daily log blocks and resolves target labels', () => {

        const feature = createDoc('feature-1', 'Feature', 'F-1');
        const dailyLog = createDoc('daily-log-1', 'DailyLog', '2026-06-24 일지', {
            date: '2026-06-24',
            description: [
                '09:30 F-1 - [관찰 내용] 장축 방향과 바닥면 확인.',
                '[다음 작업] 단면 정리.',
                '11:00 조사구역 - [사진·도면·스케치·유물·시료 번호] 사진 12'
            ].join('\n')
        });

        const entries = getKoreanFieldworkNotebookEntries([feature, dailyLog] as any);

        expect(entries).toHaveLength(2);
        expect(entries[1].sourceLabel).toBe('일지');
        expect(entries[1].targetLabel).toBe('F-1');
        expect(entries[1].dateLabel).toBe('2026-06-24 09:30');
        expect(entries[1].nextWork).toBe('단면 정리.');
    });


    it('accepts short evidence-number section labels', () => {

        expect(extractKoreanFieldworkFieldNoteInput([
            '[관찰 내용] 바닥면에서 원형 윤곽 확인.',
            '[근거 번호] 사진 12, 도면 3'
        ].join('\n'))).toEqual({
            observation: '바닥면에서 원형 윤곽 확인.',
            interpretation: '',
            nextWork: '',
            evidenceNumbers: '사진 12, 도면 3'
        });

        expect(extractKoreanFieldworkFieldNoteInput([
            '[관찰 내용] 평면 윤곽과 깊이를 확인.',
            '[스케치·약측/근거 번호] 스케치 A, 장축 2.1m, 사진 14'
        ].join('\n'))).toEqual({
            observation: '평면 윤곽과 깊이를 확인.',
            interpretation: '',
            nextWork: '',
            evidenceNumbers: '스케치 A, 장축 2.1m, 사진 14'
        });
    });


    it('does not treat empty field note templates as notebook entries', () => {

        const feature = createDoc('feature-1', 'Feature', 'F-1');
        const templateMemo = createDoc('memo-template', 'PenMemo', 'M-template', {
            date: '2026-06-24',
            description: '[관찰 내용]\n\n[근거 번호]\n\n[다음 작업]',
            relations: { depicts: ['feature-1'] }
        });
        const templateDailyLog = createDoc('daily-log-template', 'DailyLog', '2026-06-24 일지', {
            date: '2026-06-24',
            description: '09:30 F-1 - [관찰 내용]\n[근거 번호]\n[다음 작업]'
        });

        expect(getKoreanFieldworkNotebookEntries([feature, templateMemo, templateDailyLog] as any))
            .toEqual([]);
        expect(getKoreanFieldworkNotebookEntriesForDocument(
            feature as any,
            [feature, templateMemo, templateDailyLog] as any
        )).toEqual([]);
        expect(makeKoreanFieldworkDailyNotebookDigest(
            [feature, templateMemo, templateDailyLog] as any,
            today
        ).entries).toEqual([]);
    });


    it('builds continuation seeds for notebook follow-ups', () => {

        const feature = createDoc('feature-1', 'Feature', 'F-1');
        const memo = createDoc('memo-1', 'PenMemo', 'M-1', {
            date: '2026-06-24',
            penMemoReviewedTranscript: [
                '[관찰 내용] 바닥면 정리 중 원형 윤곽 확인.',
                '[다음 작업] 사진 보강.'
            ].join('\n'),
            relations: { depicts: ['feature-1'] }
        });

        const [entry] = getKoreanFieldworkNotebookEntries([feature, memo] as any);

        expect(getKoreanFieldworkNotebookContinuationSeed(entry, 'nextWork')).toEqual({
            id: 'memo-1',
            sourceLabel: '메모 남은 작업',
            input: {
                observation: '바닥면 정리 중 원형 윤곽 확인.',
                interpretation: '',
                nextWork: '사진 보강.',
                evidenceNumbers: ''
            }
        });
        expect(getKoreanFieldworkNotebookContinuationSeed(entry, 'evidenceNumbers')).toMatchObject({
            sourceLabel: '메모 번호 보강',
            input: {
                nextWork: '사진 보강.\n사진·도면·스케치·유물·시료 번호를 이어서 확인.'
            }
        });
    });


    it('omits old notebook records from the daily digest', () => {

        const oldMemo = createDoc('memo-old', 'PenMemo', 'M-old', {
            date: '2026-06-23',
            penMemoReviewedTranscript: '[다음 작업] 어제 작업.'
        });
        const todayMemo = createDoc('memo-today', 'PenMemo', 'M-today', {
            date: '2026-06-24',
            penMemoReviewedTranscript: '[다음 작업] 오늘 작업.'
        });

        const digest = makeKoreanFieldworkDailyNotebookDigest([oldMemo, todayMemo] as any, today);

        expect(digest.entries.map(entry => entry.sourceDocument.resource.id)).toEqual(['memo-today']);
    });


    it('filters notebook entries for the selected record', () => {

        const feature = createDoc('feature-1', 'Feature', 'F-1');
        const otherFeature = createDoc('feature-2', 'Feature', 'F-2');
        const memo = createDoc('memo-1', 'PenMemo', 'M-1', {
            date: '2026-06-24',
            penMemoReviewedTranscript: '[다음 작업] F-1 사진 보강.',
            relations: { depicts: ['feature-1'] }
        });
        const otherMemo = createDoc('memo-2', 'PenMemo', 'M-2', {
            date: '2026-06-24',
            penMemoReviewedTranscript: '[다음 작업] F-2 사진 보강.',
            relations: { depicts: ['feature-2'] }
        });

        const entries = getKoreanFieldworkNotebookEntriesForDocument(
            feature as any,
            [feature, otherFeature, memo, otherMemo] as any
        );

        expect(entries).toHaveLength(1);
        expect(entries[0].sourceDocument.resource.id).toBe('memo-1');
        expect(entries[0].targetLabel).toBe('F-1');
    });
});


const createDoc = (
    id: string,
    category: string,
    identifier: string,
    fields: { [fieldName: string]: unknown } = {}
) => ({
    _id: id,
    resource: {
        id,
        category,
        identifier,
        relations: {},
        ...fields
    },
    created: { user: 'tester', date: new Date('2026-06-24T08:00:00') },
    modified: [{ user: 'tester', date: new Date('2026-06-24T08:00:00') }]
});
