import { Document } from 'idai-field-core';
import { Avatar, Code, Column, Row, Text } from 'native-base';
import React from 'react';

interface DocumentDetailsProps {
    document: Document;
}


const DrawerContent: React.FC<DocumentDetailsProps> = ({ document }) => {

    return (
        <Column m={ 4 } space={ 4 }>
            <Row alignItems="center" px={ 4 } pt={ 4 }>
                <Avatar size="lg" _text={ styles.avatar.text }>
                    { document.resource.type[0].toUpperCase() }
                </Avatar>
                <Column ml={ 2 } space={ 2 }>
                    <Text fontSize="lg" bold underline>
                        { document.resource.identifier }
                    </Text>
                    <Text>{ document.resource.shortDescription }</Text>
                </Column>
            </Row>
            <Code>
                { JSON.stringify(document, null, 4) }
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
