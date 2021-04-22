import { Modal, Text } from 'native-base';
import React from 'react';
import { StyleSheet } from 'react-native';
import { clone } from 'tsfun';
import { SyncSettings } from '../model/sync-settings';
import ConnectPouchForm from './ConnectPouchForm';
import DisconectPouchForm from './DisconnectPouchForm';

interface SettingsProps {
    settings: SyncSettings;
    setSettings: (syncSettings: SyncSettings) => void,
    isOpen: boolean;
    onClose: () => void;
}


const Settings: React.FC<SettingsProps> = ({ settings, setSettings, isOpen, onClose }) => {

    const onDisconnect = () => {

        const newSettings = clone(settings);
        newSettings.connected = false;
        setSettings(newSettings);
    };

    const onConnect = (newSettings: SyncSettings) => setSettings(newSettings);

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
                        {settings.connected ? `Connected to ${settings.project}` : 'Connect to project'}
                    </Text>
                </Modal.Header>
                <Modal.Body>
                { settings.connected
                    ? <DisconectPouchForm
                        project={ settings.project }
                        onDisconnect={ onDisconnect } />
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


export default Settings;
