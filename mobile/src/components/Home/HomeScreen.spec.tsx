import React from 'react';
import { PreferencesContext } from '../../contexts/preferences-context';
import { Preferences } from '../../models/preferences';
import { fireEvent, render, waitFor } from '../../utils/test-utils';
import HomeScreen from './HomeScreen';

describe('HomeScreen', () => {

    it('displays warning if username is not set', () => {
        
        const { getByText } = render(<PreferencesContext.Provider value={ mockPreferences() }>
            <HomeScreen { ... mockProps() } />
        </PreferencesContext.Provider>);
        const warning = getByText('Make sure to set your name!');

        expect(warning).toBeTruthy();
    });

    it('does not display warning if username is set', () => {

        const props = mockProps();
        const prefs = mockPreferences();
        prefs.preferences.username = 'Test User';
        const { queryByText } = render(<PreferencesContext.Provider value={ prefs }>
            <HomeScreen { ... props } />
        </PreferencesContext.Provider>);
        const warning = queryByText('Make sure to set your name!');

        expect(warning).toBeNull();
    });
    
    it('does not display picker when no projects are present', () => {
        
        const { queryByText } = render(<HomeScreen { ... mockProps() } />);
        const warning = queryByText('Open existing project:');

        expect(warning).toBeNull();
    });
    
    it('displays picker when projects are present', () => {
        
        const props = mockProps();
        const prefs = mockPreferences();
        prefs.preferences.recentProjects = ['project-1', 'project-2'];
        const { getByText } = render(<PreferencesContext.Provider value={ prefs }>
            <HomeScreen { ... props } />
        </PreferencesContext.Provider>);

        expect(getByText('Open existing project:')).toBeTruthy();
    });

    it('allows deleting project', async () => {

        const props = mockProps();
        const prefs = mockPreferences();
        prefs.preferences.recentProjects = ['project-1', 'project-2'];
        const { getByTestId, queryByTestId, getByText } = render(<PreferencesContext.Provider value={ prefs }>
            <HomeScreen { ... props } />
        </PreferencesContext.Provider>);

        fireEvent.press(getByTestId('delete-project-button'));
        expect(queryByTestId('project-input')).toBeTruthy();
        
        fireEvent.changeText(getByTestId('project-input'), 'project-1');
        fireEvent.press(getByText('Delete'));
        expect(props.deleteProject).toHaveBeenCalledWith('project-1');
    });

    it('diables project button if no username is set', async () => {

        const props = mockProps();
        const prefs = mockPreferences();
        prefs.preferences.recentProjects = ['project-1', 'project-2'];
        const { getByText } = render(<PreferencesContext.Provider value={ prefs }>
            <HomeScreen { ... props } />
        </PreferencesContext.Provider>);
        fireEvent.press(getByText('Open'));

        expect(prefs.setCurrentProject).toHaveBeenCalledTimes(0);
    });

    it('allows opening project', async () => {

        const props = mockProps();
        const prefs = mockPreferences();
        prefs.preferences.username = 'testuser';
        prefs.preferences.recentProjects = ['project-1', 'project-2'];
        const { getByText } = render(<PreferencesContext.Provider value={ prefs }>
            <HomeScreen { ... props } />
        </PreferencesContext.Provider>);
        fireEvent.press(getByText('Open'));

        expect(prefs.setCurrentProject).toHaveBeenCalledWith('project-1');
        expect(props.navigate).toHaveBeenCalledWith('ProjectScreen');
    });

    it('allows creating project', async () => {

        const props = mockProps();
        const prefs = mockPreferences();
        prefs.preferences.username = 'testuser';
        const { getByTestId, queryByTestId, getByText } = render(<PreferencesContext.Provider value={ prefs }>
            <HomeScreen { ... props } />
        </PreferencesContext.Provider>);
        fireEvent.press(getByText('Create new project'));

        await waitFor(() => expect(queryByTestId('project-input')).toBeTruthy());
        fireEvent.changeText(getByTestId('project-input'), 'new-project');
        fireEvent.press(getByText('Create'));

        expect(prefs.setCurrentProject).toHaveBeenCalledWith('new-project');
        expect(props.navigate).toHaveBeenCalledWith('ProjectScreen');
    });

});


const mockProps = () => ({
    deleteProject: jest.fn(_ => { return; }),
    navigate: jest.fn(_ => { return; }),
});

const mockPreferences = () => ({
    preferences: {
        username: '',
        languages: [],
        currentProject: '',
        recentProjects: [],
        projects: {},
    } as Preferences,
    setCurrentProject: jest.fn(_ => { return; }),
    setProjectSettings: jest.fn(_ => { return; }),
    setUsername: jest.fn(_ => { return; }),
    removeProject: jest.fn(_ => { return; }),
    getMapSettings: jest.fn(),
    setMapSettings: jest.fn(),
});
