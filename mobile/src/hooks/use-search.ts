import { Document } from 'idai-field-core';
import { useCallback, useEffect, useState } from 'react';
import { DocumentRepository } from '../repositories/document-repository';


const useSearch = (
    repository: DocumentRepository
): [Document[], (q: string) => void] => {
    
    const [documents, setDocuments] = useState<Document[]>([]);
    const [q, setQ] = useState<string>('*');

    const issueSearch = useCallback(
        () => repository.find({ q }).then(result => setDocuments(result.documents)),
        [repository, q]
    );

    useEffect(() => { issueSearch(); }, [issueSearch]);

    useEffect(() => {

        // TODO only react to remote changes
        const s = repository.changed().subscribe(() => issueSearch());
        return () => s.unsubscribe();
    }, [repository, issueSearch]);

    return [documents, setQ];

};

export default useSearch;
