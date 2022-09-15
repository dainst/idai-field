import { ResultDocument } from '../../api/result';
import CONFIGURATION from '../../configuration.json';


const IMAGE_CATEGORIES = ['Image', 'Photo', 'Drawing'];
const TYPE_CATEGORIES = ['Type', 'TypeCatalog'];


export const getDocumentPermalink = (doc: ResultDocument): string => {

    const [baseUrl, path] = getLink(doc, doc.project);
    return baseUrl + path;
};


export const getDocumentLink = (doc: ResultDocument, projectId: string, currentBaseUrl?: string): string => {

    const [baseUrl, path] = getLink(doc, projectId);

    if (currentBaseUrl && baseUrl) {
        return (currentBaseUrl === baseUrl) ? path : baseUrl + path;
    } else {
        return path;
    }
};


export const getHierarchyLink = (doc: ResultDocument): string =>
    `/project/${doc.project}/hierarchy?parent=${doc.resource.id}`;


const getLink = (doc: ResultDocument, projectId: string): [string, string] => {

    return window.location.href.includes(CONFIGURATION.shapesUrl)
        ? getShapesLink(doc, projectId)
        : getFieldLink(doc, projectId);
};


const getFieldLink = (doc: ResultDocument, projectId: string): [string, string] => {

    if (IMAGE_CATEGORIES.includes(doc.resource.category.name)) {
        return [CONFIGURATION.fieldUrl, `/image/${projectId}/${doc.resource.id}`];
    }
    if (TYPE_CATEGORIES.includes(doc.resource.category.name)) {
        return [CONFIGURATION.fieldUrl, `/type/${projectId}/${doc.resource.id}`];
    }
    if ('Project' === doc.resource.category.name) {
        return [CONFIGURATION.fieldUrl, `/project/${projectId}`];
    }
    return [CONFIGURATION.fieldUrl, `/document/${projectId}/${doc.resource.id}`];
};


const getShapesLink = (doc: ResultDocument, projectId: string): [string, string] => {

    if (IMAGE_CATEGORIES.includes(doc.resource.category.name)) {
        return [CONFIGURATION.shapesUrl, `/image/${projectId}/${doc.resource.id}`];
    }
    if (TYPE_CATEGORIES.includes(doc.resource.category.name)) {
        return [CONFIGURATION.shapesUrl, `/document/${doc.resource.id}`];
    }
    if ('Project' === doc.resource.category.name) {
        return [CONFIGURATION.fieldUrl, `/project/${projectId}`];
    }
    return [CONFIGURATION.fieldUrl, `/document/${projectId}/${doc.resource.id}`];
};