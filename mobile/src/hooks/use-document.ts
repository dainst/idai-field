import { Document } from 'idai-field-core';
import { useEffect, useState } from 'react';
import { DocumentRepository } from '../repositories/document-repository';

const useDocument = (repository: DocumentRepository, docId: string | undefined): Document | undefined => {

    const [doc, setDoc] = useState<Document>();

    useEffect(() => {

        if(!docId) return undefined;
        repository.get(docId)
            .then(setDoc)
            .catch(_e => setDoc(undefined));

    }, [repository, docId]);

    return doc;
};

export default useDocument;