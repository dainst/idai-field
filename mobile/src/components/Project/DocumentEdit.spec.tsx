import { cleanup, fireEvent, render, RenderAPI, waitFor } from '@testing-library/react-native';
import {
    Category, createCategory, Forest, IdGenerator,
    Labels, PouchdbDatastore, ProjectConfiguration
} from 'idai-field-core';
import PouchDB from 'pouchdb-node';
import React from 'react';
import { t2 } from '../../../test_data/test_docs/t2';
import { ConfigurationContext } from '../../contexts/configuration-context';
import LabelsContext from '../../contexts/labels/labels-context';
import { PreferencesContext } from '../../contexts/preferences-context';
import { Preferences } from '../../models/preferences';
import { DocumentRepository } from '../../repositories/document-repository';
import loadConfiguration from '../../services/config/load-configuration';
import { ToastProvider } from '../common/Toast/ToastProvider';
import DocumentEdit from './DocumentEdit';

const project = 'testdb';
const category = 'Pottery';
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
        }
    }
};

const navigate = jest.fn();
const setCurrentProject = jest.fn();
const setUsername = jest.fn();
const setProjectSettings = jest.fn();
const removeProject = jest.fn();

jest.mock('../../repositories/document-repository');
jest.mock('idai-field-core');

describe('DocumentEdit',() => {

    let repository: DocumentRepository;
    let config: ProjectConfiguration;
    let pouchdbDatastore: PouchdbDatastore;
    let renderAPI: RenderAPI;

    beforeEach(async () => {

        pouchdbDatastore = new PouchdbDatastore((name: string) => new PouchDB(name), new IdGenerator());
        await pouchdbDatastore.createDb(project, { _id: 'project', resource: { id: 'project' } }, true);
        const categories: Forest<Category> = [createCategory('Feature'), createCategory(category)];
        repository = await DocumentRepository.init('testuser', categories, pouchdbDatastore);

        config = await loadConfiguration(pouchdbDatastore, project, preferences.languages, preferences.username);

        renderAPI = render(
            <ToastProvider>
                <PreferencesContext.Provider
                    value={ { preferences, setCurrentProject, setUsername, setProjectSettings, removeProject } }>
                    <LabelsContext.Provider value={ { labels: new Labels(() => ['en']) } }>
                        <ConfigurationContext.Provider value={ config }>
                            <DocumentEdit
                                repository={ repository }
                                docId={ t2.resource.id }
                                categoryName={ category }
                                navigation={ { navigate } } />
                        </ConfigurationContext.Provider>
                    </LabelsContext.Provider>
                </PreferencesContext.Provider>
            </ToastProvider>);
    });

    afterEach(async (done) => {
        await pouchdbDatastore.destroyDb(project);
        cleanup();
        done();
        jest.clearAllMocks();
    });

    it('should render component correctly', async () => {
        
        const { queryByTestId } = renderAPI;

        await waitFor(() => expect(queryByTestId('documentForm')).not.toBe(undefined));
        await waitFor(() => expect(queryByTestId('documentForm')).not.toBe(null));
    });

    it('should set input fields with correct values', async () => {

        const { getByTestId } = renderAPI;

        await waitFor(() => fireEvent.press(getByTestId('groupSelect_stem')));


        await waitFor(() => expect(
            getByTestId('inputField_identifier').props.value)
            .toEqual(t2.resource.id.toUpperCase()));
        await waitFor(() => expect(
            getByTestId('inputField_shortDescription').props.value)
            .toEqual(t2.resource.shortDescription));
    });
});