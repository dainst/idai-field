import { SyncStatus } from 'idai-field-core';
import { SyncSettings } from 'mobile/src/model/sync-settings';
import { DocumentRepository } from 'mobile/src/repositories/document-repository';
import { useEffect, useState } from 'react';


const useSync = (repository: DocumentRepository):
    [SyncSettings, (syncSettings: SyncSettings) => void, SyncStatus] => {
    
    const [settings, setSettings] = useState<SyncSettings>(getDefaultSettings());
    const [status, setStatus] = useState<SyncStatus>(SyncStatus.Offline);

    useEffect(() => { setupSync(repository, settings, setStatus); }, [repository, settings]);

    return [settings, setSettings, status];
};
export default useSync;


const getDefaultSettings = () => ({
    url: '',
    project: '',
    password: '',
    connected: false
});


const setupSync = async (
    repository: DocumentRepository,
    { url, project, password, connected }: SyncSettings,
    setStatus: (status: SyncStatus) => void
) => {

    if (connected) {
        const fullUrl = url.replace(/(https?:\/\/)/, `$1${project}:${password}@`);
        const syncProcess = await repository.setupSync(fullUrl, project);
        syncProcess.observer.subscribe({ next: setStatus, error: setStatus });
    } else {
        repository.stopSync();
    }
};
