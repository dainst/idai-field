import { Document } from 'idai-field-core';
import { useCallback, useEffect, useState } from 'react';
import { DocumentRepository } from '../../repositories/document-repository';


const useSearch = (repository: DocumentRepository): [Document[], () => void] => {
    
    const [documents, setDocuments] = useState<Document[]>([]);

    const issueSearch = useCallback(() => {

        repository.find({ q: '*' }).then(result => setDocuments(result.documents));
    }, [repository]);

    useEffect(() => { issueSearch(); }, [issueSearch]);

    return [documents, issueSearch];

};

export default useSearch;
