import { SyncStatus } from 'idai-field-core';
import { Box, HStack, Icon, IconButton, Input } from 'native-base';
import React from 'react';
import { ProjectSettings } from '../model/preferences';
import SyncSettingsButton from './Sync/SyncSettingsButton';

interface SearchBarProps {
    projectSettings: ProjectSettings;
    syncStatus: SyncStatus;
    setProjectSettings: (settings: ProjectSettings) => void;
    issueSearch: (q: string) => void;
    toggleDrawer: () => void
}

const SearchBar: React.FC<SearchBarProps> = ({
    projectSettings,
    syncStatus,
    setProjectSettings,
    issueSearch,
    toggleDrawer
}) => {

    return (
        <Box style={ styles.box }>
            <Input
                placeholder="Search..."
                style={ styles.input }
                onChangeText={ issueSearch }
                InputLeftElement={ renderLeftIcons(toggleDrawer) }
                InputRightElement={ renderRightIcons(issueSearch, projectSettings, setProjectSettings, syncStatus) }
            />
        </Box>
    );
};


const renderLeftIcons = (onPress: () => void) =>
    <IconButton
        onPress={ onPress }
        icon={ <Icon type="Ionicons" name="menu" /> }
    />;
    

const renderRightIcons = (
    issueSearch: (q: string) => void,
    projectSettings: ProjectSettings,
    setProjectSettings: (settings: ProjectSettings) => void,
    syncStatus: SyncStatus
) =>
    <HStack>
        <IconButton
            onPress={ () => issueSearch('*') }
            isDisabled={ syncStatus === SyncStatus.Offline ? true : false }
            icon={ <Icon type="Ionicons" name="refresh" /> }
        />
        <SyncSettingsButton
            settings={ projectSettings }
            setSettings={ setProjectSettings }
            status={ syncStatus }
        />
    </HStack>;


const styles = {
    box: {
        padding: 10
    },
    input: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    }
};


export default SearchBar;
