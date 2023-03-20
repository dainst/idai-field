import { ResultDocument } from '../api/result';
import { Document } from '../api/document';
import { getLangStr } from '../shared/languages';


const MAX_LABEL_LENGTH = 35;


export const getProjectLabel = (projectDocument: ResultDocument|Document): string => {

    const shortDescription = getLangStr(projectDocument.resource.shortDescription);
    const shortName = getLangStr(projectDocument.resource.shortName);

    return shortName ??
        (shortDescription
            && shortDescription.length <= MAX_LABEL_LENGTH
                ? shortDescription
                : projectDocument.resource.identifier);
};
