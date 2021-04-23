import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Document } from 'idai-field-core';
import RootDrawerParamList from 'mobile/src/navigation/root-drawer-param-list';
import { View } from 'native-base';
import React, { ReactElement, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Map from '../components/Map/Map';
import SearchBar from '../components/SearchBar';
import useSync from '../hooks/use-sync';
import { DocumentRepository } from '../repositories/document-repository';


interface HomeScreenProps {
    repository: DocumentRepository;
    documents: Document[];
    issueSearch: (q: string) => void;
    navigation: DrawerNavigationProp<RootDrawerParamList, 'Home'>;
}


const HomeScreen: React.FC<HomeScreenProps> = ({ repository, navigation, documents, issueSearch }): ReactElement => {

    const [syncSettings, setSyncSettings, syncStatus] = useSync(repository);

    const toggleDrawer = useCallback(() => navigation.toggleDrawer(), [navigation]);

    return (
        <View flex={ 1 } safeArea>
            <SearchBar { ...{ issueSearch, syncSettings, setSyncSettings, syncStatus, toggleDrawer } } />
            <View style={ styles.container }>
                <Map geoDocuments={ documents.filter(doc => doc && doc.resource.geometry ? true : false) } />
            </View>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    input: {
        backgroundColor: 'white',
    }
});


export default HomeScreen;
