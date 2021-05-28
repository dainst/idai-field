import React from 'react';
import { Preferences } from '../../models/preferences';
import { render } from '../../utils/test-utils';
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
    
    it('displays picker when no projects are present', () => {
        
        const props = mockProps();
        props.preferences.recentProjects = ['project-1', 'project-2'];
        const { getByText } = render(<HomeScreen { ... props } />);
        const warning = getByText('Open existing project:');

        expect(warning).toBeTruthy();
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
    setCurrentProject: (_: string) => { return; },
    deleteProject: (_: string) => { return; },
    navigate: (_: string) => { return; }
});
