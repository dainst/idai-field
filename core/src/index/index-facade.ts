import { Observable, Observer } from 'rxjs';
import { filter, flow, forEach, is, isDefined, lookup, Map, on, separate, values } from 'tsfun';
import { Category } from '../model/category';
import { Document } from '../model/document';
import { Query } from '../model/query';
import { Resource } from '../model/resource';
import { Named } from '../tools/named';
import { ObserverUtil } from '../tools/observer-util';
import { ConstraintIndex } from './constraint-index';
import { FulltextIndex } from './fulltext-index';
import { getFieldsToIndex } from './get-fields-to-index';
import { getSortedIds } from './get-sorted-ids';
import { IndexItem, TypeResourceIndexItem } from './index-item';
import { performQuery } from './perform-query';

const TYPE = 'Type';
const INSTANCES = 'instances';
const INSTANCE_OF = 'isInstanceOf';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class IndexFacade {

    private observers: Array<Observer<Document>> = [];

    private indexItems: { [resourceId: string]: IndexItem } = {};

    private categoriesMap: Map<Category>;

    constructor(
        private constraintIndex: ConstraintIndex,
        private fulltextIndex: FulltextIndex,
        categories: Array<Category>,
        private showWarnings: boolean
    ) {
        this.categoriesMap = Named.arrayToMap(categories);
    }


    public changesNotifications = (): Observable<Document> => ObserverUtil.register(this.observers);


    public find(query: Query): Array<string /*resourceId*/> {

        const queryResult: Array<Resource.Id> = performQuery(query, this.constraintIndex, this.fulltextIndex);
        return this.getSortedResult(query, queryResult);
    }


    /**
     * @param document:
     *   document.resource.identifier needs to be present, otherwise document gets not indexed
     */
    public put(document: Document) {

        return this._put(document, false, true);
    }


    public async putMultiple(documents: Array<Document>, setIndexedDocuments?: (count: number) => Promise<void>) {

        const [typeDocuments, nonTypeDocuments] = separate(on(['resource','category'], is(TYPE)), documents);

        let count: number = 0;

        for (let document of typeDocuments) {
            this._put(document, true, false);
            count++;
            if (setIndexedDocuments && (count % 250 === 0 || count === documents.length)) {
                await setIndexedDocuments(count);
            }
        }
        for (let document of nonTypeDocuments) {
            this._put(document, true, false);
            count++;
            if (setIndexedDocuments && (count % 250 === 0 || count === documents.length)) {
                await setIndexedDocuments(count);
            }
        }
    }


    public remove(document: Document) {

        ConstraintIndex.remove(this.constraintIndex, document);
        FulltextIndex.remove(this.fulltextIndex, document);
        delete this.indexItems[document.resource.id];
        if (document.resource.category !== TYPE) {
            IndexFacade.deleteAssociatedTypeItem(this.indexItems, document);
        }
        ObserverUtil.notify(this.observers, document);
    }


    public clear() {

        ConstraintIndex.clear(this.constraintIndex);
        this.fulltextIndex = {};
        this.indexItems = {};
    }


    public getCount(constraintIndexName: string, matchTerm: string): number {

        return ConstraintIndex.getCount(this.constraintIndex, constraintIndexName, matchTerm);
    }


    public getDescendantIds(constraintIndexName: string, matchTerm: string): string[] {

        return ConstraintIndex.getWithDescendants(this.constraintIndex, constraintIndexName, matchTerm);
    }


    private getSortedResult(query: Query, queryResult: Array<Resource.Id>): Array<Resource.Id> {

        if (query.sort && query.sort.mode === 'none') {
            return queryResult;
        } else {
            const indexItems = queryResult.map(lookup(this.indexItems));
            return getSortedIds(indexItems, query);
        }
    }


    private _put(document: Document, skipRemoval: boolean, notify: boolean) {

        const item = this.getIndexItem(document);
        if (!item) return;

        if (document.resource.category === TYPE) {
            IndexFacade.updateTypeItem(item as TypeResourceIndexItem);
        } else {
            if (!skipRemoval) {
                IndexFacade.deleteAssociatedTypeItem(this.indexItems, document);
            }
            IndexFacade.createAssociatedTypeItem(this.indexItems, document, );
        }

        ConstraintIndex.put(this.constraintIndex, document, skipRemoval);
        FulltextIndex.put(this.fulltextIndex, document,
            getFieldsToIndex(this.categoriesMap, document.resource.category), skipRemoval);

        if (notify) ObserverUtil.notify(this.observers, document);
    }


    private getIndexItem(document: Document) {

        const existingItem = this.indexItems[document.resource.id];
        const indexItem = existingItem !== undefined
            ? existingItem
            : IndexItem.from(document, this.showWarnings);
        if (!existingItem && indexItem) this.indexItems[document.resource.id] = indexItem;
        return indexItem;
    }


    private static createAssociatedTypeItem(items: { [resourceId: string]: IndexItem },
                                            document: Document) {

        if (!document.resource.relations[INSTANCE_OF]) return;

        for (let target of document.resource.relations[INSTANCE_OF]) {
            const typeItem = items[target] as TypeResourceIndexItem;
            if (typeItem) {
                typeItem.instances[document.resource.id] = document.resource.category;
            }
        }
    }


    private static deleteAssociatedTypeItem(items: { [resourceId: string]: IndexItem },
                                            document: Document) {

        flow(
            items,
            filter(on(INSTANCES, isDefined)),
            values,
            forEach((item: TypeResourceIndexItem) => {
                delete item[INSTANCES][document.resource.id];
            })) ;
    }


    private static updateTypeItem(item: TypeResourceIndexItem) {

        if (!item.instances) { // keep existing instances on update
            item.instances = {};
        }
    }
}
