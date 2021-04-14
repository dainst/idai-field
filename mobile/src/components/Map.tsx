import React from 'react';
import { View, Box, Text } from 'native-base';
import { Document } from 'idai-field-core';
import { StyleSheet } from 'react-native';

interface MapProps {
    documents: Document[]
}

const Map: React.FC<MapProps> = ({ documents }) => {

    return (
        <Box style={ styles.card }>
            {documents && documents.map(document => (
                <View key={ document._id }>
                    <Text>{document.resource.id}</Text>
                </View>
            ))}
        </Box>
    );
};

const styles= StyleSheet.create({
    card: {
        width: '90%',
        alignItems: 'center'
    },
});

export default Map;