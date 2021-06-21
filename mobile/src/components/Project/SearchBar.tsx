import { Ionicons } from '@expo/vector-icons';
import { SyncStatus } from 'idai-field-core';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useOrientation from '../../hooks/use-orientation';
import { ProjectSettings } from '../../models/preferences';
import Button from '../common/Button';
import Input from '../common/Input';
import Row from '../common/Row';
import ScanBarcodeButton from './ScanBarcodeButton';
import SyncSettingsButton from './Sync/SyncSettingsButton';

interface SearchBarProps {
    projectSettings: ProjectSettings;
    syncStatus: SyncStatus;
    setProjectSettings: (settings: ProjectSettings) => void;
    issueSearch: (q: string) => void;
    toggleDrawer: () => void;
    onBarCodeScanned: (data: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
    projectSettings,
    syncStatus,
    setProjectSettings,
    issueSearch,
    toggleDrawer,
    onBarCodeScanned,
}) => {

    const orientation = useOrientation();
    const insets = useSafeAreaInsets();

    const [q, setQ] = useState<string>('');

    return (
        <Row style={ [styles.container, { marginTop: insets.top + 5 }] }>
            { orientation === 'portrait' && renderLeftIcons(toggleDrawer) }
            <Input
                placeholder="Search..."
                style={ styles.input }
                onChangeText={ setQ }
                onEndEditing={ () => issueSearch(q) }
                hideBorder
            />
            { renderRightIcons(projectSettings, setProjectSettings, syncStatus, onBarCodeScanned) }
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
    syncStatus: SyncStatus,
    onBarCodeScanned: (data: string) => void,
) =>
    <>
        <ScanBarcodeButton onBarCodeScanned={ onBarCodeScanned } />
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
        zIndex: 10,
    },
    input: {
        flex: 1,
    }
});


export default SearchBar;
