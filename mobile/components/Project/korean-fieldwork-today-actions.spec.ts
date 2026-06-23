import {
  getKoreanFieldworkPriorityTasks,
  getKoreanFieldworkQuickActionStates,
  getKoreanFieldworkTodayActionTargets,
} from './korean-fieldwork-today-actions';
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

  it('builds actionable startup tasks for missing tablet field records', () => {
    const operation = createDoc('operation-1', C.OPERATION);
    const tasks = getKoreanFieldworkPriorityTasks(
      createSummary() as any,
      [operation] as any
    );

    expect(tasks.map((task) => task.id)).toEqual([
      'create-daily-log',
      'create-survey-boundary',
      'create-trench',
      'create-detected-feature',
    ]);
    expect(tasks[0].action).toEqual({
      type: 'createDocument',
      parentDocumentId: 'operation-1',
      categoryName: C.DAILY_LOG,
    });
    expect(tasks[3].action).toEqual({
      type: 'createDocument',
      parentDocumentId: 'operation-1',
      categoryName: C.FEATURE,
    });
  });

  it('uses trench as the parent for the feature candidate priority task', () => {
    const operation = createDoc('operation-1', C.OPERATION);
    const trench = createDoc('trench-1', C.TRENCH);
    const tasks = getKoreanFieldworkPriorityTasks(
      createSummary() as any,
      [operation, trench] as any
    );

    expect(tasks.find((task) =>
      task.id === 'create-detected-feature'
    )?.action).toEqual({
      type: 'createDocument',
      parentDocumentId: 'trench-1',
      categoryName: C.FEATURE,
    });
  });

  it('does not restart the project when the current scoped parent is a trench', () => {
    const trench = createDoc('trench-1', C.TRENCH);
    const tasks = getKoreanFieldworkPriorityTasks(
      createSummary() as any,
      [trench] as any
    );

    expect(tasks.map((task) => task.id)).toEqual(['create-detected-feature']);
    expect(tasks[0].action).toEqual({
      type: 'createDocument',
      parentDocumentId: 'trench-1',
      categoryName: C.FEATURE,
    });
  });

  it('keeps quick actions scoped to the current trench', () => {
    const trench = createDoc('trench-1', C.TRENCH);
    const summary = createSummary();
    const targets = getKoreanFieldworkTodayActionTargets(
      summary as any,
      [trench] as any
    );

    expect(getKoreanFieldworkQuickActionStates(
      summary as any,
      targets,
      trench as any
    )).toMatchObject({
      dailyLog: {
        detail: '상위 조사구역에서 작성',
        disabled: true,
      },
      featureCandidate: {
        detail: '유구 추가',
        action: {
          type: 'createDocument',
          parentDocumentId: 'trench-1',
          categoryName: C.FEATURE,
        },
        disabled: false,
      },
      closeout: {
        detail: '현재 문제 없음',
        disabled: true,
      },
    });
  });

  it('lets operation scopes create daily logs from the quick action row', () => {
    const operation = createDoc('operation-1', C.OPERATION);
    const summary = createSummary();
    const targets = getKoreanFieldworkTodayActionTargets(
      summary as any,
      [operation] as any
    );

    expect(getKoreanFieldworkQuickActionStates(
      summary as any,
      targets,
      operation as any
    ).dailyLog).toMatchObject({
      detail: '바로 작성',
      action: {
        type: 'createDocument',
        parentDocumentId: 'operation-1',
        categoryName: C.DAILY_LOG,
      },
      disabled: false,
    });
  });

  it('adds issue tasks that open the affected document', () => {
    const operation = createDoc('operation-1', C.OPERATION);
    const sample = createDoc('sample-1', C.SAMPLE);
    const summary = createSummary({
      dailyLogs: [createDoc('daily-log-1', C.DAILY_LOG)],
      surveyBoundaries: [createDoc('boundary-1', C.SURVEY_BOUNDARY)],
      openIssues: [{
        documentId: 'sample-1',
        identifier: 'sample-1',
        recommendedAction: '시료 목적을 기록하세요.',
        ruleId: 'sample-purpose',
        severity: 'warning',
      }],
    });

    const tasks = getKoreanFieldworkPriorityTasks(
      summary as any,
      [operation, sample, createDoc('trench-1', C.TRENCH)] as any
    );

    expect(tasks.find((task) =>
      task.id === 'issue-sample-1-sample-purpose'
    )?.action).toEqual({
      type: 'openDocument',
      documentId: 'sample-1',
    });
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
