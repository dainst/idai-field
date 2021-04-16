import { Center } from 'native-base';
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

    return (
        <Center style={ styles.container }>
                { syncSettings.connected ?
                <DisconectPouchForm
                    project={ syncSettings.project }
                    onDisconnect={ onDisconnect } /> :
                <ConnectPouchForm onConnect={ onConnect } /> }
        </Center>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 50,
    }
});


export default Settings;
