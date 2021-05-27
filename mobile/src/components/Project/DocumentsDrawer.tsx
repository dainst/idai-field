import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Document, ProjectConfiguration } from 'idai-field-core';
import React from 'react';
import Button from '../common/Button';
import CategoryIcon from '../common/CategoryIcon';
import Row from '../common/Row';

interface DocumentsDrawerProps {
    documents: Document[];
    config: ProjectConfiguration;
    onDocumentSelected: (document: Document) => void;
    onHomeButtonPressed: () => void;
    onSettingsButtonPressed: () => void;
}


const DocumentsDrawer: React.FC<DocumentsDrawerProps> = ({
    documents,
    config,
    onDocumentSelected,
    onHomeButtonPressed,
    onSettingsButtonPressed
}) => {

    return <>
        <DrawerContentScrollView>
            { documents.map(document => <DrawerItem
                key={ document.resource.id }
                label={ document.resource.identifier }
                onPress={ () => onDocumentSelected(document) }
                icon={ () => <CategoryIcon size={ 25 } document={ document } config={ config } /> }
            /> )}
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
