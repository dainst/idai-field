import React from 'react';
import { Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clone } from 'tsfun';
import { ProjectSettings } from '../../../models/preferences';
import ConnectPouchForm from './ConnectPouchForm';
import DisconectPouchForm from './DisconnectPouchForm';

interface SyncSettingsModalProps {
    settings: ProjectSettings;
    onSettingsSet: (syncSettings: ProjectSettings) => void,
    onClose: () => void;
}


const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({
    settings,
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
            onRequestClose={ onClose }
            animationType="slide"
        >
            <SafeAreaView>
                { settings.connected
                    ? <DisconectPouchForm onDisconnect={ onDisconnect } onClose={ onClose } />
                    : <ConnectPouchForm settings={ settings } onConnect={ onConnect } onClose={ onClose } />
                }
            </SafeAreaView>
        </Modal>);
};


export default SyncSettingsModal;
