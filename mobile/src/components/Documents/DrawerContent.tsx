import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Document } from 'idai-field-core';
import { Avatar, Icon, IconButton, View } from 'native-base';
import React from 'react';

interface DrawerContentProps {
    documents: Document[];
    onDocumentSelected: (document: Document) => void;
    onHomeButtonPressed: () => void;
    onSettingsButtonPressed: () => void;
}


const DrawerContent: React.FC<DrawerContentProps> = ({
    documents,
    onDocumentSelected,
    onHomeButtonPressed,
    onSettingsButtonPressed
}) => {

    return (
        <View flex={ 1 } safeArea>
            <IconButton
                onPress={ onHomeButtonPressed }
                icon={ <Icon type="Ionicons" name="home" /> }
            />
            <DrawerContentScrollView>
                { documents.map(doc => <DrawerItem
                    key={ doc.resource.id }
                    label={ doc.resource.identifier }
                    onPress={ () => onDocumentSelected(doc) }
                    icon={ () => <Avatar size="xs">{ doc.resource.type[0].toUpperCase() }</Avatar> } />
                )}
            </DrawerContentScrollView>
            <IconButton
                onPress={ onSettingsButtonPressed }
                icon={ <Icon type="Ionicons" name="settings" /> }
            />
        </View>
    );
};

export default DrawerContent;
