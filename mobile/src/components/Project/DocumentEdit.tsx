import { DrawerNavigationProp } from '@react-navigation/drawer';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DocumentRepository } from '../../repositories/document-repository';
import { DocumentsContainerDrawerParamList } from './DocumentsContainer';

type DocumentEditNav = DrawerNavigationProp<DocumentsContainerDrawerParamList, 'DocumentEdit'>;

interface DocumentEditProps {
    repository: DocumentRepository;
    navigation: DocumentEditNav;
    docId: string;
    categoryName: string;
}

const DocumentEdit: React.FC<DocumentEditProps> = ({ repository, navigation, docId, categoryName }) => {
    return (
        <SafeAreaView style={ styles.container }>
            <Text>Lets Edit {docId} with cat {categoryName}</Text>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});


export default DocumentEdit;