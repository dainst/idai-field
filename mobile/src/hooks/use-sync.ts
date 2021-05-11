import { Subscription } from 'core/node_modules/rxjs';
import { PouchdbManager, SyncProcess, SyncStatus } from 'idai-field-core';
import { useEffect, useState } from 'react';
import { ProjectSettings } from '../models/preferences';
import { DocumentRepository } from '../repositories/document-repository';


const useSync = (
    project: string,
    projectSettings: ProjectSettings,
    repository?: DocumentRepository,
    pouchdbManager?: PouchdbManager): SyncStatus => {
    
    const [status, setStatus] = useState<SyncStatus>(SyncStatus.Offline);

    useEffect(() => {

        if(!pouchdbManager || !pouchdbManager.open || !repository || !project) {
            setStatus(SyncStatus.Offline);
            return;
        }

        const setupSyncPromise = setupSync(repository, project, projectSettings, setStatus);
        return () => {
            setupSyncPromise.then(setupSyncResult => {
                if (setupSyncResult) {
                    const [process, subscription] = setupSyncResult;
                    subscription.unsubscribe();
                    process.cancel();
                }
            });
        };
    }, [pouchdbManager, pouchdbManager?.open, repository, project, projectSettings]);

    if (!repository) return SyncStatus.Offline;

    return status;
};


const setupSync = async (
    repository: DocumentRepository,
    project: string,
    { url, password, connected } : ProjectSettings,
    setStatus: (status: SyncStatus) => void
): Promise<[SyncProcess, Subscription] | undefined> => {

    if (connected && url) {
        const fullUrl = url.replace(/(https?:\/\/)/, `$1${project}:${password}@`);
        const syncProcess = await repository.setupSync(fullUrl, project);
        const subscription = syncProcess.observer.subscribe({
            next: setStatus,
            error: err => {
                console.error('Error while syncing', err);
                setStatus(err);
            }
        });
        return [syncProcess, subscription];
    }
};


export default useSync;
