import { SyncStatus } from 'idai-field-core';
import { Icon, IconButton } from 'native-base';
import React, { useState } from 'react';
import { SyncSettings } from '../../model/settings';
import SyncSettingsModal from './SyncSettingsModal';


interface SyncSettingsButtonProps {
    settings: SyncSettings;
    setSyncSettings: (settings: SyncSettings) => void;
    status: SyncStatus;
}


const SyncSettingsButton: React.FC<SyncSettingsButtonProps> = ({ settings, setSyncSettings, status }) => {

    const [showSettings, setShowSettings] = useState<boolean>(false);

    return (<>
    
        <SyncSettingsModal
            settings={ settings }
            onSettingsSet={ newSyncSettings => {
                setSyncSettings(newSyncSettings);
                setShowSettings(false);
            } }
            isOpen={ showSettings }
            onClose={ () => setShowSettings(false) }
        />

        <IconButton
            variant="ghost"
            icon={ getSyncStatusIcon(status) }
            onPress={ () => setShowSettings(true) } />

    </>);
};


const getSyncStatusIcon = (syncStatus: SyncStatus) => {
    
    switch (syncStatus) {
        case SyncStatus.Offline:
            return <Icon type="MaterialIcons" name="cloud-off" />;
        case SyncStatus.Pulling:
            return <Icon type="MaterialIcons" name="cloud-download" />;
        case SyncStatus.Pushing:
            return <Icon type="MaterialIcons" name="cloud-upload" />;
        case SyncStatus.InSync:
            return <Icon type="MaterialCommunityIcons" name="cloud-check" />;
        default:
            return <Icon type="MaterialCommunityIcons" name="cloud-alert" />;
    }
};

export default SyncSettingsButton;
