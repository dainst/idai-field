import React from 'react';
import { render } from '../../utils/test-utils';
import HomeScreen from './HomeScreen';

describe('HomeScreen', () => {

    it('displays warning if username is not set', () => {
        const props = {
                preferences: {
                username: '',
                languages: [],
                currentProject: '',
                recentProjects: [],
                projects: {}
            },
            navigation: {},
            setCurrentProject: (_: string) => { return; },
            deleteProject: (_: string) => { return; },
            navigate: (_: string) => { return; }
        };
        const { getByText } = render(<HomeScreen { ... props } />);
        const warning = getByText('Make sure to set your name!');

        expect(warning).toBeTruthy();
    });

});
