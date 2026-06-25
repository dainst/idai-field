import { Document } from 'idai-field-core';
import {
    makeKoreanFieldworkScopeSummary
} from '../../../src/app/util/korean-fieldwork-scope-summary';


describe('makeKoreanFieldworkScopeSummary', () => {

    it('asks for the investigation mode first', () => {

        const summary = makeKoreanFieldworkScopeSummary([
            createDocument('project', 'Project')
        ], createDocument('project', 'Project'));

        expect(summary).toMatchObject({
            tone: 'warning',
            title: '조사 방식 미정',
            modeLabel: '조사 방식 없음',
            boundaryLabel: '경계 없음',
            actionLabel: '프로젝트 정보',
            action: { type: 'openProjectInfo' }
        });
    });


    it('asks for an operation when mode exists without a fieldwork unit', () => {

        const projectDocument = createDocument('project', 'Project', {
            projectInvestigationMode: 'trialTrench'
        });

        const summary = makeKoreanFieldworkScopeSummary([projectDocument], projectDocument);

        expect(summary).toMatchObject({
            tone: 'info',
            title: '조사 경계 필요',
            detail: '표본·시굴조사 · 지도에서 GPS 임시 경계, SHP/DXF/CSV, 위성지도 중 하나로 조사 경계를 먼저 만드세요.',
            modeLabel: '표본·시굴조사',
            boundaryLabel: '경계 없음',
            legacyRootRecordCount: 0,
            actionLabel: '지도',
            action: { type: 'openMap' }
        });
    });


    it('counts parentless legacy records before creating the operation', () => {

        const projectDocument = createDocument('project', 'Project', {
            projectInvestigationMode: 'excavation'
        });

        const summary = makeKoreanFieldworkScopeSummary([
            projectDocument,
            createDocument('photo-1', 'Photo'),
            createDocument('memo-1', 'PenMemo')
        ], projectDocument);

        expect(summary).toMatchObject({
            tone: 'warning',
            title: '조사 구역 정리 필요',
            detail: '발굴조사 · 부모 없이 떠 있는 기존 기록 2건을 새 조사 구역 안으로 정리하세요.',
            legacyRootRecordCount: 2,
            actionLabel: '지도',
            action: { type: 'openMap' }
        });
    });


    it('asks for a survey boundary once the operation exists without boundary data', () => {

        const projectDocument = createDocument('project', 'Project', {
            projectInvestigationMode: 'trialTrench'
        });

        const summary = makeKoreanFieldworkScopeSummary([
            projectDocument,
            createDocument('operation-1', 'Operation')
        ], projectDocument);

        expect(summary).toMatchObject({
            tone: 'warning',
            title: '조사 구역 필요',
            detail: '표본·시굴조사 · GPS 임시 경계, SHP/DXF/CSV, 위성지도 기준으로 확정한 경계가 없습니다.',
            modeLabel: '표본·시굴조사',
            boundaryLabel: '경계 없음',
            actionLabel: '지도',
            action: { type: 'openMap' },
            secondaryActionDetail: 'SHP/DXF/CSV는 데스크톱 가져오기에서 불러온 뒤 동기화하면 태블릿 지도에서도 조사 경계로 보입니다.',
            secondaryActionLabel: '가져오기',
            secondaryAction: { type: 'openImport' }
        });
    });


    it('asks to confirm the map boundary when only the project boundary summary exists', () => {

        const projectDocument = createDocument('project', 'Project', {
            projectInvestigationMode: 'trialTrench',
            projectBoundarySummary: 'A구역 북쪽 능선'
        });

        const summary = makeKoreanFieldworkScopeSummary([
            projectDocument,
            createDocument('operation-1', 'Operation')
        ], projectDocument);

        expect(summary).toMatchObject({
            tone: 'warning',
            title: '조사 구역 확정 필요',
            detail: '표본·시굴조사 · A구역 북쪽 능선 기준만 있음. GPS 임시 경계, SHP/DXF/CSV, 위성지도 중 하나로 확정하세요.',
            modeLabel: '표본·시굴조사',
            boundaryLabel: 'A구역 북쪽 능선',
            actionLabel: '지도',
            action: { type: 'openMap' },
            secondaryActionDetail: 'SHP/DXF/CSV는 데스크톱 가져오기에서 불러온 뒤 동기화하면 태블릿 지도에서도 조사 경계로 보입니다.',
            secondaryActionLabel: '가져오기',
            secondaryAction: { type: 'openImport' }
        });
    });


    it('summarizes scope counts once setup and records are present', () => {

        const projectDocument = createDocument('project', 'Project', {
            projectInvestigationMode: 'excavation',
            projectBoundarySummary: 'A구역'
        });

        const summary = makeKoreanFieldworkScopeSummary([
            projectDocument,
            createDocument('operation-1', 'Operation'),
            createDocument('boundary-1', 'SurveyBoundary', {
                surveyBoundaryAccuracy: 'importedReference',
                surveyBoundarySource: 'shpImport'
            }),
            createDocument('trench-1', 'Trench'),
            createDocument('feature-1', 'Feature'),
            createDocument('photo-1', 'Photo'),
            createDocument('daily-1', 'DailyLog')
        ], projectDocument, 2);

        expect(summary).toMatchObject({
            tone: 'info',
            title: '조사 범위 준비',
            detail: '발굴조사 · A구역 · SHP 가져오기 · 가져온 참고자료',
            modeLabel: '발굴조사',
            boundaryLabel: 'A구역 · SHP 가져오기 · 가져온 참고자료',
            structureCount: 3,
            evidenceCount: 1,
            reviewCount: 2,
            issueCount: 2,
            actionLabel: '지도',
            action: { type: 'openMap' }
        });
    });


    it('keeps pen memos out of the core evidence count', () => {

        const projectDocument = createDocument('project', 'Project', {
            projectInvestigationMode: 'excavation',
            projectBoundarySummary: 'A구역'
        });

        const summary = makeKoreanFieldworkScopeSummary([
            projectDocument,
            createDocument('operation-1', 'Operation'),
            createDocument('trench-1', 'Trench'),
            createDocument('memo-1', 'PenMemo'),
            createDocument('photo-1', 'Photo')
        ], projectDocument);

        expect(summary.evidenceCount).toBe(1);
        expect(summary.reviewCount).toBe(0);
    });
});


const createDocument = (id: string, category: string, fields: any = {}): Document => ({
    resource: {
        id,
        identifier: id,
        category,
        relations: {},
        ...fields
    }
} as Document);
