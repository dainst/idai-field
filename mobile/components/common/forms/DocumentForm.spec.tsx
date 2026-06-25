import { fireEvent, render } from '@testing-library/react-native';
import { CategoryForm } from 'idai-field-core';
import React from 'react';
import LabelsContext from '@/contexts/labels/labels-context';
import DocumentForm from './DocumentForm';

jest.mock('dateformat', () => jest.fn(() => '2026-01-01'));
jest.mock('expo-barcode-scanner');
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  },
  CameraView: 'CameraView',
}));
jest.mock('@/components/Project/ScanBarcodeButton', () => () => null);

describe('DocumentForm Korean fieldwork detail fields', () => {
  it('does not show empty raw-data groups as selectable detail tabs for ordinary forms', () => {
    const { getByTestId, queryByTestId } = renderDocumentForm(
      createCategoryForm([
        {
          name: 'hierarchy',
          fields: [{ name: 'liesWithin', inputType: 'relation', editable: false }],
        },
        {
          name: 'workflow',
          fields: [],
        },
        {
          name: 'stem',
          fields: [{ name: 'identifier', inputType: 'input', editable: true }],
        },
      ], 'Pottery'),
      { identifier: 'F-001' },
      false
    );

    expect(getByTestId('fullFormGroups')).toBeTruthy();
    expect(getByTestId('groupSelect_stem')).toBeTruthy();
    expect(queryByTestId('groupSelect_hierarchy')).toBeNull();
    expect(queryByTestId('groupSelect_workflow')).toBeNull();
    expect(getByTestId('inputField_identifier')).toBeTruthy();
  });

  it('hides managed fieldwork core fields from detail tabs even without trigger fields', () => {
    const { queryByTestId, queryByText } = renderDocumentForm(
      createCategoryForm([
        {
          name: 'stem',
          fields: [{ name: 'identifier', inputType: 'input', editable: true }],
        },
        {
          name: 'hierarchy',
          fields: [{ name: 'liesWithin', inputType: 'relation', editable: true }],
        },
      ]),
      { identifier: 'F-001', relations: { liesWithin: ['trench-1'] } },
      false
    );

    expect(queryByText('가져온 기존 항목')).toBeNull();
    expect(queryByTestId('fullFormToggle')).toBeNull();
    expect(queryByTestId('groupSelect_stem')).toBeNull();
    expect(queryByTestId('groupSelect_hierarchy')).toBeNull();
  });

  it('omits the raw-data vault when there are no editable raw fields', () => {
    const { queryByText, queryByTestId } = renderDocumentForm(
      createCategoryForm([
        {
          name: 'hierarchy',
          fields: [{ name: 'liesWithin', inputType: 'relation', editable: false }],
        },
        {
          name: 'workflow',
          fields: [],
        },
      ]),
      {},
      true
    );

    expect(queryByText('가져온 기존 항목')).toBeNull();
    expect(queryByTestId('fullFormToggle')).toBeNull();
  });

  it('keeps empty auxiliary raw-data groups out of the tablet detail form', () => {
    const { getByTestId, queryByTestId } = renderDocumentForm(
      createCategoryForm([
        {
          name: 'stem',
          fields: [{ name: 'identifier', inputType: 'input', editable: true }],
        },
        {
          name: 'identification',
          fields: [{ name: 'externalIdentifier', inputType: 'input', editable: true }],
        },
        {
          name: 'inventory',
          fields: [{ name: 'inventoryNumber', inputType: 'input', editable: true }],
        },
      ], 'Pottery'),
      { identifier: 'F-001' },
      false
    );

    expect(getByTestId('groupSelect_stem')).toBeTruthy();
    expect(queryByTestId('groupSelect_identification')).toBeNull();
    expect(queryByTestId('groupSelect_inventory')).toBeNull();
  });

  it('keeps auxiliary iDAI raw-data groups hidden even when imported values are present', () => {
    const { queryByTestId } = renderDocumentForm(
      createCategoryForm([
        {
          name: 'stem',
          fields: [{ name: 'identifier', inputType: 'input', editable: true }],
        },
        {
          name: 'identification',
          fields: [{ name: 'externalIdentifier', inputType: 'input', editable: true }],
        },
      ], 'Pottery'),
      {
        identifier: 'F-001',
        externalIdentifier: 'legacy-27',
      },
      false
    );

    expect(queryByTestId('groupSelect_identification')).toBeNull();
  });

  it('keeps the raw-data vault collapsed until explicitly opened', () => {
    const { getByTestId, getByText, queryByTestId } = renderDocumentForm(
      createCategoryForm([
        {
          name: 'stem',
          fields: [{ name: 'identifier', inputType: 'input', editable: true }],
        },
      ], 'Pottery'),
      { identifier: 'F-001' },
      true
    );

    expect(getByText('가져온 기존 항목')).toBeTruthy();
    expect(getByText('필요할 때만 열기')).toBeTruthy();
    expect(queryByTestId('groupSelect_stem')).toBeNull();

    fireEvent.press(getByTestId('fullFormToggle'));

    expect(getByTestId('groupSelect_stem')).toBeTruthy();
  });

  it('does not expose Korean quick-record fields as auxiliary raw inputs', () => {
    const { queryByTestId, queryByText } = renderDocumentForm(
      createCategoryForm([
        {
          name: 'stem',
          fields: [
            { name: 'identifier', inputType: 'input', editable: true },
            { name: 'description', inputType: 'input', editable: true },
          ],
        },
        {
          name: 'koreanFieldwork',
          fields: [
            { name: 'period', inputType: 'dropdown', editable: true },
            { name: 'featureType', inputType: 'input', editable: true },
          ],
        },
      ]),
      {
        identifier: 'F-001',
        description: '평면 윤곽 확인 중',
        period: 'joseon',
        featureType: 'kiln',
      },
      true
    );

    expect(queryByText('가져온 기존 항목')).toBeNull();
    expect(queryByTestId('fullFormToggle')).toBeNull();
  });

  it('keeps blank non-panel fields out of the Korean fieldwork auxiliary form', () => {
    const { queryByText, queryByTestId } = renderDocumentForm(
      createCategoryForm([
        {
          name: 'stem',
          fields: [{ name: 'freeDescription', inputType: 'input', editable: true }],
        },
        {
          name: 'koreanFieldwork',
          fields: [{ name: 'period', inputType: 'dropdown', editable: true }],
        },
      ]),
      {
        period: 'joseon',
        freeDescription: '',
      },
      true
    );

    expect(queryByText('가져온 기존 항목')).toBeNull();
    expect(queryByTestId('fullFormToggle')).toBeNull();
    expect(queryByTestId('groupSelect_stem')).toBeNull();
  });

  it('shows imported non-panel values only as collapsed auxiliary fields', () => {
    const { getByTestId, getByText, queryByTestId } = renderDocumentForm(
      createCategoryForm([
        {
          name: 'stem',
          fields: [{ name: 'freeDescription', inputType: 'input', editable: true }],
        },
        {
          name: 'koreanFieldwork',
          fields: [{ name: 'period', inputType: 'dropdown', editable: true }],
        },
      ]),
      {
        period: 'joseon',
        freeDescription: 'Legacy import note',
      },
      true
    );

    expect(getByText('가져온 기존 항목')).toBeTruthy();
    expect(getByText('필요할 때만 열기')).toBeTruthy();
    expect(queryByTestId('groupSelect_stem')).toBeNull();

    fireEvent.press(getByTestId('fullFormToggle'));

    expect(getByTestId('groupSelect_stem')).toBeTruthy();
    expect(getByTestId('inputField_freeDescription')).toBeTruthy();
  });

  it('shows only imported fields that already have values in the auxiliary form', () => {
    const { getByTestId, queryByTestId } = renderDocumentForm(
      createCategoryForm([
        {
          name: 'stem',
          fields: [
            { name: 'freeDescription', inputType: 'input', editable: true },
            { name: 'emptyLegacyNote', inputType: 'input', editable: true },
          ],
        },
        {
          name: 'koreanFieldwork',
          fields: [{ name: 'period', inputType: 'dropdown', editable: true }],
        },
      ]),
      {
        period: 'joseon',
        freeDescription: 'Legacy import note',
        emptyLegacyNote: '',
      },
      true
    );

    fireEvent.press(getByTestId('fullFormToggle'));

    expect(getByTestId('inputField_freeDescription')).toBeTruthy();
    expect(queryByTestId('inputField_emptyLegacyNote')).toBeNull();
  });

  it('does not expose feature-specific attribute fields as auxiliary raw inputs', () => {
    const { queryByTestId, queryByText } = renderDocumentForm(
      createCategoryForm([
        {
          name: 'koreanFieldwork',
          fields: [
            { name: 'pitDwellingExposureBaulk', inputType: 'checkboxes', editable: true },
            { name: 'potteryKilnIdentification', inputType: 'checkboxes', editable: true },
          ],
        },
      ]),
      {
        pitDwellingExposureBaulk: ['initialStratigraphyChecked'],
        potteryKilnIdentification: ['firingFeature'],
      },
      true
    );

    expect(queryByText('가져온 기존 항목')).toBeNull();
    expect(queryByTestId('fullFormToggle')).toBeNull();
  });
});

const renderDocumentForm = (
  category: CategoryForm,
  resource: Record<string, unknown>,
  collapseFormFieldsByDefault: boolean
) => render(
  <LabelsContext.Provider
    value={{
      labels: {
        get: getLabel,
        getLabelAndDescription: (item: { name?: string }) => ({
          label: getLabel(item),
        }),
      } as any,
    }}
  >
    <DocumentForm
      category={category}
      collapseFormFieldsByDefault={collapseFormFieldsByDefault}
      headerText="유구 편집"
      returnBtnHandler={jest.fn()}
      titleBarRight={null}
      resource={{
        category: category.name,
        relations: {},
        ...resource,
      } as any}
      updateFunction={jest.fn()}
    />
  </LabelsContext.Provider>
);

const createCategoryForm = (
  groups: CategoryForm['groups'],
  name: string = 'Feature'
): CategoryForm => ({
  name,
  color: '#175cd3',
  groups,
} as any);

const getLabel = (item: { name?: string }): string => {
  switch (item.name) {
    case 'stem':
      return '핵심 정보';
    case 'hierarchy':
      return '포함 관계 원자료';
    case 'workflow':
      return '연결 기록 원자료';
    default:
      return item.name ?? '';
  }
};
