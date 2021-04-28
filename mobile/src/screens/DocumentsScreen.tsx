import React, { SetStateAction } from 'react';
import DocumentsContainer from '../components/DocumentsContainer';
import { Settings } from '../model/settings';
import { DocumentRepository } from '../repositories/document-repository';


interface DocumentsScreenProps {
    repository?: DocumentRepository;
    settings: Settings;
    setSettings: React.Dispatch<SetStateAction<Settings>>;
}


const DocumentsScreen: React.FC<DocumentsScreenProps> = ({ repository, ...props }) =>
    repository ? <DocumentsContainer { ... { ...props, repository } } /> : null;


export default DocumentsScreen;
