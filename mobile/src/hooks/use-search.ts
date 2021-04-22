import { Document } from 'idai-field-core';
import { useEffect, useMemo, useState } from 'react';
import { DocumentRepository } from '../repositories/document-repository';


const useSearch = (repository: DocumentRepository): [Document[], (q: string) => void] => {
    
    const [documents, setDocuments] = useState<Document[]>([]);

    const issueSearch = useMemo(() => {

        return (q: string) => {
         
            repository.find({ q }).then(result => setDocuments(result.documents));
        };
    }, [repository]);

    useEffect(() => { issueSearch('*'); }, [issueSearch]);

    return [documents, issueSearch];

};

export default useSearch;
