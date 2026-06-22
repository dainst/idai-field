import {
    buildEvidenceBundle,
    getKoreanFieldworkReadinessIssues,
    getKoreanFieldworkTodaySummary,
    searchTermAuthorities
} from '../../src/tools/korean-fieldwork-readiness';


describe('Korean fieldwork readiness', () => {

    it('reports non-blocking field closeout issues from existing KoreanFieldwork fields', () => {

        const documents: any[] = [
            makeDocument('feature-1', 'Feature', {
                featureRecordingStatus: 'confirmed',
                featureInvestigationChecklist: ['findsRecovered', 'soilProfilePhotoLinked'],
                featureSoilProfilePhotoCount: 1
            }),
            makeDocument('feature-2', 'Feature', {
                featureGeometryEditStatus: 'needsAerialAlignment'
            }),
            makeDocument('find-1', 'Find', {
                relations: { liesWithin: ['feature-1'] }
            }),
            makeDocument('sample-1', 'Sample', {
                relations: { liesWithin: ['feature-1'] }
            }),
            makeDocument('report-1', 'ReportPreparationReview', {
                relations: { isSubjectOf: ['feature-1'] }
            })
        ];

        const issues = getKoreanFieldworkReadinessIssues(documents as any);
        const issueIds = issues.map((issue) => issue.ruleId);

        expect(issueIds).toContain('feature-complete-photo');
        expect(issueIds).toContain('finds-recovered-pre-photo');
        expect(issueIds).toContain('soil-profile-photo-count');
        expect(issueIds).toContain('feature-geometry-needs-aerial-alignment');
        expect(issueIds).toContain('sample-purpose');
        expect(issueIds).toContain('find-label-register');
        expect(issueIds).toContain('report-cross-check');
        expect(issues.every((issue) => issue.blocksSave === false)).toBe(true);
    });


    it('builds evidence bundles around a feature without creating a Harris Matrix graph', () => {

        const feature = makeDocument('feature-1', 'Feature');
        const documents: any[] = [
            feature,
            makeDocument('segment-1', 'FeatureSegment', { relations: { liesWithin: ['feature-1'] } }),
            makeDocument('layer-1', 'Layer', { relations: { liesWithin: ['segment-1'] } }),
            makeDocument('photo-1', 'Photo', { relations: { isDepictedIn: ['feature-1'] } }),
            makeDocument('soil-photo-1', 'SoilProfilePhoto', { relations: { depicts: ['feature-1'] } }),
            makeDocument('drawing-1', 'Drawing', { relations: { isDepictedIn: ['feature-1'] } }),
            makeDocument('pen-1', 'PenMemo', { relations: { depicts: ['feature-1'] } }),
            makeDocument('find-1', 'Find', { relations: { liesWithin: ['feature-1'] } }),
            makeDocument('sample-1', 'Sample', { relations: { liesWithin: ['feature-1'] } }),
            makeDocument('prep-1', 'ReportPreparationReview', { relations: { isSubjectOf: ['feature-1'] } }),
            makeDocument('cross-1', 'ReportEditorialCrossCheck', { relations: { isSubjectOf: ['feature-1'] } })
        ];

        const bundle = buildEvidenceBundle(feature as any, documents as any);

        expect(bundle.featureSegments.length).toBe(1);
        expect(bundle.layers.length).toBe(1);
        expect(bundle.photos.length).toBe(1);
        expect(bundle.soilProfilePhotos.length).toBe(1);
        expect(bundle.drawings.length).toBe(1);
        expect(bundle.penMemos.length).toBe(1);
        expect(bundle.finds.length).toBe(1);
        expect(bundle.samples.length).toBe(1);
        expect(bundle.reportPreparationReviews.length).toBe(1);
        expect(bundle.reportEditorialCrossChecks.length).toBe(1);
    });


    it('summarizes today board inputs from documents and warning issues', () => {

        const documents: any[] = [
            makeDocument('log-1', 'DailyLog'),
            makeDocument('boundary-1', 'SurveyBoundary'),
            makeDocument('feature-1', 'Feature', { featureRecordingStatus: 'candidate' }),
            makeDocument('sample-1', 'Sample')
        ];

        const summary = getKoreanFieldworkTodaySummary(documents as any);

        expect(summary.dailyLogs.length).toBe(1);
        expect(summary.surveyBoundaries.length).toBe(1);
        expect(summary.featureCandidates.length).toBe(1);
        expect(summary.issueCountByDocumentId['sample-1']).toBe(1);
    });


    it('finds TermAuthority records by alias while keeping authority and alias separate', () => {

        const authority = makeDocument('term-1', 'TermAuthority', {
            identifier: 'pit dwelling'
        });
        const alias = makeDocument('alias-1', 'TermAlias', {
            identifier: 'alias',
            termAliasText: '집자리',
            relations: { liesWithin: ['term-1'] }
        });

        const matches = searchTermAuthorities([authority, alias] as any, '집자리');

        expect(matches.length).toBe(1);
        expect(matches[0].authority.resource.id).toBe('term-1');
        expect(matches[0].aliases[0].resource.termAliasText).toBe('집자리');
        expect(matches[0].matchedText).toBe('집자리');
    });
});


function makeDocument(id: string, category: string, resource: any = {}): any {

    const { relations, ...properties } = resource;

    return {
        _id: id,
        resource: {
            id,
            identifier: id,
            category,
            relations: relations ?? {},
            ...properties
        },
        created: {},
        modified: []
    };
}
