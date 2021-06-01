import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Document, ProjectConfiguration } from 'idai-field-core';
import React from 'react';
import { StyleSheet } from 'react-native';
import Button from '../common/Button';
import DocumentButton from '../common/DocumentButton';
import Row from '../common/Row';

interface DocumentsDrawerProps {
    documents: Document[];
    config: ProjectConfiguration;
    showHierarchyBackButton: boolean;
    onDocumentSelected: (document: Document) => void;
    onHomeButtonPressed: () => void;
    onSettingsButtonPressed: () => void;
    onParentSelected: (document: Document) => void;
    onHierarchyBack: () => void;
}


const DocumentsDrawer: React.FC<DocumentsDrawerProps> = ({
    documents,
    config,
    showHierarchyBackButton = false,
    onDocumentSelected,
    onHomeButtonPressed,
    onSettingsButtonPressed,
    onParentSelected,
    onHierarchyBack,
}) => {

    return <>
        <DrawerContentScrollView>
            { showHierarchyBackButton && <Button
                onPress={ onHierarchyBack }
                icon={ <Ionicons name="arrow-back" size={ 18 } /> }
            /> }
            { documents.map(document => <Row style={ styles.row } key={ document.resource.id }>
                <DocumentButton
                    style={ styles.documentButton }
                    config={ config }
                    document={ document }
                    onPress={ () => onDocumentSelected(document) }
                    size={ 25 }
                />
                <Button
                    onPress={ () => onParentSelected(document) }
                    icon={ <Ionicons name="arrow-forward" size={ 18 } /> }
                />
            </Row>)}
        </DrawerContentScrollView>
        <Row>
            <Button
                style={ { flex:1 } }
                onPress={ onHomeButtonPressed }
                icon={ <Ionicons name="home" size={ 18 } /> }
            />
            <Button
                style={ { flex:1 } }
                onPress={ onSettingsButtonPressed }
                icon={ <Ionicons name="settings" size={ 18 } /> }
            />
        </Row>
    </>;
};

export default DocumentsDrawer;


const styles = StyleSheet.create({
    row: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'stretch',
    },
    documentButton: {
        flex: 1,
    }
});
