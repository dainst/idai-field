import { renderHook } from '@testing-library/react-hooks';
import usePreferences from './use-preferences';

describe('usePreferences', () => {

    it('should provide sensible default preferences', async () => {

        const { result, waitForNextUpdate } = renderHook(() => usePreferences());

        await waitForNextUpdate();
      
        expect(result.current.preferences.currentProject).toBe('test');
        expect(result.current.preferences.recentProjects).toHaveLength(0);
        expect(result.current.preferences.languages).toEqual(['en']);
        expect(result.current.preferences.username).toBe('');
        expect(result.current.preferences.projects).toEqual({});
      });
});
