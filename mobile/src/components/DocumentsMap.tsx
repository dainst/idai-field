import { DrawerNavigationProp } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { Document } from 'idai-field-core';
import { useToast, View } from 'native-base';
import React, { ReactElement, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import DocumentDetails from '../components/DocumentDetails';
import Map from '../components/Map/Map';
import ScanBarcodeButton from '../components/ScanBarcodeButton';
import SearchBar from '../components/SearchBar';
import useSync from '../hooks/use-sync';
import { DocumentRepository } from '../repositories/document-repository';
import { DocumentsScreenDrawerParamList } from '../screens/DocumentsScreen';


export type DocumentsMapStackParamList = {
    Map: undefined;
    DocumentDetails: { docId: string }
};


const Stack = createStackNavigator<DocumentsMapStackParamList>();


interface DocumentsMapProps {
    repository: DocumentRepository;
    documents: Document[];
    issueSearch: (q: string) => void;
    navigation: DrawerNavigationProp<DocumentsScreenDrawerParamList, 'Documents'>;
    selectedDocument?: Document;
}


const DocumentsMap: React.FC<DocumentsMapProps> = ({
    repository,
    navigation,
    documents,
    issueSearch
}): ReactElement => {

    const [syncSettings, setSyncSettings, syncStatus] = useSync(repository);
    const toast = useToast();

    const toggleDrawer = useCallback(() => navigation.toggleDrawer(), [navigation]);

    const onBarCodeScanned = useCallback((data: string) => {

        repository.find({ constraints: { 'identifier:match': data } })
            .then(({ documents: [doc] }) =>
                navigation.navigate('Documents', { screen: 'DocumentDetails', params: { docId: doc.resource.id } })
            )
            .catch(() => toast({ title: `Resource  '${data}' not found`, position: 'center' }));
    }, [repository, navigation, toast]);
        

    return (
        <View flex={ 1 } safeArea>
            <SearchBar { ...{ issueSearch, syncSettings, setSyncSettings, syncStatus, toggleDrawer } } />
            <View style={ styles.container }>
                <Stack.Navigator initialRouteName="Map" screenOptions={ { headerShown: false } }>
                    <Stack.Screen name="Map">
                        { (props) => <Map { ...props }
                            geoDocuments={ documents.filter(doc => doc?.resource.geometry) } /> }
                    </Stack.Screen>
                    <Stack.Screen name="DocumentDetails">
                        { (props) => <DocumentDetails { ...props }
                            docId={ props.route.params.docId }
                            repository={ repository } /> }
                    </Stack.Screen>
                </Stack.Navigator>
            </View>
            <ScanBarcodeButton onBarCodeScanned={ onBarCodeScanned } />
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


export default DocumentsMap;
