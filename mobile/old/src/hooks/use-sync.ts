import { Document, PouchdbDatastore, SyncService, SyncStatus } from 'idai-field-core';
import { useEffect, useState } from 'react';
import { ProjectSettings } from '../models/preferences';

const useSync = (
  project: string,
  projectSettings: ProjectSettings,
  pouchdbDatastore?: PouchdbDatastore,
  live: boolean = true // TODO Either remove this or make it work again
): SyncStatus => {
  const [status, setStatus] = useState<SyncStatus>(SyncStatus.Offline);
  const [syncService, setSyncService] = useState<SyncService>();

  useEffect(() => {
    if (!pouchdbDatastore || !pouchdbDatastore.open) return;

    setSyncService(new SyncService(pouchdbDatastore));
  }, [pouchdbDatastore, pouchdbDatastore?.open]);

  useEffect(() => {
    if (!syncService) return;

    const subscription = syncService
      .statusNotifications()
      .subscribe((status) => setStatus(status));
    return () => subscription.unsubscribe();
  }, [syncService]);

  useEffect(() => console.log('status', status), [status]);

  useEffect(() => {
    if (!projectSettings?.url || !project || !syncService) return;

    syncService.init(projectSettings.url, project, projectSettings.password);
  }, [syncService, projectSettings?.url, project, projectSettings?.password]);

  useEffect(() => {
    if (!syncService || !project || !projectSettings?.connected) return;

    syncService.startSync(true, isNotAnImage);

    return () => syncService.stopSync();
  }, [live, syncService, project, projectSettings?.connected]);

  return status;
};

const isNotAnImage = (doc: Document) =>
  !['Image', 'Photo', 'Drawing'].includes(doc.resource.type);

export default useSync;
