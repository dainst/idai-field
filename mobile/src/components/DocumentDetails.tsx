import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Document } from 'idai-field-core';
import { Avatar, Column, Icon, IconButton, Row, Text } from 'native-base';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView } from 'react-native';
import { DocumentRepository } from '../repositories/document-repository';
import { DocumentsContainerDrawerParamList } from './DocumentsContainer';


interface DocumentDetailsProps {
    repository: DocumentRepository;
    docId: string;
    navigation: DrawerNavigationProp<DocumentsContainerDrawerParamList, 'DocumentDetails'>;
}


const DrawerContent: React.FC<DocumentDetailsProps> = ({ repository, docId, navigation }) => {

    const [doc, setDoc] = useState<Document>();

    useEffect(() => {

        repository.get(docId).then(setDoc);
    }, [repository, docId]);

    if (!doc) return null;

    return (
        <Column m={ 4 } space={ 4 } alignItems="flex-start">
            <IconButton
                onPress={ () => navigation.navigate('DocumentsMap') }
                icon={ <Icon type="Ionicons" name="chevron-back" /> }
            />
            <Row alignItems="center" px={ 4 } pt={ 4 }>
                    <Avatar size="lg" _text={ styles.avatar.text }>
                        { doc.resource.type[0].toUpperCase() }
                    </Avatar>
                    <Column ml={ 2 } space={ 2 }>
                        <Text fontSize="lg" bold underline>
                            { doc.resource.identifier }
                        </Text>
                        <Text>{ doc.resource.shortDescription }</Text>
                    </Column>
            </Row>
            <ScrollView>
                <Text style={ styles.json }>
                    { JSON.stringify(doc, null, 4) }
                </Text>
            </ScrollView>
        </Column>
    );
};


const styles = {
    avatar: {
        text: {
            fontSize: '50px'
        }
    },
    json: {
        fontFamily: (Platform.OS === 'ios') ? 'Menlo' : 'monospace'
    }
};


export default DrawerContent;
