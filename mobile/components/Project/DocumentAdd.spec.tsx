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
import { t2 } from '../../test_data/test_docs/t2';
import { ConfigurationContext } from '../../contexts/configuration-context';
import LabelsContext from '../../contexts/labels/labels-context';
import { PreferencesContext } from '../../contexts/preferences-context';
import { Preferences } from '../../src/models/preferences';
import { DocumentRepository } from '../../src/repositories/document-repository';
import loadConfiguration from '../../services/config/load-configuration';
import { ToastProvider } from '../common/Toast/ToastProvider';
import DocumentAdd from './DocumentAdd';
import { defaultMapSettings } from './Map/map-settings';

const category = 'Pottery';
const project = 'testdb';
const preferences: Preferences = {
  username: 'testUser',
  currentProject: project,
  languages: ['en'],
  recentProjects: [project],
  projects: {
    [project]: {
      url: '',
      password: '',
      connected: true,
      mapSettings: defaultMapSettings(),
    },
  },
};

const navigate = jest.fn();
const setCurrentProject = jest.fn();
const setUsername = jest.fn();
const setProjectSettings = jest.fn();
const removeProject = jest.fn();
const setMapSettings = jest.fn();
const getMapSettings = jest.fn();

jest.mock('../../repositories/document-repository');
jest.mock('idai-field-core');
jest.mock('expo-barcode-scanner');

describe('DocumentAdd', () => {
  let repository: DocumentRepository;
  let config: ProjectConfiguration;
  let pouchdbDatastore: PouchdbDatastore;
  let renderAPI: RenderAPI;
  const identifier = 'Test';
  const shortDescription = 'This is a test document';
  const expectedDoc: NewDocument = {
    resource: {
      identifier,
      shortDescription,
      category,
      relations: {
        isRecordedIn: [t2.resource.id],
      },
    },
  };

  beforeEach(async () => {
    pouchdbDatastore = new PouchdbDatastore(
      (name: string) => new PouchDB(name),
      new IdGenerator()
    );
    await pouchdbDatastore.createDb(
      project,
      { _id: 'project', resource: { id: 'project' } },
      true
    );
    const categories: Forest<CategoryForm> = [
      createCategory('Feature'),
      createCategory(category),
    ];
    repository = await DocumentRepository.init(
      'testuser',
      categories,
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
            removeProject,
            setMapSettings,
            getMapSettings,
          }}
        >
          <LabelsContext.Provider value={{ labels: new Labels(() => ['en']) }}>
            <ConfigurationContext.Provider value={config}>
              <DocumentAdd
                repository={repository}
                parentDoc={t2}
                categoryName={category}
                navigation={{ navigate }}
              />
            </ConfigurationContext.Provider>
          </LabelsContext.Provider>
        </PreferencesContext.Provider>
      </ToastProvider>
    );
  });

  afterEach(async (done) => {
    await pouchdbDatastore.destroyDb(project);
    cleanup();
    done();
    jest.clearAllMocks();
  });

  it('should render component correctly', async () => {
    await waitFor(() => renderAPI.getByTestId('barCodeScanner'));

    expect(renderAPI.queryByTestId('documentForm')).toBeTruthy();
  });

  it('should create a new Document with entered values and correctly set relations field', async () => {
    const { getByTestId } = renderAPI;

    fireEvent.press(getByTestId('groupSelect_stem'));
    fireEvent.changeText(getByTestId('inputField_identifier'), identifier);
    fireEvent.changeText(
      getByTestId('inputField_shortDescription'),
      shortDescription
    );
    fireEvent.press(getByTestId('saveDocBtn'));

    await waitFor(() => expect(repository.create).toHaveBeenCalledTimes(1));
    expect(repository.create).toHaveBeenCalledWith(expectedDoc);
  });

  it('should navigate back to DocumentsMap after object hast been created', async () => {
    const { getByTestId } = renderAPI;
    const highlightedDocId = 'id'; //see mock of DocumentRepository class

    fireEvent.press(getByTestId('groupSelect_stem'));
    fireEvent.changeText(getByTestId('inputField_identifier'), identifier);
    fireEvent.changeText(
      getByTestId('inputField_shortDescription'),
      shortDescription
    );
    fireEvent.press(getByTestId('saveDocBtn'));

    await waitFor(() => expect(repository.create).toHaveBeenCalledTimes(1));
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('DocumentsMap', { highlightedDocId });
  });
});
