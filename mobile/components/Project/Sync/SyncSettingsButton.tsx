import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { SyncStatus } from 'idai-field-core';
import React, { useCallback, useContext, useState } from 'react';
import { PreferencesContext } from '@/contexts/preferences-context';
import { ProjectSettings } from '@/models/preferences';
import Button from '@/components/common/Button';
import SyncSettingsModal from './SyncSettingsModal';

interface SyncSettingsButtonProps {
  status: SyncStatus;
}

const SyncSettingsButton: React.FC<SyncSettingsButtonProps> = ({ status }) => {
  const preferences = useContext(PreferencesContext);

  const [showSettings, setShowSettings] = useState<boolean>(false);

  const setSettings = useCallback(
    (settings: ProjectSettings) => {
      preferences.setProjectSettings(
        preferences.preferences.currentProject,
        settings
      );
    },
    [preferences]
  );

  const settings =
    preferences.preferences.projects[preferences.preferences.currentProject];

  return (
    <>
      {showSettings && (
        <SyncSettingsModal
          settings={settings}
          onSettingsSet={(newSettings) => {
            setSettings(newSettings);
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      <Button
        variant="transparent"
        icon={React.cloneElement(getSyncStatusIcon(status), { size: 18 })}
        onPress={() => setShowSettings(true)}
      />
    </>
  );
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
