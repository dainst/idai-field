import { Ionicons } from '@expo/vector-icons';
import { ProjectConfiguration } from 'core/src/configuration/project-configuration';
import { Document } from 'idai-field-core';
import React from 'react';
import { StyleSheet } from 'react-native';
import Button from '../common/Button';
import DocumentButton from '../common/DocumentButton';
import Row from '../common/Row';


export interface DocumentsListProps {
    documents: Document[];
    config: ProjectConfiguration;
    showHierarchyBackButton: boolean;
    onDocumentSelected: (document: Document) => void;
    onParentSelected: (document: Document) => void;
    onHierarchyBack: () => void;
}


const DocumentsList: React.FC<DocumentsListProps> = ({
    documents,
    config,
    showHierarchyBackButton = false,
    onDocumentSelected,
    onParentSelected,
    onHierarchyBack,
}) => {

    return <>
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
                variant="transparent"
                onPress={ () => onParentSelected(document) }
                icon={ <Ionicons name="arrow-forward" size={ 18 } /> }
            />
        </Row>)}
    </>;
};

export default DocumentsList;


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
