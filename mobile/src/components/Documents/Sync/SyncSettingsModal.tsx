import { Modal, Text } from 'native-base';
import React from 'react';
import { StyleSheet } from 'react-native';
import { clone } from 'tsfun';
import { ProjectSettings } from '../../../model/preferences';
import ConnectPouchForm from './ConnectPouchForm';
import DisconectPouchForm from './DisconnectPouchForm';

interface SyncSettingsModalProps {
    settings: ProjectSettings;
    isOpen: boolean;
    onSettingsSet: (syncSettings: ProjectSettings) => void,
    onClose: () => void;
}


const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({
    settings,
    isOpen,
    onSettingsSet,
    onClose
}) => {

    const onDisconnect = () => {

        const newSettings = clone(settings);
        newSettings.connected = false;
        onSettingsSet(newSettings);
    };

    const onConnect = (newSettings: ProjectSettings) => onSettingsSet(newSettings);

    return (
        <Modal
            isCentered
            isOpen={ isOpen }
            motionPreset="fade"
            closeOnOverlayClick
            onClose={ onClose }
        >
            <Modal.Content>
                <Modal.CloseButton />
                <Modal.Header style={ styles.header }>
                    <Text bold>
                        {settings.connected ? 'Connected' : 'Connect to project'}
                    </Text>
                </Modal.Header>
                <Modal.Body>
                { settings.connected
                    ? <DisconectPouchForm onDisconnect={ onDisconnect } />
                    : <ConnectPouchForm settings={ settings } onConnect={ onConnect } />
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


export default SyncSettingsModal;
