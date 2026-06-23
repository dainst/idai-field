import { KoreanFieldworkReadinessIssue } from 'idai-field-core';

export type KoreanFieldworkCloseoutStatus = 'clear'|'needsReview'|'blocked';

export interface KoreanFieldworkCloseoutCounts {
  critical: number;
  warning: number;
  info: number;
}

export interface KoreanFieldworkCloseoutSummary {
  status: KoreanFieldworkCloseoutStatus;
  title: string;
  detail: string;
  counts: KoreanFieldworkCloseoutCounts;
  issues: KoreanFieldworkReadinessIssue[];
}

const SEVERITY_ORDER: Record<KoreanFieldworkReadinessIssue['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export const getKoreanFieldworkCloseoutSummary = (
  issues: KoreanFieldworkReadinessIssue[],
  maxIssues = 4
): KoreanFieldworkCloseoutSummary => {
  const counts = getIssueCounts(issues);
  const sortedIssues = [...issues].sort(compareIssues);

  if (counts.critical > 0) {
    return {
      status: 'blocked',
      title: '마감 보완',
      detail: `중대 누락 ${counts.critical}건을 먼저 확인해야 합니다.`,
      counts,
      issues: sortedIssues.slice(0, maxIssues),
    };
  }

  if (counts.warning + counts.info > 0) {
    return {
      status: 'needsReview',
      title: '마감 전 확인',
      detail: `주의 ${counts.warning}건, 참고 ${counts.info}건이 남아 있습니다.`,
      counts,
      issues: sortedIssues.slice(0, maxIssues),
    };
  }

  return {
    status: 'clear',
    title: '마감 가능',
    detail: '현재 기록 기준으로 남은 점검 항목이 없습니다.',
    counts,
    issues: [],
  };
};

const getIssueCounts = (
  issues: KoreanFieldworkReadinessIssue[]
): KoreanFieldworkCloseoutCounts => issues.reduce((counts, issue) => ({
  ...counts,
  [issue.severity]: counts[issue.severity] + 1,
}), {
  critical: 0,
  warning: 0,
  info: 0,
});

const compareIssues = (
  issueA: KoreanFieldworkReadinessIssue,
  issueB: KoreanFieldworkReadinessIssue
): number => {
  const severityDiff = SEVERITY_ORDER[issueA.severity]
    - SEVERITY_ORDER[issueB.severity];
  if (severityDiff !== 0) return severityDiff;

  return issueA.identifier.localeCompare(issueB.identifier)
    || issueA.ruleId.localeCompare(issueB.ruleId);
};
