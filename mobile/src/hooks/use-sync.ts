import { PouchdbManager, SyncProcess, SyncStatus } from 'idai-field-core';
import { useEffect, useState } from 'react';
import { Subscription } from 'rxjs';
import { ToastType } from '../components/common/Toast/ToastProvider';
import { ProjectSettings } from '../models/preferences';
import { DocumentRepository } from '../repositories/document-repository';
import useToast from './use-toast';

const useSync = (
    project: string,
    projectSettings: ProjectSettings,
    repository?: DocumentRepository,
    pouchdbManager?: PouchdbManager): SyncStatus => {
    
    const [status, setStatus] = useState<SyncStatus>(SyncStatus.Offline);
    const { showToast } = useToast();

    useEffect(() => {

        if(!pouchdbManager || !pouchdbManager.open || !repository || !project) {
            setStatus(SyncStatus.Offline);
            return;
        }

        const setupSyncPromise = setupSync(repository, project, projectSettings, setStatus, showToast);
        return () => {
            setupSyncPromise.then(setupSyncResult => {
                if (setupSyncResult) {
                    const [process, subscription] = setupSyncResult;
                    subscription.unsubscribe();
                    process.cancel();
                }
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pouchdbManager, pouchdbManager?.open, repository, project, projectSettings]);

    if (!repository) return SyncStatus.Offline;

    return status;
};


const setupSync = async (
    repository: DocumentRepository,
    project: string,
    { url, password, connected } : ProjectSettings,
    setStatus: (status: SyncStatus) => void,
    showToast: (type: ToastType, message: string, duration?: number | undefined) => void,
): Promise<[SyncProcess, Subscription] | undefined> => {

    if (connected && url) {
        const fullUrl = url.replace(/(https?:\/\/)/, `$1${project}:${password}@`);
        const syncProcess = await repository.setupSync(fullUrl, project);
        const subscription = syncProcess.observer.subscribe({
            next: setStatus,
            error: err => {
                showToast(ToastType.Error,`Error while syncing ${err}`);
                console.error('Error while syncing', err);
                setStatus(err);
            }
        });
        return [syncProcess, subscription];
    }
};


export default useSync;
