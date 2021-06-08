import { Ionicons } from '@expo/vector-icons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { ProjectConfiguration } from 'idai-field-core';
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import useDocument from '../../hooks/use-document';
import { DocumentRepository } from '../../repositories/document-repository';
import Button from '../common/Button';
import Heading from '../common/Heading';
import TitleBar from '../common/TitleBar';
import { DocumentsContainerDrawerParamList } from './DocumentsContainer';

type DocumentAddNav = DrawerNavigationProp<DocumentsContainerDrawerParamList, 'DocumentAdd'>;

interface DocumentAddProps {
    config: ProjectConfiguration;
    repository: DocumentRepository;
    parentDocId: string;
    navigation: DocumentAddNav;
}

const DocumentAdd: React.FC<DocumentAddProps> = ({ repository, parentDocId, navigation }) => {
    
    const parentDoc = useDocument(repository, parentDocId);

    if(!parentDoc) return null;

    return (
        <SafeAreaView style={ styles.container }>
            <TitleBar
                title={
                    <Heading style={ styles.heading }>
                        Add child to { parentDoc.resource.identifier }
                    </Heading>
                }
                left={ <Button
                    variant="transparent"
                    onPress={ () => navigation.navigate('DocumentsMap') }
                    icon={ <Ionicons name="chevron-back" size={ 18 } /> }
                /> }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
        flex: 1
    },
    heading: {
        marginLeft: 10,
    }
});

export default DocumentAdd;