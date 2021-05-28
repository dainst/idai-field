import React from 'react';
import { Preferences } from '../../models/preferences';
import { fireEvent, render, waitFor } from '../../utils/test-utils';
import HomeScreen from './HomeScreen';

describe('HomeScreen', () => {

    it('displays warning if username is not set', () => {
        
        const { getByText } = render(<HomeScreen { ... mockProps() } />);
        const warning = getByText('Make sure to set your name!');

        expect(warning).toBeTruthy();
    });

    it('does not display warning if username is set', () => {

        const props = mockProps();
        props.preferences.username = 'Test User';
        const { queryByText } = render(<HomeScreen { ... props } />);
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
        props.preferences.recentProjects = ['project-1', 'project-2'];
        const { getByText } = render(<HomeScreen { ... props } />);

        expect(getByText('Open existing project:')).toBeTruthy();
    });

    it('allows deleting project', async () => {

        const props = mockProps();
        props.preferences.recentProjects = ['project-1', 'project-2'];
        const { getByTestId, queryByTestId, getByText } = render(<HomeScreen { ... props } />);
        fireEvent.press(getByTestId('delete-project-button'));

        await waitFor(() => expect(queryByTestId('project-input')).toBeTruthy());
        fireEvent.changeText(getByTestId('project-input'), 'project-1');
        fireEvent.press(getByText('Delete'));

        await waitFor(() => getByTestId('home-screen'));

        expect(props.deleteProject).toHaveBeenCalledWith('project-1');
    });

    it('allows opening project', async () => {

        const props = mockProps();
        props.preferences.recentProjects = ['project-1', 'project-2'];
        const { getByText } = render(<HomeScreen { ... props } />);
        fireEvent.press(getByText('Open'));

        expect(props.setCurrentProject).toHaveBeenCalledWith('project-1');
        expect(props.navigate).toHaveBeenCalledWith('ProjectScreen');
    });

    it('allows creating project', async () => {

        const props = mockProps();
        const { getByTestId, queryByTestId, getByText } = render(<HomeScreen { ... props } />);
        fireEvent.press(getByText('Create new project'));

        await waitFor(() => expect(queryByTestId('project-input')).toBeTruthy());
        fireEvent.changeText(getByTestId('project-input'), 'new-project');
        fireEvent.press(getByText('Create'));

        expect(props.setCurrentProject).toHaveBeenCalledWith('new-project');
        expect(props.navigate).toHaveBeenCalledWith('ProjectScreen');
    });

});


const mockProps = () => ({
    preferences: {
        username: '',
        languages: [],
        currentProject: '',
        recentProjects: [],
        projects: {}
    } as Preferences,
    setCurrentProject: jest.fn(_ => { return; }),
    deleteProject: jest.fn(_ => { return; }),
    navigate: jest.fn(_ => { return; }),
});
