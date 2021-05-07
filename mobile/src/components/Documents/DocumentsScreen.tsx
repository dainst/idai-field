import { ProjectConfiguration, SyncStatus } from 'idai-field-core';
import React from 'react';
import { ProjectSettings } from '../../models/preferences';
import { DocumentRepository } from '../../repositories/document-repository';
import DocumentsContainer from './DocumentsContainer';


interface DocumentsScreenProps {
    repository?: DocumentRepository;
    syncStatus: SyncStatus;
    projectSettings: ProjectSettings;
    config?: ProjectConfiguration;
    setProjectSettings: (projectSettings: ProjectSettings) => void;
}


const DocumentsScreen: React.FC<DocumentsScreenProps> = ({ repository, config, ...props }) =>
    (repository && config) ? <DocumentsContainer { ... { ...props, config, repository } } /> : null;


export default DocumentsScreen;
