import { SyncStatus } from 'idai-field-core';
import React from 'react';
import { ProjectSettings } from '../../model/preferences';
import { DocumentRepository } from '../../repositories/document-repository';
import DocumentsContainer from './DocumentsContainer';


interface DocumentsScreenProps {
    repository?: DocumentRepository;
    syncStatus: SyncStatus;
    projectSettings: ProjectSettings;
    setProjectSettings: (projectSettings: ProjectSettings) => void;
}


const DocumentsScreen: React.FC<DocumentsScreenProps> = ({ repository, ...props }) =>
    repository ? <DocumentsContainer { ... { ...props, repository } } /> : null;


export default DocumentsScreen;
