import { Category, PouchdbManager } from 'idai-field-core';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { DocumentRepository } from '../repositories/document-repository';


type SetRepository = Dispatch<SetStateAction<DocumentRepository | undefined>>;


const useRepository = (
    project: string,
    username: string,
    categories: Category[],
    pouchdbManager: PouchdbManager | undefined
): DocumentRepository | undefined => {

    const [repository, setRepository] = useState<DocumentRepository>();

    useEffect(() => {

        if (!pouchdbManager) return;
        
        setupRepository(project, username, categories, pouchdbManager, setRepository);
    }, [project, username, categories, pouchdbManager]);

    return repository;
};


const setupRepository = async (
    project: string,
    username: string,
    categories: Category[],
    pouchdbManager: PouchdbManager,
    setRepository: SetRepository
) => {

    const repository = await DocumentRepository.init(project, username, categories, pouchdbManager);
    setRepository(repository);
};

export default useRepository;
