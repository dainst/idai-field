import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { Document, ProjectConfiguration } from 'idai-field-core';
import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { DocumentRepository } from '../../../repositories/document-repository';
import Button from '../../common/Button';
import Column from '../../common/Column';
import DocumentButton from '../../common/DocumentButton';
import Row from '../../common/Row';
import DocumentDetails from '../DocumentDetails';

interface MapBottomDrawerProps {
    document: Document | null;
    config: ProjectConfiguration;
    repository: DocumentRepository;
    languages: string[];
    navigateToDocument: (docId: string) => void;
    addDocument: (parentDocId: string) => void;
    focusHandler: (docId: string) => void;
}

const MapBottomDrawer: React.FC<MapBottomDrawerProps> = ({
    document,
    config,
    repository,
    languages,
    navigateToDocument,
    addDocument,
    focusHandler
}) => {

    const iconSize = 20;
    const snapPoints = useMemo(() => [50, '25%', '50%'], []);

    if(!document) return null;

    const docId = document.resource.id;
    const documentPressHandler = () => navigateToDocument(docId);
    const addChildPressHandler = () => addDocument(docId);
    
    return (
        <BottomSheet
            index={ 1 }
            snapPoints={ snapPoints }
            style={ styles.modal }
        >
            <Row style={ styles.buttonGroup }>
                <DocumentButton
                    document={ document }
                    config={ config }
                    onPress={ documentPressHandler }
                    size={ 30 }
                    style={ styles.docButton }
                />
                <Button
                    variant="success"
                    title="Add Child"
                    onPress={ addChildPressHandler }
                    icon={ <Ionicons name="add" size={ iconSize } /> }
                />
                <Button
                    title="Focus"
                    onPress={ () => focusHandler(docId) }
                    icon={ <MaterialIcons
                        name="center-focus-strong"
                        size={ iconSize }
                        color="#565350"
                    /> }
                />
            </Row>
            <Column style={ styles.container }>
                <DocumentDetails
                    docId={ docId }
                    config={ config }
                    repository={ repository }
                    languages={ languages }
                    navigateToDocument={ navigateToDocument }
                />
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
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        backgroundColor: 'white',
        paddingHorizontal: 10,
        paddingBottom: 10,
    },
    headingRow: {
        alignItems: 'center',
        marginBottom: 10,
    },
    heading: {
        paddingLeft: 5,
    },
    buttonGroup: {
        margin: 5,
        marginTop: 0,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    docButton: {
        flex: 1,
    }
});

export default MapBottomDrawer;
