import { Ionicons } from '@expo/vector-icons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Document, ProjectConfiguration } from 'idai-field-core';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { DocumentRepository } from '../../repositories/document-repository';
import Button from '../common/Button';
import Heading from '../common/Heading';
import TitleBar from '../common/TitleBar';
import { DocumentsContainerDrawerParamList } from './DocumentsContainer';

type DocumentAddNav = DrawerNavigationProp<DocumentsContainerDrawerParamList, 'DocumentAdd'>;

interface DocumentAddProps {
    config: ProjectConfiguration;
    repository: DocumentRepository;
    liesWithin: Document;
    navigation: DocumentAddNav;
}

const DocumentAdd: React.FC<DocumentAddProps> = ({ config, repository, liesWithin, navigation }) => {
    
    //const parentDoc = useDocument(repository, liesWithin);

    //if(!parentDoc) return null;

    return (
        <SafeAreaView style={ styles.container }>
            <TitleBar
                title={
                    <Heading style={ styles.heading }>
                        Add child to { liesWithin.resource.identifier }
                    </Heading>
                }
                left={ <Button
                    variant="transparent"
                    onPress={ () => navigation.navigate('DocumentsMap',{}) }
                    icon={ <Ionicons name="chevron-back" size={ 18 } /> }
                /> }
            />
            <View style={ { margin: 5 } }>
                {config.getHierarchyParentCategories(liesWithin.resource.category).map(value => (
                    <Text key={ value.name }>{value.name}</Text>
                ))}
            </View>
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