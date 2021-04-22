import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Document } from 'idai-field-core';
import React from 'react';

interface DrawerContentProps {
    documents: Document[];
}


const DrawerContent: React.FC<DrawerContentProps> = ({ documents }) => {

    return (
        <DrawerContentScrollView>
            { documents.map(doc => <DrawerItem
                key={ doc.resource.id }
                label={ doc.resource.identifier }
                onPress={ () => console.log('Doc selected', doc) } />
            )}
        </DrawerContentScrollView>
    );
};

export default DrawerContent;
