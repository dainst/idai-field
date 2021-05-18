import React from 'react';
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

});


const mockProps = () => ({
    preferences: {
        username: '',
        languages: [],
        currentProject: '',
        recentProjects: [],
        projects: {}
    },
    setCurrentProject: (_: string) => { return; },
    deleteProject: (_: string) => { return; },
    navigate: (_: string) => { return; }
});
