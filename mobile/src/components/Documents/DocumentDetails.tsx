import { Ionicons } from '@expo/vector-icons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Document, ProjectConfiguration } from 'idai-field-core';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DocumentRepository } from '../../repositories/document-repository';
import Button from '../common/Button';
import CategoryIcon from '../common/CategoryIcon';
import Heading from '../common/Heading';
import TitleBar from '../common/TitleBar';
import { DocumentsContainerDrawerParamList } from './DocumentsContainer';


interface DocumentDetailsProps {
    config: ProjectConfiguration;
    repository: DocumentRepository;
    docId: string;
    navigation: DrawerNavigationProp<DocumentsContainerDrawerParamList, 'DocumentDetails'>;
}


const DrawerContent: React.FC<DocumentDetailsProps> = ({ config, repository, docId, navigation }) => {

    const [doc, setDoc] = useState<Document>();

    useEffect(() => {

        repository.get(docId).then(setDoc);
    }, [repository, docId]);

    if (!doc) return null;

    return (
        <SafeAreaView>
            <TitleBar
                title={ <>
                    <CategoryIcon
                        size={ 30 }
                        config={ config }
                        document={ doc }
                    />
                    <Heading style={ styles.heading }>{ doc.resource.identifier }</Heading>
                </> }
                left={ <Button
                    variant="transparent"
                    onPress={ () => navigation.navigate('DocumentsMap') }
                    icon={ <Ionicons name="chevron-back" size={ 18 } /> }
                /> }
                right={ <Button
                    variant="transparent"
                    onPress={ () => { return; } }
                    icon={ <Ionicons name="pencil" size={ 18 } /> } /> }
            />
            <ScrollView>
                <Text style={ styles.json }>
                    { JSON.stringify(doc, null, 4) }
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    heading: {
        marginLeft: 10,
    },
    json: {
        margin: 20,
        fontFamily: (Platform.OS === 'ios') ? 'Menlo' : 'monospace',
    },
});


export default DrawerContent;
