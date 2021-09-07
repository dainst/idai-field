import { cleanup, render } from '@testing-library/react-native';
import {
    Category, createCategory, Forest, IdGenerator, Labels, PouchdbDatastore, ProjectConfiguration
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
import DocumentAdd from './DocumentAdd';

const navigate = jest.fn();
const category = 'Pottery';

jest.mock('../../repositories/document-repository');
jest.mock('idai-field-core');

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
        }
    }
};
const setCurrentProject = jest.fn();
const setUsername = jest.fn();
const setProjectSettings = jest.fn();
const removeProject = jest.fn();

describe('DocumentAdd',() => {
    let repository: DocumentRepository;
    let config: ProjectConfiguration;
   
    
    beforeEach(async() => {
  
        const datastore = new PouchdbDatastore((name: string) => new PouchDB(name), new IdGenerator());
        await datastore.createDb(project, { _id: 'project', resource: { id: 'project' } }, true);
        const categories: Forest<Category> = [createCategory('Feature'), createCategory(category)];
        repository = await DocumentRepository.init('testuser', categories, datastore);

        config = await loadConfiguration(datastore, project, preferences.languages, preferences.username);
    });

    afterEach(cleanup);

    it('should render component correctly', async () => {

        const { queryByTestId } = render(
            <ToastProvider>
                <PreferencesContext.Provider
                    value={ { preferences, setCurrentProject, setUsername, setProjectSettings, removeProject } }>
                    <LabelsContext.Provider value={ { labels: new Labels(() => ['en']) } }>
                        <ConfigurationContext.Provider value={ config }>
                            <DocumentAdd
                                repository={ repository }
                                parentDoc={ t2 }
                                categoryName={ category }
                                navigation={ { navigate } } />
                        </ConfigurationContext.Provider>
                    </LabelsContext.Provider>
                </PreferencesContext.Provider>
            </ToastProvider>);

        expect(queryByTestId('documentForm')).not.toBe(undefined);
            
    });
});

