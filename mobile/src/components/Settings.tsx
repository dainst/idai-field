import { SyncProcess } from 'idai-field-core';
import { Modal, Text } from 'native-base';
import React from 'react';
import { StyleSheet } from 'react-native';
import { clone } from 'tsfun';
import { SyncSettings } from '../model/sync-settings';
import { DocumentRepository } from '../repositories/document-repository';
import ConnectPouchForm from './ConnectPouchForm';
import DisconectPouchForm from './DisconnectPouchForm';

interface SettingsProps {
    repository: DocumentRepository;
    syncSettings: SyncSettings;
    onSyncSettingsSet: (syncSettings: SyncSettings, syncProcess?: SyncProcess) => void;
    isOpen: boolean;
    onClose: () => void;
}


const Settings: React.FC<SettingsProps> = ({ repository, syncSettings, onSyncSettingsSet, isOpen, onClose }) => {

    const onDisconnect = () => {

        repository.stopSync();
        const newSyncSettings = clone(syncSettings);
        newSyncSettings.connected = false;
        onSyncSettingsSet(newSyncSettings);
    };

    const onConnect = async (syncSettings: SyncSettings) => {

        const { url, project, password } = syncSettings;
        const fullUrl = url.replace(/(https?:\/\/)/, `$1${project}:${password}@`);
        const syncProcess = await repository.setupSync(fullUrl, project);
        onSyncSettingsSet(syncSettings, syncProcess);
    };

    return (
        <Modal
            isCentered
            isOpen={ isOpen }
            motionPreset="fade"
            closeOnOverlayClick
            onClose={ onClose }
        >
            <Modal.Content>
                <Modal.Header style={ styles.header }>
                    <Text bold>
                        {syncSettings.connected ? `Connected to ${syncSettings.project}` : 'Connect to project'}
                    </Text>
                </Modal.Header>
                <Modal.Body>
                { syncSettings.connected
                    ? <DisconectPouchForm
                        project={ syncSettings.project }
                        onDisconnect={ onDisconnect } />
                    : <ConnectPouchForm onConnect={ onConnect } />
                }
                </Modal.Body >
            </Modal.Content>
        </Modal>);
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center'
    }
});


export default Settings;
