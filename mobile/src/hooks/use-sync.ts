import { SyncProcess, SyncStatus } from 'idai-field-core';
import { useEffect, useState } from 'react';
import { SyncSettings } from '../model/preferences';
import { DocumentRepository } from '../repositories/document-repository';


const useSync = (project: string, syncSettings: SyncSettings, repository?: DocumentRepository): SyncStatus => {
    
    const [status, setStatus] = useState<SyncStatus>(SyncStatus.Offline);

    useEffect(() => {
        
        if (repository) {
            const syncProcess = setupSync(repository, project, syncSettings, setStatus);
            return () => {
                syncProcess.then(process => {
                    process && process.cancel();
                });
            };
        }
    }, [repository, project, syncSettings]);

    if (!repository) return SyncStatus.Offline;

    return status;
};


const setupSync = async (
    repository: DocumentRepository,
    project: string,
    { url, password, connected } : SyncSettings,
    setStatus: (status: SyncStatus) => void
): Promise<SyncProcess | undefined> => {

    if (connected) {
        const fullUrl = url.replace(/(https?:\/\/)/, `$1${project}:${password}@`);
        const syncProcess = await repository.setupSync(fullUrl, project);
        syncProcess.observer.subscribe({
            next: setStatus,
            error: err => {
                console.error('Error while syncing', err);
                setStatus(err);
            }
        });
        return syncProcess;
    }
};


export default useSync;
