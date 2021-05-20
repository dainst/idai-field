import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Document, ProjectConfiguration } from 'idai-field-core';
import React from 'react';
import Button from '../common/Button';
import CategoryIcon from '../common/CategoryIcon';

interface DrawerContentProps {
    documents: Document[];
    config: ProjectConfiguration;
    onDocumentSelected: (document: Document) => void;
    onHomeButtonPressed: () => void;
    onSettingsButtonPressed: () => void;
}


const DrawerContent: React.FC<DrawerContentProps> = ({
    documents,
    config,
    onDocumentSelected,
    onHomeButtonPressed,
    onSettingsButtonPressed
}) => {

    return <>
        <Button
            onPress={ onHomeButtonPressed }
            icon={ <Ionicons name="home" size={ 18 } /> }
        />
        <DrawerContentScrollView>
            { documents.map(document => <DrawerItem
                key={ document.resource.id }
                label={ document.resource.identifier }
                onPress={ () => onDocumentSelected(document) }
                icon={ () => <CategoryIcon size={ 25 } document={ document } config={ config } /> }
            /> )}
        </DrawerContentScrollView>
        <Button
            onPress={ onSettingsButtonPressed }
            icon={ <Ionicons name="settings" size={ 18 } /> }
        />
    </>;
};

export default DrawerContent;
