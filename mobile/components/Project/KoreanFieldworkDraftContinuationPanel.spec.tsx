import { fireEvent, render } from '@testing-library/react-native';
import {
  CategoryForm,
  ProjectConfiguration,
} from 'idai-field-core';
import React from 'react';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';
import KoreanFieldworkDraftContinuationPanel from './KoreanFieldworkDraftContinuationPanel';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('KoreanFieldworkDraftContinuationPanel', () => {
  it('saves with the selected continuation target', () => {
    const handleSaveWithTarget = jest.fn();
    const { getByTestId, getByText } = render(
      <KoreanFieldworkDraftContinuationPanel
        categoryName={C.FEATURE}
        config={createConfig([[C.FEATURE_SEGMENT, C.FEATURE]])}
        onSaveWithTarget={handleSaveWithTarget}
      />
    );

    expect(getByText('저장 후 이어가기')).toBeTruthy();

    fireEvent.press(getByTestId('draftContinuation_next-child'));

    expect(handleSaveWithTarget).toHaveBeenCalledWith({
      mode: 'addChild',
      categoryName: C.FEATURE_SEGMENT,
    });
  });
});

const createConfig = (
  allowedChildParentPairs: [string, string][]
): ProjectConfiguration => {
  const allowed = new Set(allowedChildParentPairs.map(([child, parent]) =>
    `${child}:${parent}`
  ));

  return {
    getCategory: (categoryName: string) => ({
      name: categoryName,
      groups: [],
      mustLieWithin: false,
    } as unknown as CategoryForm),
    isAllowedRelationDomainCategory: (
      childCategoryName: string,
      parentCategoryName: string
    ) => allowed.has(`${childCategoryName}:${parentCategoryName}`),
  } as unknown as ProjectConfiguration;
};
