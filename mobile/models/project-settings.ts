import { defaultMapSettings } from '@/components/Project/Map/map-settings';
import { ProjectSettings } from './preferences';

export const createDefaultProjectSettings = (): ProjectSettings => ({
  url: '',
  password: '',
  connected: false,
  mapSettings: defaultMapSettings(),
});

export const normalizeProjectSettings = (
  settings?: Partial<ProjectSettings>
): ProjectSettings => ({
  ...createDefaultProjectSettings(),
  ...settings,
  url: settings?.url ?? '',
  password: settings?.password ?? '',
  connected: settings?.connected ?? false,
  mapSettings: settings?.mapSettings ?? defaultMapSettings(),
});
