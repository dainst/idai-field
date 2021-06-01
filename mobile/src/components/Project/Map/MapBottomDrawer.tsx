import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { Document, ProjectConfiguration } from 'idai-field-core';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Button from '../../common/Button';
import CategoryIcon from '../../common/CategoryIcon';
import Column from '../../common/Column';
import Heading from '../../common/Heading';
import Row from '../../common/Row';

interface MapBottomDrawerProps {
    document: Document | null;
    config: ProjectConfiguration;
    navigateToDocument: (docId: string) => void;
}

const MapBottomDrawer: React.FC<MapBottomDrawerProps> = ({
    document, config, navigateToDocument }) => {

    const iconSize = 20;
    const snapPoints = useMemo(() => ['5%','35%'], []);

    if(!document) return null;

    const documentPressHandler = () => navigateToDocument(document.resource.id);
    
    return (
        <BottomSheet
            index={ 1 }
            snapPoints={ snapPoints }
            style={ styles.modal }>
                <Column style={ styles.container }>
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
                </Column>
        </BottomSheet>
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
