import { SyncStatus } from 'idai-field-core';
import React, { SetStateAction } from 'react';
import DocumentsContainer from '../components/DocumentsContainer';
import { SyncSettings } from '../model/settings';
import { DocumentRepository } from '../repositories/document-repository';


interface DocumentsScreenProps {
    repository?: DocumentRepository;
    syncStatus: SyncStatus;
    syncSettings: SyncSettings;
    setSyncSettings: React.Dispatch<SetStateAction<SyncSettings>>;
}


const DocumentsScreen: React.FC<DocumentsScreenProps> = ({ repository, ...props }) =>
    repository ? <DocumentsContainer { ... { ...props, repository } } /> : null;


export default DocumentsScreen;
