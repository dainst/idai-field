import { Document } from '../../api/document';
import { ProjectView } from './Project';


export const getMapDeselectionUrl = (projectId: string, searchParams: URLSearchParams, view: ProjectView,
        document: Document): string => {

    return view === 'search'
        ? getProjectSearchResultsUrl(projectId, searchParams)
        : getContextUrl(projectId, searchParams, document);
};


const getContextUrl = (projectId: string, searchParams: URLSearchParams, document: Document): string => {

    const parentId: string = searchParams.get('r') === 'children'
        ? (document.resource.category.name === 'Project' ? undefined : document.resource.id)
        : document.resource.parentId;

    return `/project/${projectId}/hierarchy?parent=${parentId ?? 'root'}`;
};


const getProjectSearchResultsUrl = (projectId: string, searchParams: URLSearchParams): string => {

    searchParams.delete('r');
    return `/project/${projectId}/search?${searchParams.toString()}`;
};
