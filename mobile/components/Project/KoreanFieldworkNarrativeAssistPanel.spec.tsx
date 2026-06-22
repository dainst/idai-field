import { fireEvent, render } from '@testing-library/react-native';
import {
  CategoryForm,
  NewResource,
} from 'idai-field-core';
import React from 'react';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';
import KoreanFieldworkNarrativeAssistPanel from './KoreanFieldworkNarrativeAssistPanel';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('KoreanFieldworkNarrativeAssistPanel', () => {
  it('applies narrative snippets to the matching resource field', () => {
    const handleUpdateResourceField = jest.fn();
    const { getByTestId, getByText } = render(
      <KoreanFieldworkNarrativeAssistPanel
        category={createCategoryForm([
          'shortDescription',
          'description',
          'interpretation',
        ])}
        resource={createResource(C.FEATURE, {
          description: '기존 묘사.',
        })}
        onUpdateResourceField={handleUpdateResourceField}
      />
    );

    expect(getByText('서술 보조')).toBeTruthy();
    expect(getByText('짧은 설명')).toBeTruthy();
    expect(getByText('묘사')).toBeTruthy();
    expect(getByText('해석')).toBeTruthy();

    fireEvent.press(getByTestId('narrativeSnippet_feature-exposure'));

    expect(handleUpdateResourceField).toHaveBeenCalledWith(
      'description',
      '기존 묘사.\n평면 노출 상태, 경계의 명확성, 교란 여부를 확인함.'
    );
  });

  it('does not render when no narrative field is available', () => {
    const { queryByTestId } = render(
      <KoreanFieldworkNarrativeAssistPanel
        category={createCategoryForm(['featureRecordingStatus'])}
        resource={createResource(C.FEATURE)}
        onUpdateResourceField={jest.fn()}
      />
    );

    expect(queryByTestId('koreanFieldworkNarrativeAssistPanel')).toBeNull();
  });
});

const createCategoryForm = (fieldNames: string[]): CategoryForm => ({
  groups: [
    {
      name: 'fieldwork',
      fields: fieldNames.map((name) => ({ name })),
    },
  ],
} as CategoryForm);

const createResource = (
  category: string,
  extraResource: Record<string, unknown> = {}
): NewResource => ({
  identifier: `${category}-1`,
  category,
  relations: {},
  ...extraResource,
});
