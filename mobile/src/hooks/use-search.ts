import { Document, Query } from 'idai-field-core';
import { useCallback, useEffect, useState } from 'react';
import { DocumentRepository } from '../repositories/document-repository';


const useSearch = (
    repository: DocumentRepository
): [Document[], (q: Query) => void] => {
    
    const [documents, setDocuments] = useState<Document[]>([]);
    const [currentQuery, setCurrentQuery] = useState<Query>({ q: '*' });

    const issueSearch = useCallback(
        () => repository.find(currentQuery).then(result => setDocuments(result.documents)),
        [repository, currentQuery]
    );

    useEffect(() => { issueSearch(); }, [issueSearch]);

    useEffect(() => {

        // TODO only react to remote changes
        // const s = repository.changed().subscribe(() => issueSearch());
        // return s.unsubscribe();
    }, [repository, issueSearch]);

    return [documents, setCurrentQuery];

};

export default useSearch;
