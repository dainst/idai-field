import {
  cleanup,
  fireEvent,
  render,
  RenderAPI,
  waitFor,
} from '@testing-library/react-native';
import {
  CategoryForm,
  createCategory,
  Forest,
  IdGenerator,
  Labels,
  NewDocument,
  PouchdbDatastore,
  ProjectConfiguration,
} from 'idai-field-core';
import PouchDB from 'pouchdb-node';
import React from 'react';
import { t2 } from '@/test_data/test_docs/t2';
import { ConfigurationContext } from '@/contexts/configuration-context';
import LabelsContext from '@/contexts/labels/labels-context';
import { PreferencesContext } from '@/contexts/preferences-context';
import { ProjectContext } from '@/contexts/project-context';
import { Preferences } from '@/models/preferences';
import { DocumentRepository } from '@/repositories/document-repository';
import loadConfiguration from '@/services/config/load-configuration';
import { ToastProvider } from '@/components/common/Toast/ToastProvider';
import DocumentAdd from '@/app/(tabs)/ProjectScreen/DocumentAdd';
import { defaultMapSettings } from '@/components/Project/Map/map-settings';

const category = 'Pottery';

const mockNavigate = jest.fn();
const mockUseGlobalSearchParams = jest.fn();
const setCurrentProject = jest.fn();
const setUsername = jest.fn();
const setProjectSettings = jest.fn();
const setLanguages = jest.fn();
const removeProject = jest.fn();
const setMapSettings = jest.fn();
const getMapSettings = jest.fn();
const setMapProviderSettings = jest.fn();

jest.mock('@/repositories/document-repository');
jest.mock('@/contexts/project-context', () => {
  const React = require('react');
  return { ProjectContext: React.createContext(null) };
});
jest.mock('dateformat', () => jest.fn(() => '2026-01-01'));
jest.mock('expo-barcode-scanner');
jest.mock('expo-router', () => ({
  router: { navigate: (...args: any[]) => mockNavigate(...args) },
  useGlobalSearchParams: () => mockUseGlobalSearchParams(),
}));

describe('DocumentAdd', () => {
  let project: string;
  let preferences: Preferences;
  let repository: DocumentRepository;
  let config: ProjectConfiguration;
  let pouchdbDatastore: PouchdbDatastore;
  let renderAPI: RenderAPI;
  const observationDescription = 'This is a test document';

  beforeEach(async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
    project = createTestProjectName('document-add');
    preferences = createPreferences(project);
    mockUseGlobalSearchParams.mockReturnValue({
      parentDocId: t2.resource.id,
      categoryName: category,
    });

    pouchdbDatastore = new PouchdbDatastore(
      (name: string) => new PouchDB(name),
      new IdGenerator()
    );
    await pouchdbDatastore.createDb(
      project,
      {
        _id: 'project',
        resource: {
          id: 'project',
          identifier: 'project',
          category: 'Project',
          relations: {},
        },
        created: { user: 'test', date: new Date(0) },
        modified: [],
      },
      undefined,
      true
    );
    const categories: Forest<CategoryForm> = [
      createCategory('Feature'),
      createCategory(category),
    ];
    repository = await DocumentRepository.init(
      'testuser',
      createProjectConfiguration(categories),
      pouchdbDatastore
    );

    config = await loadConfiguration(
      pouchdbDatastore,
      project,
      preferences.languages,
      preferences.username
    );
    renderAPI = render(
      <ToastProvider>
        <PreferencesContext.Provider
          value={{
            preferences,
            setCurrentProject,
            setUsername,
            setProjectSettings,
            setLanguages,
            removeProject,
            setMapSettings,
            getMapSettings,
            setMapProviderSettings,
          }}
        >
          <LabelsContext.Provider value={{ labels: new Labels(() => ['en']) }}>
            <ConfigurationContext.Provider value={config}>
              <ProjectContext.Provider value={{ repository } as any}>
                <DocumentAdd />
              </ProjectContext.Provider>
            </ConfigurationContext.Provider>
          </LabelsContext.Provider>
        </PreferencesContext.Provider>
      </ToastProvider>
    );
  });

  afterEach(async () => {
    await pouchdbDatastore?.getDb()?.close?.();
    if (pouchdbDatastore && project) await pouchdbDatastore.destroyDb(project);
    cleanup();
    jest.clearAllMocks();
    jest.restoreAllMocks();
    mockNavigate.mockClear();
    mockUseGlobalSearchParams.mockReset();
  });

  it('should render component correctly', async () => {
    await waitFor(() => renderAPI.getByTestId('documentForm'));

    expect(renderAPI.queryByTestId('documentForm')).toBeTruthy();
  });

  it('shows the Korean fieldwork draft context above the add form', async () => {
    await waitFor(() => renderAPI.getByTestId('documentForm'));

    expect(renderAPI.queryByTestId('koreanFieldworkDraftContextPanel'))
      .toBeTruthy();
  });

  it('keeps compatibility fields out of a fresh fieldwork draft', async () => {
    await waitFor(() => renderAPI.getByTestId('documentForm'));

    expect(renderAPI.queryByTestId('fullFormCollapsedSummary')).toBeNull();
    expect(renderAPI.queryByTestId('fullFormToggle')).toBeNull();
    expect(renderAPI.queryByText('가져온 기존 항목')).toBeNull();
    expect(renderAPI.queryByText(
      '새 유구 기록은 위의 시대/시기·유구 성격·유구별 핵심 속성·야장 메모만 입력하면 충분합니다. 이 영역은 이전 양식에서 가져온 값이 있을 때만 확인합니다.'
    ))
      .toBeNull();
    expect(renderAPI.queryByText(/기존 항목 \d+개 확인 중/)).toBeNull();
    expect(renderAPI.queryByTestId('groupSelect_stem')).toBeNull();
  });

  it('should create a new Document with entered values and correctly set relations field', async () => {
    const { getByTestId } = renderAPI;

    await waitFor(() => getByTestId('documentForm'));

    fireEvent.changeText(
      getByTestId('quickRecordInput_description'),
      observationDescription
    );
    fireEvent.press(getByTestId('saveDocBtn'));

    await waitFor(() => expect(repository.create).toHaveBeenCalledTimes(1));
    expect(repository.create).toHaveBeenCalledWith({
      resource: expect.objectContaining({
        identifier: 'pottery-1700000000000',
        description: observationDescription,
        category,
      }),
    } as NewDocument);
  });

  it('should navigate back to DocumentsMap after object hast been created', async () => {
    const { getByTestId } = renderAPI;
    const highlightedDocId = 'id'; //see mock of DocumentRepository class

    await waitFor(() => getByTestId('documentForm'));

    fireEvent.changeText(
      getByTestId('quickRecordInput_description'),
      observationDescription
    );
    fireEvent.press(getByTestId('saveDocBtn'));

    await waitFor(() => expect(repository.create).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledTimes(1));
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/ProjectScreen/DocumentsMap',
      params: { highlightedDocId },
    });
  });
});

const createProjectConfiguration = (
  forms: Forest<CategoryForm>
): ProjectConfiguration =>
  new ProjectConfiguration({
    forms,
    categories: {},
    relations: [],
    commonFields: {},
    valuelists: {},
    projectLanguages: [],
  });

const createPreferences = (project: string): Preferences => ({
  username: 'testUser',
  currentProject: project,
  languages: ['en'],
  recentProjects: [project],
  mapProviderSettings: {
    kakaoLocalRestApiKey: '',
    kakaoMapJavaScriptKey: '',
    kakaoNativeAppKey: '',
  },
  projects: {
    [project]: {
      url: '',
      password: '',
      connected: true,
      mapSettings: defaultMapSettings(),
    },
  },
});

const createTestProjectName = (prefix: string): string =>
  `${prefix}-${Math.random().toString(36).slice(2)}`;
