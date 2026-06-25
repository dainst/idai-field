import React from 'react';
import { Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProjectSettings } from '@/models/preferences';
import { normalizeProjectSettings } from '@/models/project-settings';
import ConnectPouchForm from './ConnectPouchForm';
import DisconectPouchForm from './DisconnectPouchForm';

interface SyncSettingsModalProps {
    settings?: ProjectSettings;
    onSettingsSet: (syncSettings: ProjectSettings) => void,
    onClose: () => void;
}


const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({
    settings,
    onSettingsSet,
    onClose
}) => {

    const syncSettings = normalizeProjectSettings(settings);

    const onDisconnect = () => {
        onSettingsSet({ ...syncSettings, connected: false });
    };

    const onConnect = (newSettings: ProjectSettings) => onSettingsSet(normalizeProjectSettings(newSettings));

    return (
        <Modal
            onRequestClose={ onClose }
            animationType="slide"
        >
            <SafeAreaView>
                { syncSettings.connected
                    ? <DisconectPouchForm onDisconnect={ onDisconnect } onClose={ onClose } />
                    : <ConnectPouchForm settings={ syncSettings } onConnect={ onConnect } onClose={ onClose } />
                }
            </SafeAreaView>
        </Modal>);
};


export default SyncSettingsModal;
