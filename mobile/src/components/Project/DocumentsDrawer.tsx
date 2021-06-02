import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import React from 'react';
import Button from '../common/Button';
import Row from '../common/Row';
import DocumentsList, { DocumentsListProps } from './DocumentsList';

interface DocumentsDrawerProps extends DocumentsListProps {
    onHomeButtonPressed: () => void;
    onSettingsButtonPressed: () => void;
}


const DocumentsDrawer: React.FC<DocumentsDrawerProps> = ({
    onHomeButtonPressed,
    onSettingsButtonPressed,
    ...listProps
}) => {

    return <>
        <DrawerContentScrollView>
            <DocumentsList { ...listProps } />
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
