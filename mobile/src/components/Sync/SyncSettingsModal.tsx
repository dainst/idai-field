import { Modal, Text } from 'native-base';
import React from 'react';
import { StyleSheet } from 'react-native';
import { clone } from 'tsfun';
import { SyncSettings } from '../../model/settings';
import ConnectPouchForm from './ConnectPouchForm';
import DisconectPouchForm from './DisconnectPouchForm';

interface SyncSettingsModalProps {
    settings: SyncSettings;
    onSettingsSet: (syncSettings: SyncSettings) => void,
    isOpen: boolean;
    onClose: () => void;
}


const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({ settings, onSettingsSet, isOpen, onClose }) => {

    const onDisconnect = () => {

        const newSettings = clone(settings);
        newSettings.connected = false;
        onSettingsSet(newSettings);
    };

    const onConnect = (newSettings: SyncSettings) => onSettingsSet(newSettings);

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
