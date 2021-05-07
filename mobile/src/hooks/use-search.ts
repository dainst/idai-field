import { Document, ProjectCategories, ProjectConfiguration } from 'idai-field-core';
import { useEffect, useMemo, useState } from 'react';
import { DocumentRepository } from '../repositories/document-repository';


const useSearch = (
    repository: DocumentRepository,
    config: ProjectConfiguration
): [Document[], (q: string) => void] => {
    
    const [documents, setDocuments] = useState<Document[]>([]);

    const issueSearch = useMemo(() => {

        return (q: string) => {
         
            const query = { q, categories: getCategoryNames(config) };
            console.log({ query });
            repository.find(query).then(result => setDocuments(result.documents));
        };
    }, [repository, config]);

    useEffect(() => { issueSearch('*'); }, [issueSearch]);

    return [documents, issueSearch];

};

export default useSearch;


const getCategoryNames = (config: ProjectConfiguration) =>
    ProjectCategories.getConcreteFieldCategoryNames(config.getCategoryForest());
