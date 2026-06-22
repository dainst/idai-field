import { getKoreanFieldworkTodayActionTargets } from './korean-fieldwork-today-actions';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('Korean fieldwork today actions', () => {
  it('targets existing daily log, feature candidate, and first issue document', () => {
    const operation = createDoc('operation-1', C.OPERATION);
    const dailyLog = createDoc('daily-log-1', C.DAILY_LOG);
    const candidate = createDoc('feature-1', C.FEATURE, {
      featureRecordingStatus: 'candidate',
    });
    const sample = createDoc('sample-1', C.SAMPLE);
    const summary = createSummary({
      dailyLogs: [dailyLog],
      featureCandidates: [candidate],
      openIssues: [{
        documentId: 'sample-1',
        ruleId: 'sample-purpose',
      }],
    });

    expect(getKoreanFieldworkTodayActionTargets(
      summary as any,
      [operation, dailyLog, candidate, sample] as any
    )).toMatchObject({
      primaryOperation: operation,
      dailyLog,
      featureCandidate: candidate,
      issueDocument: sample,
    });
  });

  it('uses trench before feature group or operation for new feature candidates', () => {
    const operation = createDoc('operation-1', C.OPERATION);
    const featureGroup = createDoc('feature-group-1', C.FEATURE_GROUP);
    const trench = createDoc('trench-1', C.TRENCH);
    const summary = createSummary();

    const targets = getKoreanFieldworkTodayActionTargets(
      summary as any,
      [operation, featureGroup, trench] as any
    );

    expect(targets.primaryOperation).toBe(operation);
    expect(targets.featureDraftParent).toBe(trench);
  });

  it('falls back to feature group and then operation when creating feature candidates', () => {
    const operation = createDoc('operation-1', C.OPERATION);
    const featureGroup = createDoc('feature-group-1', C.FEATURE_GROUP);

    expect(getKoreanFieldworkTodayActionTargets(
      createSummary() as any,
      [operation, featureGroup] as any
    ).featureDraftParent).toBe(featureGroup);

    expect(getKoreanFieldworkTodayActionTargets(
      createSummary() as any,
      [operation] as any
    ).featureDraftParent).toBe(operation);
  });
});

const createSummary = (overrides: Record<string, unknown> = {}) => ({
  dailyLogs: [],
  surveyBoundaries: [],
  featureCandidates: [],
  openIssues: [],
  issueCountByDocumentId: {},
  ...overrides,
});

const createDoc = (
  id: string,
  category: string,
  extraResource: Record<string, unknown> = {}
) => ({
  resource: {
    id,
    identifier: id,
    category,
    relations: {},
    ...extraResource,
  },
});
