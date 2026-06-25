import {
  getKoreanFieldworkScopedDocuments,
  isKoreanFieldworkDocumentAncestorOfScope,
  isKoreanFieldworkDocumentInScope,
} from './korean-fieldwork-scope';
import { Document } from 'idai-field-core';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('Korean fieldwork scope helpers', () => {
  it('keeps the selected fieldwork unit and its descendants in scope', () => {
    const operation = createDoc('operation-1', C.OPERATION, 'operation-1');
    const trench = createDoc('trench-1', C.TRENCH, 'trench-1', {
      liesWithin: [operation.resource.id],
    });
    const feature = createDoc('feature-1', C.FEATURE, 'feature-1', {
      liesWithin: [trench.resource.id],
    });
    const photo = createDoc('photo-1', C.PHOTO, 'photo-1', {
      depicts: [feature.resource.id],
    });
    const otherTrench = createDoc('trench-2', C.TRENCH, 'trench-2', {
      liesWithin: [operation.resource.id],
    });
    const documents = [operation, trench, feature, photo, otherTrench];
    const documentsById = toDocumentMap(documents);

    expect(getKoreanFieldworkScopedDocuments(
      documents,
      trench,
      documentsById
    ).map((document) => document.resource.id)).toEqual([
      'trench-1',
      'feature-1',
      'photo-1',
    ]);
  });

  it('can include ancestors when a board needs context lanes', () => {
    const operation = createDoc('operation-1', C.OPERATION, 'operation-1');
    const trench = createDoc('trench-1', C.TRENCH, 'trench-1', {
      liesWithin: [operation.resource.id],
    });
    const feature = createDoc('feature-1', C.FEATURE, 'feature-1', {
      liesWithin: [trench.resource.id],
    });
    const documents = [operation, trench, feature];

    expect(getKoreanFieldworkScopedDocuments(
      documents,
      trench,
      toDocumentMap(documents),
      { includeAncestors: true }
    ).map((document) => document.resource.id)).toEqual([
      'operation-1',
      'trench-1',
      'feature-1',
    ]);
  });

  it('keeps direct children scoped even when the scope parent is not in the document map', () => {
    const trench = createDoc('trench-1', C.TRENCH, 'trench-1');
    const feature = createDoc('feature-1', C.FEATURE, 'feature-1', {
      liesWithin: [trench.resource.id],
    });
    const segment = createDoc('segment-1', C.FEATURE_SEGMENT, 'segment-1', {
      liesWithin: [feature.resource.id],
    });
    const documents = [feature, segment];

    expect(getKoreanFieldworkScopedDocuments(
      documents,
      trench,
      toDocumentMap(documents)
    ).map((document) => document.resource.id)).toEqual([
      'feature-1',
      'segment-1',
    ]);
  });

  it('guards against circular parent relations', () => {
    const trench = createDoc('trench-1', C.TRENCH, 'trench-1', {
      liesWithin: ['feature-1'],
    });
    const feature = createDoc('feature-1', C.FEATURE, 'feature-1', {
      liesWithin: ['trench-1'],
    });
    const documents = [trench, feature];
    const documentsById = toDocumentMap(documents);

    expect(isKoreanFieldworkDocumentInScope(feature, trench, documentsById))
      .toBe(true);
    expect(isKoreanFieldworkDocumentAncestorOfScope(feature, trench, documentsById))
      .toBe(true);
  });
});

const toDocumentMap = (documents: Document[]) => new Map(documents.map((document) => [
  document.resource.id,
  document,
]));

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
