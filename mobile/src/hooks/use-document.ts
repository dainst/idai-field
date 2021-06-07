import { Document } from 'idai-field-core';
import { useEffect, useState } from 'react';
import { DocumentRepository } from '../repositories/document-repository';

const useDocument = (repository: DocumentRepository, docId: string): Document | undefined => {

    const [doc, setDoc] = useState<Document>();

    useEffect(() => {

        repository.get(docId).then(setDoc);
    }, [repository, docId]);

    return doc;
};

export default useDocument;