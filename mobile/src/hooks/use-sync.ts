import { SyncStatus } from 'idai-field-core';
import { useEffect, useState } from 'react';
import { SyncSettings } from '../model/settings';
import { DocumentRepository } from '../repositories/document-repository';


const useSync = (project: string, syncSettings: SyncSettings, repository?: DocumentRepository): SyncStatus => {
    
    const [status, setStatus] = useState<SyncStatus>(SyncStatus.Offline);

    useEffect(() => {
        
        if (repository) setupSync(repository, project, syncSettings, setStatus);
    }, [repository, project, syncSettings]);

    if (!repository) return SyncStatus.Offline;

    return status;
};


const setupSync = async (
    repository: DocumentRepository,
    project: string,
    { url, password, connected } : SyncSettings,
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
