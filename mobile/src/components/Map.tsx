import React from 'react';
import { Card, CardItem, Text } from 'native-base';
import { Document } from 'idai-field-core';
import { StyleSheet } from 'react-native';

interface MapProps {
    documents: Document[]
}

const Map: React.FC<MapProps> = ({ documents }) => {

    return (
        <Card style={ styles.card }>
            {documents && documents.map(document => (
                <CardItem key={ document._id }>
                    <Text>{document.resource.id}</Text>
                </CardItem>
            ))}
        </Card>
    );
};

const styles= StyleSheet.create({
    card: {
        width: '90%',
        alignItems: 'center'
    },
});

export default Map;