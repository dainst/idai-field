import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Document } from 'idai-field-core';
import React from 'react';

interface DrawerContentProps {
    documents: Document[];
    onDocumentSelected: (document: Document) => void;
}


const DrawerContent: React.FC<DrawerContentProps> = ({ documents, onDocumentSelected }) => {

    return (
        <DrawerContentScrollView>
            { documents.map(doc => <DrawerItem
                key={ doc.resource.id }
                label={ doc.resource.identifier }
                onPress={ () => onDocumentSelected(doc) } />
            )}
        </DrawerContentScrollView>
    );
};

export default DrawerContent;
