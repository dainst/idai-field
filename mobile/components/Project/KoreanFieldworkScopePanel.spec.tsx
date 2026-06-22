import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import KoreanFieldworkScopePanel, { getScopeStats } from './KoreanFieldworkScopePanel';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('KoreanFieldworkScopePanel', () => {
  it('uses the primary operation as the add target from the full project scope', () => {
    const operation = createDoc('operation-1', C.OPERATION, '조사구역 1');
    const handleAddChild = jest.fn();
    const { getByTestId, getByText, queryByTestId } = render(
      <KoreanFieldworkScopePanel
        documents={[
          operation,
          createDoc('trench-1', C.TRENCH, 'T1'),
          createDoc('photo-1', C.PHOTO, '사진 1'),
        ]}
        hierarchyPath={[]}
        issueCount={1}
        onAddChild={handleAddChild}
        onBackScope={jest.fn()}
        onClearScope={jest.fn()}
        onOpenMap={jest.fn()}
      />
    );

    expect(getByText('전체 조사자료')).toBeTruthy();
    expect(queryByTestId('scopeBack')).toBeNull();
    expect(queryByTestId('scopeClear')).toBeNull();

    fireEvent.press(getByTestId('scopeAddChild'));

    expect(handleAddChild).toHaveBeenCalledWith(operation);
  });

  it('shows nested fieldwork scope controls and adds below the current parent', () => {
    const operation = createDoc('operation-1', C.OPERATION, '조사구역 1');
    const trench = createDoc('trench-1', C.TRENCH, 'T1');
    const handleAddChild = jest.fn();
    const handleBackScope = jest.fn();
    const handleClearScope = jest.fn();
    const { getByTestId, getByText } = render(
      <KoreanFieldworkScopePanel
        documents={[
          createDoc('feature-1', C.FEATURE, '유구 1'),
          createDoc('sample-1', C.SAMPLE, '시료 1'),
        ]}
        hierarchyPath={[operation, trench]}
        issueCount={0}
        onAddChild={handleAddChild}
        onBackScope={handleBackScope}
        onClearScope={handleClearScope}
        onOpenMap={jest.fn()}
      />
    );

    expect(getByText('트렌치/조사갱 · T1')).toBeTruthy();

    fireEvent.press(getByTestId('scopeAddChild'));
    fireEvent.press(getByTestId('scopeBack'));
    fireEvent.press(getByTestId('scopeClear'));

    expect(handleAddChild).toHaveBeenCalledWith(trench);
    expect(handleBackScope).toHaveBeenCalledTimes(1);
    expect(handleClearScope).toHaveBeenCalledTimes(1);
  });

  it('counts structure, evidence, review, and issue records for the current scope', () => {
    expect(getScopeStats([
      createDoc('trench-1', C.TRENCH, 'T1'),
      createDoc('feature-1', C.FEATURE, '유구 1'),
      createDoc('photo-1', C.PHOTO, '사진 1'),
      createDoc('find-1', C.FIND, '유물 1'),
      createDoc('daily-log-1', C.DAILY_LOG, '작업일지'),
    ] as any, 2)).toEqual([
      { label: '구조', value: 2 },
      { label: '증거', value: 2 },
      { label: '일지·점검', value: 1 },
      { label: '확인', value: 2 },
    ]);
  });
});

const createDoc = (
  id: string,
  category: string,
  identifier: string
) => ({
  resource: {
    id,
    identifier,
    category,
    relations: {},
  },
} as any);
