import { Document } from '../model/document/document';
import { DateSpecification } from '../model/input-types/date-specification';
import { parseDate } from '../tools/parse-date';


export type TypeName = string;

export interface IndexItem {

    id: string;
    identifier: string;
    date?: number;
}


export interface TypeResourceIndexItem extends IndexItem {

    instances: { [resourceId: string]: TypeName }
}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class IndexItem {

    private constructor() {} // hide on purpose, use from or copy instead


    public static from(document: Document, showWarnings: boolean = false,
                       addDate: boolean = false): IndexItem|undefined {

        if (!document.resource) throw 'illegal argument - document.resource undefined';
        if (!document.resource.id) throw 'illegal argument - document.id undefined';

        if (!document.resource.identifier) {
            if (showWarnings) console.warn('no identifier, will not index');
            return undefined;
        }

        const indexItem: IndexItem = {
            id: document.resource.id,
            identifier: document.resource.identifier
        };

        if (addDate) indexItem.date = IndexItem.getDate(document);

        return indexItem;
    }


    private static getDate(document: Document): number|undefined {

        if (!document.resource.date) return undefined;

        const dateSpecification: DateSpecification = document.resource.date;
        const dateValue: string = dateSpecification.endValue ?? dateSpecification.value;
        
        return dateValue
            ? parseDate(dateValue).getTime()
            : undefined;
    }
}
