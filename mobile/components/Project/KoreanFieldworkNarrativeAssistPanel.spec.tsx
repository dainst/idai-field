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
          description: '기존 설명.',
        })}
        onUpdateResourceField={handleUpdateResourceField}
      />
    );

    expect(getByText('서술 보조')).toBeTruthy();
    expect(getByText('짧은 설명')).toBeTruthy();
    expect(getByText('설명')).toBeTruthy();
    expect(getByText('해석')).toBeTruthy();

    fireEvent.press(getByTestId('narrativeSnippet_feature-exposure'));

    expect(handleUpdateResourceField).toHaveBeenCalledWith(
      'description',
      '기존 설명.\n평면 노출 상태, 경계의 명확성, 교란 여부를 확인함.'
    );
  });

  it('offers a field-note snippet that connects descriptions with sketches and rough measurements', () => {
    const handleUpdateResourceField = jest.fn();
    const { getByTestId, getByText } = render(
      <KoreanFieldworkNarrativeAssistPanel
        category={createCategoryForm(['description'])}
        resource={createResource(C.FEATURE)}
        onUpdateResourceField={handleUpdateResourceField}
      />
    );

    expect(getByText('유구 야장')).toBeTruthy();
    expect(getByText('스케치·약측')).toBeTruthy();

    fireEvent.press(getByTestId('narrativeSnippet_feature-field-note-flow'));

    expect(handleUpdateResourceField).toHaveBeenCalledWith(
      'description',
      expect.stringContaining('[사진·도면 번호] 사진 번호와 도면 번호를 서로 대조.')
    );
    expect(handleUpdateResourceField).toHaveBeenCalledWith(
      'description',
      expect.stringContaining('[스케치·약측] 약도/평면/단면 스케치 번호')
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
