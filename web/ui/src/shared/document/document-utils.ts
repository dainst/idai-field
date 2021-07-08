import { ResultDocument } from '../../api/result';
import CONFIGURATION from '../../configuration.json';


const IMAGE_CATEGORIES = ['Image', 'Photo', 'Drawing'];


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


export const isImage = (document: ResultDocument): boolean =>
    IMAGE_CATEGORIES.includes(document.resource.category.name);


export const isCategory = (document: ResultDocument, category: string): boolean =>
    document.resource.category.name === category;


const getLink = (doc: ResultDocument, projectId: string): [string, string] => {

    return isImage(doc)
        ? [window.location.href.includes(CONFIGURATION.fieldUrl)
            ? CONFIGURATION.fieldUrl
            : CONFIGURATION.shapesUrl, `/image/${projectId}/${doc.resource.id}`]
        : isCategory(doc, 'Type') || isCategory(doc, 'TypeCatalog')
            ? [CONFIGURATION.shapesUrl, `/document/${doc.resource.id}`]
            : [CONFIGURATION.fieldUrl,
                isCategory(doc, 'Project')
                    ? `/project/${projectId}`
                    : `/document/${projectId}/${doc.resource.id}`
            ];
};
