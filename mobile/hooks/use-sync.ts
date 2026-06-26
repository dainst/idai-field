import { PouchdbDatastore, SyncService, SyncStatus } from 'idai-field-core';
import { useEffect, useState } from 'react';
import { ProjectSettings } from '@/models/preferences';

interface SyncConfig {
  project: string;
  projectSettings: ProjectSettings;
  pouchdbDatastore?: PouchdbDatastore;
  live?: boolean;
}

const useSync = ({
  project,
  projectSettings,
  pouchdbDatastore,
  live = true
}: SyncConfig): SyncStatus => {
  const [status, setStatus] = useState<SyncStatus>(SyncStatus.Offline);
  const [syncService, setSyncService] = useState<SyncService | null>(null);
  const [initializedSyncKey, setInitializedSyncKey] = useState<string | null>(
    null
  );

  useEffect(() => {
    setInitializedSyncKey(null);

    if (!pouchdbDatastore) {
      setSyncService(null);
      setStatus(SyncStatus.Offline);
      return;
    }

    const service = new SyncService(pouchdbDatastore);
    setSyncService(service);

    return () => {
      try {
        service.stopSync();
      } catch (error) {
        console.error('Failed to stop sync:', getSyncErrorMessage(error));
      }
    };
  }, [pouchdbDatastore]);

  useEffect(() => {
    if (!syncService) {
      setStatus(SyncStatus.Offline);
      return;
    }

    setStatus(syncService.getStatus());

    const subscription = syncService
      .statusNotifications()
      .subscribe((newStatus) => {
        setStatus(newStatus);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncService]);

  useEffect(() => {
    if (
      !projectSettings?.url ||
      !project ||
      !syncService
    ) {
      setInitializedSyncKey(null);
      return;
    }

    let isCancelled = false;
    const syncKey = getSyncKey(project, projectSettings.url, projectSettings.password);

    const initSync = async () => {
      try {
        await syncService.init(
          projectSettings.url,
          project,
          projectSettings.password ?? '',
          async () => true
        );
        if (!isCancelled) setInitializedSyncKey(syncKey);
      } catch (error) {
        console.error('Failed to initialize sync:', getSyncErrorMessage(error, projectSettings.password));
        setStatus(SyncStatus.Error);
      }
    };

    initSync();

    return () => {
      isCancelled = true;
      setInitializedSyncKey((currentSyncKey) =>
        currentSyncKey === syncKey ? null : currentSyncKey
      );
    };
  }, [syncService, project, projectSettings?.url, projectSettings?.password]);


  useEffect(() => {
    if (
      !syncService ||
      !project ||
      !projectSettings?.connected ||
      !initializedSyncKey ||
      !live
    ) {
      return;
    }

    let isCancelled = false;

    const startSyncProcess = async () => {
      try {
        if (!isCancelled) {
          await syncService.startSync(undefined, true);
        }
      } catch (error) {
        console.error('Failed to start sync:', getSyncErrorMessage(error, projectSettings.password));
        setStatus(SyncStatus.Error);
      }
    };

    startSyncProcess();

    return () => {
      isCancelled = true;
      try {
        syncService.stopSync();
      } catch (error) {
        console.error('Failed to stop sync:', getSyncErrorMessage(error, projectSettings.password));
      }
    };
  }, [syncService, live, project, projectSettings?.connected, projectSettings?.password, initializedSyncKey]);

  return status;
};

const getSyncKey = (project: string, url: string, password?: string) =>
  [project, url, password ?? ''].join('\u001f');

export const getSyncErrorMessage = (
  error: unknown,
  secret?: string
): string => {
  const parts: string[] = [];

  if (error instanceof Error) {
    parts.push(error.message);
  } else if (typeof error === 'string') {
    parts.push(error);
  } else {
    const message = getErrorProperty(error, 'message');
    if (typeof message === 'string') parts.push(message);
  }

  const status = getErrorProperty(error, 'status');
  if (typeof status === 'number' || typeof status === 'string') {
    parts.push(`status ${status}`);
  }

  const code = getErrorProperty(error, 'code');
  if (typeof code === 'number' || typeof code === 'string') {
    parts.push(`code ${code}`);
  }

  return redactSensitiveSyncLogText(
    parts.length > 0 ? parts.join(' ') : 'Unknown sync error',
    secret ? [secret] : []
  );
};

const getErrorProperty = (
  value: unknown,
  key: string
): unknown =>
  value && typeof value === 'object' && key in value
    ? (value as Record<string, unknown>)[key]
    : undefined;

const redactSensitiveSyncLogText = (
  value: string,
  secrets: string[] = []
): string => {
  let result = value
    .replace(/Basic\s+[A-Za-z0-9+/=._~-]+/gi, 'Basic [redacted]')
    .replace(/(Authorization["']?\s*[:=]\s*["']?)[^"',\s}]+/gi, '$1[redacted]')
    .replace(/(password["']?\s*[:=]\s*["']?)[^"',\s}]+/gi, '$1[redacted]');

  for (const secret of secrets) {
    if (secret) result = result.split(secret).join('[redacted]');
  }

  return result;
};

export default useSync;
