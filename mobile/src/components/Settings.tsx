import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { clone } from 'tsfun';
import { SyncSettings } from '../model/sync-settings';
import { DocumentRepository } from '../repositories/document-repository';
import ConnectPouchForm from './ConnectPouchForm';
import DisconectPouchForm from './DisconnectPouchForm';


interface SettingsProps {
    repository: DocumentRepository;
    syncSettings: SyncSettings;
    onSyncSettingsSet: (syncSettings: SyncSettings) => void;
}


const Settings: React.FC<SettingsProps> = ({ repository, syncSettings, onSyncSettingsSet }): ReactElement => {

    const onDisconnect = () => {

        repository.stopSync();
        const newSyncSettings = clone(syncSettings);
        newSyncSettings.connected = false;
        onSyncSettingsSet(newSyncSettings);
    };

    const onConnect = (syncSettings: SyncSettings) => {

        const { url, project, password } = syncSettings;
        const fullUrl = url.replace(/(https?:\/\/)/, `$1${project}:${password}@`);
        repository.setupSync(fullUrl, project);
        onSyncSettingsSet(syncSettings);
    };

    return <>
        { syncSettings.connected
            ? <DisconectPouchForm
                project={ syncSettings.project }
                onDisconnect={ onDisconnect } />
            : <ConnectPouchForm onConnect={ onConnect } />
        }
    </>;
};

const styles = StyleSheet.create({
    form: {
        flex: 1
    }
});


export default Settings;
