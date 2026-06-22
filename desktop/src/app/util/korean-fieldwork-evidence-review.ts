import {
    buildEvidenceBundle,
    Document,
    EvidenceBundle,
    KoreanFieldworkReadinessIssue
} from 'idai-field-core';

export interface KoreanFieldworkEvidenceReview extends EvidenceBundle {
    hasOpenIssues: boolean;
    reportReady: boolean;
    missingEvidenceKinds: string[];
}

export function makeKoreanFieldworkEvidenceReview(
        rootDocument: Document,
        documents: Document[]
): KoreanFieldworkEvidenceReview {

    const bundle = buildEvidenceBundle(rootDocument, documents);
    const missingEvidenceKinds = getMissingEvidenceKinds(bundle);

    return {
        ...bundle,
        hasOpenIssues: bundle.issues.length > 0,
        reportReady: bundle.issues.length === 0 && missingEvidenceKinds.length === 0,
        missingEvidenceKinds
    };
}

export function getIssueSummary(issues: KoreanFieldworkReadinessIssue[]): string[] {

    return issues.map((issue) => `${issue.identifier}: ${issue.recommendedAction}`);
}

function getMissingEvidenceKinds(bundle: EvidenceBundle): string[] {

    const missing: string[] = [];

    if (bundle.photos.length === 0 && bundle.soilProfilePhotos.length === 0) missing.push('photo');
    if (bundle.drawings.length === 0) missing.push('drawing');
    if (bundle.reportPreparationReviews.length === 0 && bundle.reportEditorialCrossChecks.length === 0) {
        missing.push('reportReview');
    }

    return missing;
}
