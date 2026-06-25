import {
    Document,
    getKoreanFieldworkTodaySummary,
    KoreanFieldworkReadinessIssue
} from 'idai-field-core';


export interface KoreanFieldworkTodayStats {
    dailyLogCount: number;
    surveyBoundaryCount: number;
    featureCandidateCount: number;
    openIssueCount: number;
    criticalIssueCount: number;
    warningIssueCount: number;
    infoIssueCount: number;
    statusLabel: string;
    statusTone: 'success'|'warning'|'info';
    priorityIssues: KoreanFieldworkPriorityIssue[];
    issueCountByDocumentId: Record<string, number>;
}

export interface KoreanFieldworkPriorityIssue {
    documentId: string;
    identifier: string;
    category: string;
    severity: KoreanFieldworkReadinessIssue['severity'];
    message: string;
    recommendedAction: string;
}


export function makeKoreanFieldworkTodayStats(documents: Document[]): KoreanFieldworkTodayStats {

    const summary = getKoreanFieldworkTodaySummary(documents);
    const criticalIssueCount = countIssuesBySeverity(summary.openIssues, 'critical');
    const warningIssueCount = countIssuesBySeverity(summary.openIssues, 'warning');
    const infoIssueCount = countIssuesBySeverity(summary.openIssues, 'info');

    return {
        dailyLogCount: summary.dailyLogs.length,
        surveyBoundaryCount: summary.surveyBoundaries.length,
        featureCandidateCount: summary.featureCandidates.length,
        openIssueCount: summary.openIssues.length,
        criticalIssueCount,
        warningIssueCount,
        infoIssueCount,
        priorityIssues: getPriorityIssues(summary.openIssues),
        issueCountByDocumentId: getIssueCountByDocumentId(summary.openIssues),
        ...getStatus(summary.openIssues.length, summary.featureCandidates.length)
    };
}


function countIssuesBySeverity(
        issues: KoreanFieldworkReadinessIssue[],
        severity: KoreanFieldworkReadinessIssue['severity']
): number {

    return issues.filter(issue => issue.severity === severity).length;
}

function getPriorityIssues(issues: KoreanFieldworkReadinessIssue[], limit: number = 4): KoreanFieldworkPriorityIssue[] {

    return issues
        .slice()
        .sort(compareIssuesByPriority)
        .slice(0, limit)
        .map(issue => ({
            documentId: issue.documentId,
            identifier: issue.identifier,
            category: issue.category,
            severity: issue.severity,
            message: issue.message,
            recommendedAction: issue.recommendedAction
        }));
}

function getIssueCountByDocumentId(issues: KoreanFieldworkReadinessIssue[]): Record<string, number> {

    return issues.reduce((result: Record<string, number>, issue) => ({
        ...result,
        [issue.documentId]: (result[issue.documentId] ?? 0) + 1
    }), {});
}

function compareIssuesByPriority(
        issueA: KoreanFieldworkReadinessIssue,
        issueB: KoreanFieldworkReadinessIssue
): number {

    return getSeverityPriority(issueA.severity) - getSeverityPriority(issueB.severity)
        || issueA.identifier.localeCompare(issueB.identifier, 'ko')
        || issueA.ruleId.localeCompare(issueB.ruleId);
}

function getSeverityPriority(severity: KoreanFieldworkReadinessIssue['severity']): number {

    switch (severity) {
        case 'critical':
            return 0;
        case 'warning':
            return 1;
        case 'info':
            return 2;
    }
}


function getStatus(openIssueCount: number,
                   featureCandidateCount: number): Pick<KoreanFieldworkTodayStats, 'statusLabel'|'statusTone'> {

    if (openIssueCount > 0) {
        return {
            statusLabel: '보완 필요',
            statusTone: 'warning'
        };
    }

    if (featureCandidateCount > 0) {
        return {
            statusLabel: '조사 진행',
            statusTone: 'info'
        };
    }

    return {
        statusLabel: '마감 안정',
        statusTone: 'success'
    };
}
