import {
  createDefaultProjectSettings,
  normalizeProjectSettings,
} from './project-settings';

describe('project settings helpers', () => {
  it('creates safe defaults for projects without stored sync settings', () => {
    expect(createDefaultProjectSettings()).toEqual({
      url: '',
      password: '',
      connected: false,
      mapSettings: expect.objectContaining({ pointRadius: expect.any(Number) }),
    });
  });

  it('fills missing runtime settings without dropping existing metadata', () => {
    expect(normalizeProjectSettings({
      connected: true,
      languages: ['ko'],
    })).toEqual({
      url: '',
      password: '',
      connected: true,
      languages: ['ko'],
      mapSettings: expect.objectContaining({ pointRadius: expect.any(Number) }),
    });
  });
});
