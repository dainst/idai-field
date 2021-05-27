import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { SyncStatus } from 'idai-field-core';
import React, { useState } from 'react';
import { ProjectSettings } from '../../../models/preferences';
import Button from '../../common/Button';
import SyncSettingsModal from './SyncSettingsModal';


interface SyncSettingsButtonProps {
    settings: ProjectSettings;
    status: SyncStatus;
    setSettings: (settings: ProjectSettings) => void;
}


const SyncSettingsButton: React.FC<SyncSettingsButtonProps> = ({
    settings,
    status,
    setSettings
}) => {

    const [showSettings, setShowSettings] = useState<boolean>(false);

    return <>
    
        { showSettings && <SyncSettingsModal
            settings={ settings }
            onSettingsSet={ newSettings => {
                setSettings(newSettings);
                setShowSettings(false);
            } }
            onClose={ () => setShowSettings(false) }
        /> }

        <Button
            variant="transparent"
            icon={ React.cloneElement(getSyncStatusIcon(status), { size: 18 }) }
            onPress={ () => setShowSettings(true) } />

    </>;
};


const getSyncStatusIcon = (syncStatus: SyncStatus) => {
    
    switch (syncStatus) {
        case SyncStatus.Offline:
            return <MaterialIcons name="cloud-off" />;
        case SyncStatus.Pulling:
            return <MaterialIcons name="cloud-download" />;
        case SyncStatus.Pushing:
            return <MaterialIcons name="cloud-upload" />;
        case SyncStatus.InSync:
            return <MaterialCommunityIcons name="cloud-check" />;
        default:
            return <MaterialCommunityIcons name="cloud-alert" />;
    }
};

export default SyncSettingsButton;
