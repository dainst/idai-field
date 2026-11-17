import { Document, PouchdbDatastore, SyncService, SyncStatus } from 'idai-field-core';
import { useEffect, useState, useRef, useCallback } from 'react';
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
  const syncServiceRef = useRef<SyncService | null>(null);
  const isInitializedRef = useRef(false);

  const initializeSyncService = useCallback(() => {
    if (!pouchdbDatastore || syncServiceRef.current) return;
    syncServiceRef.current = new SyncService(pouchdbDatastore);
  }, [pouchdbDatastore]);

  useEffect(() => {
    if (!syncServiceRef.current) return;

    const subscription = syncServiceRef.current
      .statusNotifications()
      .subscribe((newStatus) => {
        setStatus(newStatus);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (
      !projectSettings?.url ||
      !project ||
      !syncServiceRef.current ||
      isInitializedRef.current
    ) {
      return;
    }

    const initSync = async () => {
      try {
        await syncServiceRef.current?.init(
          // Testing locally
          "http://localhost:5984/dai",
          project,
          projectSettings.password,
          async () => true
        );
        isInitializedRef.current = true;
      } catch (error) {
        console.error('Failed to initialize sync:', error);
        setStatus(SyncStatus.Error);
      }
    };

    initSync();

    return () => {
      isInitializedRef.current = false;
    };
  }, [project, projectSettings?.url, projectSettings?.password]);


  useEffect(() => {
    if (
      !syncServiceRef.current ||
      !project ||
      !projectSettings?.connected ||
      !isInitializedRef.current
    ) {
      return;
    }

    const startSyncProcess = () => {
      try {
        syncServiceRef.current?.startSync(true, isNotAnImage);
      } catch (error) {
        console.error('Failed to start sync:', error);
        setStatus(SyncStatus.Error);
      }
    };

    startSyncProcess();

    return () => {
      try {
        syncServiceRef.current?.stopSync();
      } catch (error) {
        console.error('Failed to stop sync:', error);
      }
    };
  }, [live, project, projectSettings?.connected]);


  useEffect(() => {
    initializeSyncService();

    return () => {
      if (syncServiceRef.current) {
        syncServiceRef.current.stopSync();
        syncServiceRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [initializeSyncService]);

  return status;
};

const isNotAnImage = (doc: Document) =>
  !['Image', 'Photo', 'Drawing'].includes(doc.resource.type);

export default useSync;