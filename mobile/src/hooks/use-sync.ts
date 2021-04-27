import { SyncStatus } from 'idai-field-core';
import React, { useEffect, useState } from 'react';
import { Settings } from '../model/settings';
import { DocumentRepository } from '../repositories/document-repository';


const useSync = (repository: DocumentRepository):
    [Settings, React.Dispatch<React.SetStateAction<Settings>>, SyncStatus] => {
    
    const [settings, setSettings] = useState<Settings>(getDefaultSettings());
    const [status, setStatus] = useState<SyncStatus>(SyncStatus.Offline);

    useEffect(() => { setupSync(repository, settings, setStatus); }, [repository, settings]);

    return [settings, setSettings, status];
};


const getDefaultSettings = () => ({
    project: 'test467',
    username: 'testuser',
    sync: {
        url: '',
        password: '',
        connected: false
    }
});


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
