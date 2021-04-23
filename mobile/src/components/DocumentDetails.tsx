import { Document } from 'idai-field-core';
import { Avatar, Code, Column, Row, Text } from 'native-base';
import React, { useEffect, useState } from 'react';
import { DocumentRepository } from '../repositories/document-repository';

interface DocumentDetailsProps {
    repository: DocumentRepository;
    docId: string;
}


const DrawerContent: React.FC<DocumentDetailsProps> = ({ repository, docId }) => {

    const [doc, setDoc] = useState<Document>();

    useEffect(() => {

        repository.get(docId).then(setDoc);
    }, [repository, docId]);

    if (!doc) return null;

    return (
        <Column m={ 4 } space={ 4 }>
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
            <Code>
                { JSON.stringify(doc, null, 4) }
            </Code>
        </Column>
    );
};


const styles = {
    avatar: {
        text: {
            fontSize: '50'
        }
    }
};


export default DrawerContent;
