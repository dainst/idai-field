import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Document, ProjectConfiguration } from 'idai-field-core';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Modal from 'react-native-modal';
import Button from '../../common/Button';
import CategoryIcon from '../../common/CategoryIcon';
import Heading from '../../common/Heading';
import Row from '../../common/Row';

interface MapBottomDrawerProps {
    document: Document | null;
    isVisible: boolean;
    closeHandler: () => void;
    config: ProjectConfiguration;
    navigateToDocument: (docId: string) => void;
}

const MapBottomDrawer: React.FC<MapBottomDrawerProps> = ({
    document, isVisible, closeHandler, config, navigateToDocument }) => {

    const animationDuration = 500;
    const iconSize = 20;


    if(!document) return null;

    const documentPressHandler = () => {
        closeHandler();
        navigateToDocument(document.resource.id);
    };
    
    return (
        <Modal
            isVisible={ isVisible }
            animationInTiming={ animationDuration }
            animationOutTiming={ animationDuration }
            onBackdropPress={ closeHandler }
            backdropOpacity={ 0 }
            style={ styles.modal }>
            <View style={ styles.container }>
                <TouchableOpacity onPress={ documentPressHandler }>
                    <Row style={ styles.headingRow }>
                        <CategoryIcon document={ document } config={ config } size={ 30 } />
                        <Heading style={ styles.heading }>{document.resource.identifier}</Heading>
                    </Row>
                </TouchableOpacity>
                <Text>Short description: { document.resource.shortDescription }</Text>
                <Row style={ styles.buttonGroup }>
                    <Button
                        variant="success"
                        title="Add Child"
                        onPress={ () => {console.log('button');} }
                        icon={ <Ionicons name="add" size={ iconSize } /> }
                    />
                    <Button
                        title="Focus"
                        onPress={ () => {console.log('button');} }
                        icon={ <MaterialIcons
                            name="center-focus-strong"
                            size={ iconSize }
                            color="#565350"
                        /> }
                    />
                </Row>
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
        height: '20%',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 10
    },
    headingRow: {
        alignItems: 'center',
        marginBottom: 10,
    },
    heading: {
        paddingLeft: 5,
    },
    buttonGroup: {
        marginTop: 'auto'
    }
});

export default MapBottomDrawer;
