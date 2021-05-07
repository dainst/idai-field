import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Document, ProjectConfiguration } from 'idai-field-core';
import { Avatar, Icon, IconButton, View } from 'native-base';
import React from 'react';

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
                    icon={ () => <Avatar size="xs" bg={ config.getColorForCategory(doc.resource.category) } >
                        { doc.resource.category[0].toUpperCase() }
                    </Avatar> } />
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
