import { isUndefinedOrEmpty, update } from 'tsfun';
import { Document } from '../model/document';


// TODO migrate everything to isChildOf, then get rid of this adjustments
export function adjustIsChildOf(document: Document): Document {

    if (!document.resource.relations) return document;

    let adjusted = document;
    if (!isUndefinedOrEmpty(adjusted.resource.relations['isRecordedIn'])) {
        
        if (!isUndefinedOrEmpty(adjusted.resource.relations['liesWithin'])) {
            adjusted = update(
                ['resource', 'relations', 'isChildOf'], 
                adjusted.resource.relations['liesWithin'],
                adjusted
            );
        } else {
            adjusted = update(
                ['resource', 'relations', 'isChildOf'], 
                adjusted.resource.relations['isRecordedIn'],
                adjusted
            );
        }
    } else {
        if (!isUndefinedOrEmpty(adjusted.resource.relations['liesWithin'])) {
            adjusted = update(
                ['resource', 'relations', 'isChildOf'], 
                adjusted.resource.relations['liesWithin'],
                adjusted
            );
        }
    }
    return adjusted;
}
