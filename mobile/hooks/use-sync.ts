import { Document, PouchdbDatastore, SyncService, SyncStatus } from 'idai-field-core';
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
        console.error('Failed to stop sync:', error);
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
        console.error('Failed to initialize sync:', error);
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
          await syncService.startSync(undefined, true, isNotAnImage);
        }
      } catch (error) {
        console.error('Failed to start sync:', error);
        setStatus(SyncStatus.Error);
      }
    };

    startSyncProcess();

    return () => {
      isCancelled = true;
      try {
        syncService.stopSync();
      } catch (error) {
        console.error('Failed to stop sync:', error);
      }
    };
  }, [syncService, live, project, projectSettings?.connected, initializedSyncKey]);

  return status;
};

const isNotAnImage = (doc: Document) =>
  !['Image', 'Photo', 'Drawing'].includes(doc.resource.category);

const getSyncKey = (project: string, url: string, password?: string) =>
  [project, url, password ?? ''].join('\u001f');

export default useSync;
