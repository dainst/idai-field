import { Ionicons } from '@expo/vector-icons';
import { SyncStatus } from 'idai-field-core';
import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProjectSettings } from '../../models/preferences';
import Button from '../common/Button';
import Input from '../common/Input';
import Row from '../common/Row';
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

    const dimensions = useWindowDimensions();
    const insets = useSafeAreaInsets();

    return (
        <Row style={ [styles.container, { marginTop: insets.top + 5 }] }>
            { dimensions.width <= 768 && renderLeftIcons(toggleDrawer) }
            <Input
                placeholder="Search..."
                style={ styles.input }
                onChangeText={ (value: string) => issueSearch(value) }
                hideBorder
            />
            { renderRightIcons(projectSettings, setProjectSettings, syncStatus) }
        </Row>
    );
};


const renderLeftIcons = (onPress: () => void) =>
    <Button
        variant="transparent"
        onPress={ onPress }
        icon={ <Ionicons name="menu" size={ 18 } /> }
    />;
    

const renderRightIcons = (
    projectSettings: ProjectSettings,
    setProjectSettings: (settings: ProjectSettings) => void,
    syncStatus: SyncStatus
) =>
    <>
        <SyncSettingsButton
            settings={ projectSettings }
            setSettings={ setProjectSettings }
            status={ syncStatus }
        />
    </>;


const styles = StyleSheet.create({
    container: {
        margin: 10,
        padding: 3,
        backgroundColor: 'white',
        opacity: 0.9,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        borderRadius: 5,
        position: 'absolute',
        zIndex: 10,
    },
    input: {
        flex: 1,
    }
});


export default SearchBar;
