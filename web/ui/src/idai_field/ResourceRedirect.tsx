import React, { ReactElement, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Redirect, useParams } from 'react-router-dom';
import { search } from '../api/documents';
import { ResultDocument } from '../api/result';
import { LoginContext } from '../shared/login';
import NotFound from '../shared/NotFound';


export default function ResourceRedirect(): ReactElement {

    const { project, identifier } = useParams<{ project: string, identifier: string }>();
    const [document, setDocument] = useState<ResultDocument>(null);
    const [error, setError] = useState<string>(null);
    const loginData = useContext(LoginContext);
    const { t } = useTranslation();

    useEffect (() => {
        
        fetchDocument(project, identifier, loginData.token)
            .then((result: ResultDocument) => result ? setDocument(result) : setError('Not found'))
            .catch(setError);
    }, [project, identifier, loginData]);

    return error
        ? <NotFound />
        : document
            ? <Redirect to={ `/project/${project}/hierarchy/${document.resource.id}?parent=${getParent(document)}` } />
            : <div>{ t('redirect.waitForRedirection')}</div>;
}


const fetchDocument = async (project: string, identifier: string, token: string): Promise<ResultDocument> => {

    const result = await search({ filters: getFilters(project, identifier), q: '' }, token);

    if (result.documents.length > 0) {
        return result.documents[0];
    } else {
        throw new Error('Not found');
    }
};


const getParent = (document: ResultDocument): string => {

    return document.resource.parentId || 'root';
};


const getFilters = (project: string, identifier: string) => [
    { field: 'project', value: project },
    { field: 'resource.identifier', value: identifier }
];
