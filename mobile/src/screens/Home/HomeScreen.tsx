import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Document, SyncStatus } from 'idai-field-core';
import RootDrawerParamList from 'mobile/src/navigation/root-drawer-param-list';
import { Button, HStack, Icon, IconButton, Input, View } from 'native-base';
import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import AppHeader from '../../components/AppHeader';
import Map from '../../components/Map/Map';
import SyncSettingsButton from '../../components/Sync/SyncSettingsButton';
import { SyncSettings } from '../../model/sync-settings';
import { DocumentRepository } from '../../repositories/document-repository';
import useSync from './use-sync';


interface HomeScreenProps {
    repository: DocumentRepository;
    documents: Document[];
    issueSearch: () => void;
    navigation: DrawerNavigationProp<RootDrawerParamList, 'Home'>;
}


const HomeScreen: React.FC<HomeScreenProps> = ({ repository, navigation, documents, issueSearch }): ReactElement => {

    const [syncSettings, setSyncSettings, syncStatus] = useSync(repository);

    return (
        <View flex={ 1 } safeArea>
            <AppHeader
                left={ renderHeaderLeft(() => navigation.toggleDrawer()) }
                middle={ renderHeaderMiddle() }
                right={ renderHeaderRight(() => issueSearch(), syncSettings, setSyncSettings, syncStatus) }
            />
            <View style={ styles.container }>
                <Map geoDocuments={ documents.filter(doc => doc && doc.resource.geometry ? true : false) } />
            </View>
        </View>
    );
};


const renderHeaderLeft = (onPress: () => void) =>
    <IconButton
        onPress={ onPress }
        icon={ <Icon type="Ionicons" name="menu" color="white" /> }
    />;

const renderHeaderMiddle = () =>
    <Input
        placeholder="Search..."
        variant="outline"
        width="80%"
        height={ 10 }
        style={ styles.input }
        InputRightElement={
        <Button height={ 12 } bg="transparent">
            <Icon type="Ionicons" name="search" />
        </Button>
        }
    />;

const renderHeaderRight = (
    issueSearch: () => void,
    syncSettings: SyncSettings,
    setSyncSettings: (settings: SyncSettings) => void,
    syncStatus: SyncStatus
) =>
    <HStack>
        <IconButton
            onPress={ issueSearch }
            isDisabled={ syncStatus === SyncStatus.Offline ? true : false }
            icon={ <Icon type="Ionicons" name="refresh" color="white" /> }
        />
        <SyncSettingsButton
            settings={ syncSettings }
            setSyncSettings={ setSyncSettings }
            status={ syncStatus }
        />
    </HStack>;


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    input: {
        backgroundColor: 'white',
    }
});


export default HomeScreen;
