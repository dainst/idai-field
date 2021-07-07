import { ResultDocument } from '../api/result';
import { Document } from '../api/document';


const MAX_LABEL_LENGTH = 35;


export const getProjectLabel = (projectDocument: ResultDocument|Document): string => {

    return projectDocument.resource.shortName ??
        (projectDocument.resource.shortDescription
            && projectDocument.resource.shortDescription.length <= MAX_LABEL_LENGTH
                ? projectDocument.resource.shortDescription
                : projectDocument.resource.identifier);
};
