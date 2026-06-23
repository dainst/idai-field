import {
  fireEvent,
  render,
} from '@testing-library/react-native';
import {
  CategoryForm,
  createCategory,
  Forest,
  Labels,
  Tree,
} from 'idai-field-core';
import React from 'react';
import { ConfigurationContext } from '@/contexts/configuration-context';
import LabelsContext from '@/contexts/labels/labels-context';
import DocumentAddModal from './DocumentAddModal';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('DocumentAddModal', () => {
  it('asks for a feature type before creating a Feature record', () => {
    const onAddCategory = jest.fn();
    const parentDoc = {
      resource: {
        id: 'trench-1',
        identifier: 'T1',
        category: C.TRENCH,
        relations: {},
      },
    } as any;

    const { getByTestId, getByText } = render(
      <LabelsContext.Provider value={{ labels: new Labels(() => ['ko']) }}>
        <ConfigurationContext.Provider value={createConfig([
          createCategory(C.TRENCH),
          createCategory(C.FEATURE),
        ])}
        >
          <DocumentAddModal
            onAddCategory={onAddCategory}
            onClose={jest.fn()}
            parentDoc={parentDoc}
          />
        </ConfigurationContext.Provider>
      </LabelsContext.Provider>
    );

    fireEvent.press(getByTestId(`addCategory_${C.FEATURE}`));

    expect(getByText('유구 성격 선택')).toBeTruthy();

    fireEvent.press(getByTestId('featureType_pit'));

    expect(onAddCategory).toHaveBeenCalledWith(C.FEATURE, parentDoc, {
      featureType: 'pit',
    });
  });
});

const createConfig = (categories: Forest<CategoryForm>) => ({
  getCategories: () => categories,
  getCategory: (categoryName: string) =>
    Tree.flatten(categories).find((category) => category.name === categoryName),
  isAllowedRelationDomainCategory: (
    categoryName: string,
    parentCategoryName: string,
    relationName: string
  ) =>
    categoryName === C.FEATURE
    && parentCategoryName === C.TRENCH
    && relationName === 'liesWithin',
} as any);
