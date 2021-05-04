import { SyncStatus } from 'idai-field-core';
import React from 'react';
import DocumentsContainer from '../components/DocumentsContainer';
import { ProjectSettings } from '../model/preferences';
import { DocumentRepository } from '../repositories/document-repository';


interface DocumentsScreenProps {
    repository?: DocumentRepository;
    syncStatus: SyncStatus;
    projectSettings: ProjectSettings;
    setProjectSettings: (projectSettings: ProjectSettings) => void;
}


const DocumentsScreen: React.FC<DocumentsScreenProps> = ({ repository, ...props }) =>
    repository ? <DocumentsContainer { ... { ...props, repository } } /> : null;


export default DocumentsScreen;
