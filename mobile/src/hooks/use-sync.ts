import { SyncStatus } from 'idai-field-core';
import { useEffect, useState } from 'react';
import { Settings } from '../model/settings';
import { DocumentRepository } from '../repositories/document-repository';


const useSync = (repository: DocumentRepository, settings: Settings): SyncStatus => {
    
    const [status, setStatus] = useState<SyncStatus>(SyncStatus.Offline);

    useEffect(() => { setupSync(repository, settings, setStatus); }, [repository, settings]);

    return status;
};


const setupSync = async (
    repository: DocumentRepository,
    { project, sync: { url, password, connected } }: Settings,
    setStatus: (status: SyncStatus) => void
) => {

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
    } else {
        repository.stopSync();
    }
};


export default useSync;
