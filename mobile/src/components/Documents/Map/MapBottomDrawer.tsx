import { Document, ProjectConfiguration } from 'idai-field-core';
import { Avatar, HStack, Icon, IconButton, Text, View } from 'native-base';
import React from 'react';
import { StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Modal from 'react-native-modal';

interface MapBottomDrawerProps {
    document: Document | undefined;
    isVisible: boolean;
    closeHandler: () => void;
    config: ProjectConfiguration;
    navigateToDocument: (docId: string) => void;
}

const MapBottomDrawer: React.FC<MapBottomDrawerProps> = ({
    document, isVisible, closeHandler, config, navigateToDocument }) => {

    const animationDuration = 500;
    const iconSize = 60;


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
            backdropOpacity={ 0.0 }
            style={ styles.modal }>
            <View style={ styles.container }>
                <TouchableOpacity onPress={ documentPressHandler }>
                    <HStack p={ 4 } space={ 2 } alignItems="center">
                        <Avatar bg={ config.getColorForCategory(document.resource.category) }>
                                { document.resource.category[0].toUpperCase() }
                        </Avatar>
                        <Text fontSize="2xl" >{document.resource.identifier} </Text>
                    </HStack>
                </TouchableOpacity>
                <Text pl={ 6 }>Short description: { document.resource.shortDescription }</Text>
                <HStack style={ styles.buttonGroup }>
                    <IconButton
                        onPress={ () => {console.log('button');} }
                        icon={ <Icon type="AntDesign" name="pluscircle" size={ iconSize } color="green" /> }
                    />
                    <IconButton
                        onPress={ () => {console.log('button');} }
                        icon={
                            <Icon
                                type="MaterialCommunityIcons"
                                name="map-search-outline" size={ iconSize } color="#565350" /> }
                    />
                </HStack>
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
        borderRadius: 10
    },
    buttonGroup: {
        justifyContent: 'space-between',
        marginTop: 'auto',
        alignSelf: 'flex-end'
    }
});

export default MapBottomDrawer;