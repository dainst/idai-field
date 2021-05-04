import PouchDB from 'pouchdb-react-native';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { DocumentRepository } from '../repositories/document-repository';


type SetRepository = Dispatch<SetStateAction<DocumentRepository | undefined>>;


const useRepository = (project: string, username: string): DocumentRepository | undefined => {

    const [repository, setRepository] = useState<DocumentRepository>();

    useEffect(() => {

        setupRepository(project, username, setRepository);
    }, [project, username]);

    return repository;
};


const setupRepository = async (project: string, username: string, setRepository: SetRepository) => {

    const repository = await DocumentRepository.init(project, (name: string) => new PouchDB(name), username);
    setRepository(repository);
};

export default useRepository;
