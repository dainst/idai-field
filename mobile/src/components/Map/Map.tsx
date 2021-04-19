import { Document } from 'idai-field-core';
import { Box, HStack, Text } from 'native-base';
import React from 'react';
import { StyleSheet } from 'react-native';

interface MapProps {
    geoDocuments: Document[]
}

const Map: React.FC<MapProps> = ({ documents }) => {

    return (
        <Box style={ styles.card }>
            {geoDocuments && geoDocuments.map(document => (
                <HStack key={ document._id } space={ 2 }>
                    <Text>{document.resource.id}</Text>
                    <Text>{document.resource.shortDescription}</Text>
                </HStack>
            ))}
        </Box>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '90%',
        alignItems: 'center'
    },
});

export default Map;