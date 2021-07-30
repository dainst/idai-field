import { PouchdbDatastore, SyncService, SyncStatus, Document } from 'idai-field-core';
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
    pouchdbDatastore?: PouchdbDatastore): SyncStatus => {
    
    const [status, setStatus] = useState<SyncStatus>(SyncStatus.Offline);
    const { showToast } = useToast();

    useEffect(() => {

        if(!pouchdbDatastore || !pouchdbDatastore.open || !repository || !project) {
            setStatus(SyncStatus.Offline);
            return;
        }

        const setupSyncPromise = setupSync(repository, project, projectSettings, setStatus, showToast);
        return () => {
            setupSyncPromise.then(setupSyncResult => {
                if (setupSyncResult) {
                    const [subscription] = setupSyncResult;
                    subscription.unsubscribe();
                    // process.cancel();
                }
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pouchdbDatastore, pouchdbDatastore?.open, repository, project, projectSettings]);

    if (!repository) return SyncStatus.Offline;

    return status;
};


const setupSync = async (
    repository: DocumentRepository,
    project: string,
    { url, password, connected } : ProjectSettings,
    setStatus: (status: SyncStatus) => void,
    showToast: (type: ToastType, message: string, duration?: number | undefined) => void
): Promise<[Subscription] | undefined> => {

    if (connected && url && repository.syncService) {
        repository.syncService.init(url, project, password);
        try {
            const statusSubscription = repository.syncService
                .statusNotifications().subscribe(status => setStatus(status));
            // TODO make error subscription, too; see below
            // TODO reactivate showToast
            // const subscription = syncProcess.observer.subscribe({
                // next: setStatus,
                // error: err => {
                    // showToast(ToastType.Error,`Error while syncing ${err}`);
                    // console.error('Error while syncing', err);
                    // setStatus(err);
                // }
            // });
            // return [statusSubscription];
            repository.syncService
                .startSync((doc: Document) => !['Image', 'Photo', 'Drawing'].includes(doc.resource.type))
                .subscribe(); // TODO we should not need to subscribe here; jsut call startSync and be done, because we already subscribed to statusNotifications
            return [statusSubscription];
        } catch (e) {
            console.log('error in setupSync', e);
            return undefined;
        }
    }
};


export default useSync;
