import { isObject, isString } from 'tsfun';

/**
 * @author Thomas Kleinke
 */
export interface Literature {

    quotation: string;
    zenonId?: string;
    doi?: string;
    page?: string;
    figure?: string;
}


export module Literature {

    export const QUOTATION = 'quotation';
    export const ZENON_ID = 'zenonId';
    export const DOI = 'doi';
    export const PAGE = 'page';
    export const FIGURE = 'figure';

    const VALID_FIELDS = [QUOTATION, ZENON_ID, DOI, PAGE, FIGURE];


    export type Translations = 'zenonId'|'doi'|'page'|'figure';


    export function isLiterature(literature: any): literature is Literature {

        if (!isObject(literature)) return false;
        for (const fieldName in literature) {
            if (!VALID_FIELDS.includes(fieldName)) return false;
        }
        if (!isString(literature.quotation)) return false;
        if (literature.zenonId && !isString(literature.zenonId)) return false;
        if (literature.doi && !isString(literature.doi)) return false;
        if (literature.page && !isString(literature.page)) return false;
        if (literature.figure && !isString(literature.figure)) return false;
        return true;
    }


    export function isValid(literature: Literature, options?: any): boolean {

        return literature.quotation !== undefined && literature.quotation.length > 0;
    }


    export function generateLabel(literature: Literature, 
                                  getTranslation: (term: Literature.Translations) => string,
                                  includeZenonId: boolean = true,
                                  includeDoi: boolean = true): string {

        if (isValid(literature)) {

            let additionalInformation: string[] = [];
    
            if (includeZenonId && literature.zenonId) {
                additionalInformation.push(getTranslation('zenonId') + ': ' + literature.zenonId);
            }
            if (includeDoi && literature.doi) {
                additionalInformation.push(getTranslation('doi') + ': ' + literature.doi);
            }
            if (literature.page) {
                additionalInformation.push(getTranslation('page') + ' ' + literature.page);
            }
            if (literature.figure) {
                additionalInformation.push(getTranslation('figure') + ' ' + literature.figure);
            }
    
            return literature.quotation + (additionalInformation.length > 0
                ? ' (' + additionalInformation.join(', ') + ')'
                : ''
            );
        } else {
            return JSON.stringify(literature);
        }
    }
}
