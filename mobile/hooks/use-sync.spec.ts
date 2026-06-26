import {
  act,
  renderHook,
  waitFor,
} from '@testing-library/react-native';
import { SyncService, SyncStatus } from 'idai-field-core';
import useSync, { getSyncErrorMessage } from './use-sync';

const mockSyncServices: any[] = [];

jest.mock('idai-field-core', () => {
  const SyncStatus = {
    AuthenticationError: 'AUTHENTICATION_ERROR',
    AuthorizationError: 'AUTHORIZATION_ERROR',
    Connecting: 'CONNECTING',
    Error: 'ERROR',
    InSync: 'IN_SYNC',
    Offline: 'OFFLINE',
    Pulling: 'PULLING',
    Pushing: 'PUSHING',
  };

  const SyncService = jest.fn().mockImplementation(() => {
    const unsubscribe = jest.fn();
    const service: any = {
      getStatus: jest.fn(() => SyncStatus.Offline),
      init: jest.fn(),
      startSync: jest.fn().mockResolvedValue(true),
      stopSync: jest.fn(),
      statusNotifications: jest.fn(() => ({
        subscribe: jest.fn((subscriber) => {
          service.emitStatus = subscriber;
          return { unsubscribe };
        }),
      })),
      unsubscribe,
    };

    mockSyncServices.push(service);
    return service;
  });

  return {
    SyncService,
    SyncStatus,
  };
});

describe('useSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSyncServices.length = 0;
  });

  it('initializes and starts sync once the datastore is available', async () => {
    const pouchdbDatastore = {} as any;
    const projectSettings = createProjectSettings({
      connected: true,
      password: 'secret',
      url: 'https://field.example',
    });

    renderHook(() => useSync({
      project: 'fieldwork-1',
      projectSettings,
      pouchdbDatastore,
    }));

    await waitFor(() => {
      expect(SyncService).toHaveBeenCalledWith(pouchdbDatastore);
    });
    const service = mockSyncServices[0];

    await waitFor(() => {
      expect(service.statusNotifications).toHaveBeenCalled();
      expect(service.init).toHaveBeenCalledWith(
        'https://field.example',
        'fieldwork-1',
        'secret',
        expect.any(Function)
      );
      expect(service.startSync).toHaveBeenCalledWith(
        undefined,
        true
      );
    });
  });

  it('subscribes to sync status changes and cleans up on unmount', async () => {
    const pouchdbDatastore = {} as any;
    const projectSettings = createProjectSettings({ connected: true });
    const { result, unmount } = renderHook(() => useSync({
      project: 'fieldwork-1',
      projectSettings,
      pouchdbDatastore,
    }));

    await waitFor(() => {
      expect(mockSyncServices[0]?.emitStatus).toBeDefined();
    });
    const service = mockSyncServices[0];

    act(() => {
      service.emitStatus(SyncStatus.InSync);
    });

    expect(result.current).toBe(SyncStatus.InSync);

    unmount();

    expect(service.stopSync).toHaveBeenCalled();
    expect(service.unsubscribe).toHaveBeenCalled();
  });

  it('does not start sync when the project is not connected', async () => {
    const pouchdbDatastore = {} as any;

    renderHook(() => useSync({
      project: 'fieldwork-1',
      projectSettings: createProjectSettings({ connected: false }),
      pouchdbDatastore,
    }));

    await waitFor(() => {
      expect(mockSyncServices[0]?.init).toHaveBeenCalled();
    });

    expect(mockSyncServices[0].startSync).not.toHaveBeenCalled();
  });

  it('logs sync failures without leaking credentials', async () => {
    const error = new Error(
      'sync failed password=secret Authorization: Basic abc123'
    );

    const message = getSyncErrorMessage(error, 'secret');

    expect(message).not.toContain('secret');
    expect(message).not.toContain('abc123');
    expect(message).toContain('[redacted]');
  });
});

const createProjectSettings = ({
  connected,
  password = '',
  url = 'https://field.example',
}: {
  connected: boolean;
  password?: string;
  url?: string;
}) => ({
  connected,
  mapSettings: { pointRadius: 6 },
  password,
  url,
});
