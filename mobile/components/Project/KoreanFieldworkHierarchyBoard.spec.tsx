import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Document } from 'idai-field-core';
import KoreanFieldworkHierarchyBoard from './KoreanFieldworkHierarchyBoard';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('KoreanFieldworkHierarchyBoard', () => {
  it('renders scoped hierarchy lanes and opens item actions', () => {
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
    const documents = [operation, trench, feature, segment];
    const documentsById = new Map(documents.map((document) => [
      document.resource.id,
      document,
    ]));
    const handleOpen = jest.fn();
    const handleDrillDown = jest.fn();
    const handleAddChild = jest.fn();
    const { getAllByText, getByLabelText, getByTestId, getByText } = render(
      <KoreanFieldworkHierarchyBoard
        documents={documents}
        documentsById={documentsById}
        hierarchyPath={[operation, trench]}
        issueCountByDocumentId={{ [feature.resource.id]: 1 }}
        onOpenDocument={handleOpen}
        onDrillDown={handleDrillDown}
        onAddChild={handleAddChild}
      />
    );

    expect(getByTestId('koreanFieldworkHierarchyBoard')).toBeTruthy();
    expect(getByText('이어진 기록')).toBeTruthy();
    expect(getAllByText('T1').length).toBeGreaterThan(0);
    expect(getByText('수혈 1')).toBeTruthy();
    expect(getByText('피트')).toBeTruthy();

    fireEvent.press(getByText('수혈 1'));
    fireEvent.press(getByLabelText('수혈 1 이어진 기록 보기'));
    fireEvent.press(getByLabelText('수혈 1 이어 만들 기록 추가'));

    expect(handleOpen).toHaveBeenCalledWith(feature);
    expect(handleDrillDown).toHaveBeenCalledWith(feature);
    expect(handleAddChild).toHaveBeenCalledWith(feature);
  });
});

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
