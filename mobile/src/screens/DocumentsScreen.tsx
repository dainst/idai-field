import { SyncStatus } from 'idai-field-core';
import React, { SetStateAction } from 'react';
import DocumentsContainer from '../components/DocumentsContainer';
import { Preferences } from '../model/preferences';
import { DocumentRepository } from '../repositories/document-repository';


interface DocumentsScreenProps {
    repository?: DocumentRepository;
    syncStatus: SyncStatus;
    preferences: Preferences;
    setPreferences: React.Dispatch<SetStateAction<Preferences>>;
}


const DocumentsScreen: React.FC<DocumentsScreenProps> = ({ repository, ...props }) =>
    repository ? <DocumentsContainer { ... { ...props, repository } } /> : null;


export default DocumentsScreen;
