import {
  getKoreanFieldworkHierarchyLanes,
  KOREAN_FIELDWORK_HIERARCHY_CATEGORIES,
} from './korean-fieldwork-hierarchy';
import { Document } from 'idai-field-core';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('Korean fieldwork hierarchy lanes', () => {
  it('builds the scoped archaeological flow from operation to layer', () => {
    const operation = createDoc('operation-1', C.OPERATION, 'A구역');
    const trench = createDoc('trench-1', C.TRENCH, 'T1', {
      isRecordedIn: [operation.resource.id],
    });
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1', {
      liesWithin: [trench.resource.id],
    });
    const segment = createDoc('segment-1', C.FEATURE_SEGMENT, '피트 1', {
      liesWithin: [feature.resource.id],
    });
    const layer = createDoc('layer-1', C.LAYER, '토층 1', {
      liesWithin: [segment.resource.id],
    });
    const unrelatedFeature = createDoc('feature-2', C.FEATURE, '다른 유구');
    const documents = [
      operation,
      trench,
      feature,
      segment,
      layer,
      unrelatedFeature,
    ];
    const documentsById = new Map(documents.map((document) => [
      document.resource.id,
      document,
    ]));

    const lanes = getKoreanFieldworkHierarchyLanes(
      documents,
      documentsById,
      trench,
      { [feature.resource.id]: 2 }
    );

    expect(lanes.map((lane) => lane.categoryName)).toEqual(
      KOREAN_FIELDWORK_HIERARCHY_CATEGORIES
    );
    expect(getLane(lanes, C.OPERATION).items[0]).toMatchObject({
      document: operation,
      childCount: 1,
      isCurrentScope: false,
    });
    expect(getLane(lanes, C.TRENCH).items[0]).toMatchObject({
      document: trench,
      childCount: 1,
      isCurrentScope: true,
    });
    expect(getLane(lanes, C.FEATURE).items.map((item) =>
      item.document.resource.identifier
    )).toEqual(['수혈 1']);
    expect(getLane(lanes, C.FEATURE).items[0].issueCount).toBe(2);
    expect(getLane(lanes, C.FEATURE_SEGMENT).label).toBe('피트');
    expect(getLane(lanes, C.LAYER).items[0].parentIdentifier).toBe('피트 1');
  });

  it('limits visible items while preserving the total count', () => {
    const features = Array.from({ length: 6 }, (_, index) =>
      createDoc(`feature-${index}`, C.FEATURE, `유구 ${index}`)
    );
    const documentsById = new Map(features.map((document) => [
      document.resource.id,
      document,
    ]));

    const lanes = getKoreanFieldworkHierarchyLanes(
      features,
      documentsById,
      undefined,
      {},
      3
    );

    expect(getLane(lanes, C.FEATURE).totalCount).toBe(6);
    expect(getLane(lanes, C.FEATURE).items).toHaveLength(3);
    expect(getLane(lanes, C.FEATURE).hiddenCount).toBe(3);
  });
});

const getLane = (
  lanes: ReturnType<typeof getKoreanFieldworkHierarchyLanes>,
  categoryName: string
) => {
  const lane = lanes.find((candidate) => candidate.categoryName === categoryName);
  if (!lane) throw new Error(`Missing lane ${categoryName}`);
  return lane;
};

const createDoc = (
  id: string,
  category: string,
  identifier: string,
  relations: Record<string, string[]> = {}
): Document => ({
  _id: id,
  resource: {
    id,
    identifier,
    category,
    relations,
  },
  created: { user: 'test', date: new Date(0) },
  modified: [],
});
