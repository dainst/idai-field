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


    it('reports local tablet media without confirmed Field Hub original backup', () => {

        const documents: any[] = [
            makeDocument('photo-1', 'Photo', {
                fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg'
            }),
            makeDocument('soil-photo-1', 'SoilProfilePhoto', {
                soilProfilePhotoUri: 'content://tablet/photos/soil-photo-1.jpg'
            }),
            makeDocument('drawing-1', 'Drawing', {
                fileUri: 'file:///tablet/drawings/drawing-1.jpg'
            }),
            makeDocument('photo-2', 'Photo', {
                fieldworkPhotoUri: 'file:///tablet/photos/photo-2.jpg',
                digitalSourcePreservation: [
                    'originalPhoto',
                    'originalImage',
                    'webOrServerBackup',
                    'backupVerified'
                ],
                fieldworkImageUploadStatus: 'uploaded',
                fieldworkImageUploadedAt: '2026-06-23T01:02:03.000Z',
                fieldworkImageUploadedUri: 'file:///tablet/photos/photo-2.jpg',
                fieldworkImageUploadTarget:
                    'https://field.example/files/fieldwork/photo-2?type=original_image',
                fieldworkImageUploadedProject: 'fieldwork',
                fieldworkImageUploadedSizeBytes: 481516,
                fieldworkImageUploadedMd5: 'tablet-md5',
                fieldworkImageStoredSizeBytes: 481516,
                fieldworkImageStoredMd5: 'tablet-md5',
                fieldworkImageStoredSha256: 'server-sha256'
            })
        ];

        const issues = getKoreanFieldworkReadinessIssues(documents as any);

        expect(issues.map((issue) => issue.ruleId)).toEqual([
            'fieldwork-photo-upload-missing',
            'soil-profile-photo-upload-missing',
            'fieldwork-drawing-upload-missing'
        ]);
        expect(issues[0].documentId).toBe('photo-1');
        expect(issues[0].relatedFields).toEqual([
            'fieldworkImageUploadStatus',
            'fieldworkImageUploadedAt',
            'fieldworkImageUploadedUri',
            'fieldworkImageUploadTarget',
            'fieldworkImageUploadedProject',
            'fieldworkImageUploadedSizeBytes',
            'fieldworkImageUploadedMd5',
            'fieldworkImageStoredSizeBytes',
            'fieldworkImageStoredMd5',
            'fieldworkImageStoredSha256',
            'digitalSourcePreservation'
        ]);
    });


    it('keeps reporting tablet media when upload audit fields are incomplete', () => {

        const documents: any[] = [
            makeDocument('photo-1', 'Photo', {
                fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
                fieldworkImageUploadStatus: 'uploaded',
                fieldworkImageUploadedAt: '2026-06-23T01:02:03.000Z',
                fieldworkImageUploadedUri: 'file:///tablet/photos/previous-photo.jpg',
                fieldworkImageUploadTarget:
                    'https://field.example/files/fieldwork/photo-1?type=original_image',
                fieldworkImageUploadedProject: 'fieldwork',
                digitalSourcePreservation: ['webOrServerBackup']
            })
        ];

        const issues = getKoreanFieldworkReadinessIssues(documents as any);

        expect(issues.map((issue) => issue.ruleId)).toEqual([
            'fieldwork-photo-upload-missing'
        ]);
    });


    it('keeps reporting tablet media when the upload target points to another file', () => {

        const documents: any[] = [
            makeDocument('photo-1', 'Photo', {
                fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
                digitalSourcePreservation: [
                    'originalPhoto',
                    'originalImage',
                    'webOrServerBackup',
                    'backupVerified'
                ],
                fieldworkImageUploadStatus: 'uploaded',
                fieldworkImageUploadedAt: '2026-06-23T01:02:03.000Z',
                fieldworkImageUploadedUri: 'file:///tablet/photos/photo-1.jpg',
                fieldworkImageUploadTarget:
                    'https://field.example/files/fieldwork/other-photo?type=original_image',
                fieldworkImageUploadedProject: 'fieldwork',
                fieldworkImageUploadedSizeBytes: 481516,
                fieldworkImageUploadedMd5: 'tablet-md5',
                fieldworkImageStoredSizeBytes: 481516,
                fieldworkImageStoredMd5: 'tablet-md5',
                fieldworkImageStoredSha256: 'server-sha256'
            })
        ];

        const issues = getKoreanFieldworkReadinessIssues(documents as any);

        expect(issues.map((issue) => issue.ruleId)).toEqual([
            'fieldwork-photo-upload-missing'
        ]);
    });


    it('keeps reporting content URI tablet media when Field Hub stored metadata is missing', () => {

        const documents: any[] = [
            makeDocument('drawing-1', 'Drawing', {
                fileUri: 'content://tablet/drawings/drawing-1.jpg',
                digitalSourcePreservation: [
                    'originalDrawing',
                    'webOrServerBackup',
                    'backupVerified'
                ],
                fieldworkImageUploadStatus: 'uploaded',
                fieldworkImageUploadedAt: '2026-06-23T01:02:03.000Z',
                fieldworkImageUploadedUri: 'content://tablet/drawings/drawing-1.jpg',
                fieldworkImageUploadTarget:
                    'https://field.example/files/fieldwork/drawing-1?type=original_image',
                fieldworkImageUploadedProject: 'fieldwork'
            })
        ];

        const issues = getKoreanFieldworkReadinessIssues(documents as any);

        expect(issues.map((issue) => issue.ruleId)).toEqual([
            'fieldwork-drawing-upload-missing'
        ]);
    });


    it('keeps reporting file URI tablet media when upload size metadata is missing', () => {

        const documents: any[] = [
            makeDocument('photo-1', 'Photo', {
                fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
                digitalSourcePreservation: [
                    'originalPhoto',
                    'originalImage',
                    'webOrServerBackup',
                    'backupVerified'
                ],
                fieldworkImageUploadStatus: 'uploaded',
                fieldworkImageUploadedAt: '2026-06-23T01:02:03.000Z',
                fieldworkImageUploadedUri: 'file:///tablet/photos/photo-1.jpg',
                fieldworkImageUploadTarget:
                    'https://field.example/files/fieldwork/photo-1?type=original_image',
                fieldworkImageUploadedProject: 'fieldwork',
                fieldworkImageUploadedMd5: 'tablet-md5'
            })
        ];

        const issues = getKoreanFieldworkReadinessIssues(documents as any);

        expect(issues.map((issue) => issue.ruleId)).toEqual([
            'fieldwork-photo-upload-missing'
        ]);
    });


    it('includes linked media backup issues in evidence bundles for report review', () => {

        const feature = makeDocument('feature-1', 'Feature');
        const photo = makeDocument('photo-1', 'Photo', {
            fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
            relations: { depicts: ['feature-1'] }
        });

        const bundle = buildEvidenceBundle(feature as any, [feature, photo] as any);

        expect(bundle.photos.length).toBe(1);
        expect(bundle.issues.some((issue) =>
            issue.documentId === 'photo-1'
            && issue.ruleId === 'fieldwork-photo-upload-missing'
        )).toBe(true);
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
