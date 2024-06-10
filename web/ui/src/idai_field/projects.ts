import { ResultDocument } from '../api/result';
import { Document } from '../api/document';
import { getTranslation } from '../shared/languages';


const MAX_LABEL_LENGTH = 35;


export const getProjectLabel = (projectDocument: ResultDocument|Document): string => {

    const shortDescription = getTranslation(projectDocument.resource.shortDescription);
    const shortName = getTranslation(projectDocument.resource.shortName);

    return shortName ||
        ((shortDescription
            && shortDescription.length <= MAX_LABEL_LENGTH)
                ? shortDescription
                : projectDocument.resource.identifier);
};
