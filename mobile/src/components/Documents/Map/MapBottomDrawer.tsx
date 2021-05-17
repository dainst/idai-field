import { Document } from 'idai-field-core';
import { Text, View } from 'native-base';
import React from 'react';
import { StyleSheet } from 'react-native';
import Modal from 'react-native-modal';

interface MapBottomDrawerProps {
    document: Document | undefined;
    isVisible: boolean;
    closeHandler: () => void;
}

const MapBottomDrawer: React.FC<MapBottomDrawerProps> = (props) => {

    const animationDuration = 500;
    if(!props.document) return null;
    
    return (
        <Modal
            isVisible={ props.isVisible }
            animationInTiming={ animationDuration }
            animationOutTiming={ animationDuration }
            onBackdropPress={ props.closeHandler }
            backdropOpacity={ 0.0 }
            style={ styles.modal }>
            <View style={ styles.container }>
                <Text>Drawer</Text>
                <Text>{props.document.resource.id}</Text>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    container: {
        width: '100%',
        height: '25%',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderRadius: 10
    }
});

export default MapBottomDrawer;