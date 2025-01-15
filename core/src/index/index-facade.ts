import { Observable, Observer } from 'rxjs';
import { filter, flow, forEach, includedIn, isDefined, lookup, on, separate, to, values } from 'tsfun';
import { Field } from '../model/configuration/field';
import { Document } from '../model/document/document';
import { Query } from '../model/datastore/query';
import { Resource } from '../model/document/resource';
import { ProjectConfiguration } from '../services';
import { Tree } from '../tools/forest';
import { Named } from '../tools/named';
import { ObserverUtil } from '../tools/observer-util';
import { ConstraintIndex } from './constraint-index';
import { FulltextIndex } from './fulltext-index';
import { getFieldsToIndex } from './get-fields-to-index';
import { getSortedIds } from './get-sorted-ids';
import { IndexItem, TypeResourceIndexItem } from './index-item';
import { performQuery } from './perform-query';
import { Relation } from '../model';


const CONFIGURATION = 'Configuration';
const INSTANCES = 'instances';
const INSTANCE_OF = 'isInstanceOf';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class IndexFacade {

    private observers: Array<Observer<Document>> = [];
    private indexItems: { [resourceId: string]: IndexItem } = {};


    constructor(private constraintIndex: ConstraintIndex,
                private fulltextIndex: FulltextIndex,
                private projectConfiguration: ProjectConfiguration,
                private showWarnings: boolean) {}


    public changesNotifications = (): Observable<Document|undefined> => ObserverUtil.register(this.observers);


    public find(query: Query): Array<string /*resourceId*/> {

        const queryResult: Array<Resource.Id> = performQuery(query, this.constraintIndex, this.fulltextIndex);
        return this.getSortedResult(query, queryResult);
    }


    /**
     * @param document document.resource.identifier needs to be present, otherwise document does not get indexed
     */
    public put(document: Document) {

        this._put(document, false, true);
    }


    /**
     * This does not notify observers of IndexFacade notifications. notifyObservers has to be called after all changes
     * to the index have been completed.
     */
    public putToSingleIndex(document: Document, constraintIndexName: string) {

        IndexFacade.setChildOfRelation(document);
        ConstraintIndex.put(this.constraintIndex, document, false, constraintIndexName);
        IndexFacade.removeChildOfRelation(document);
    }


    public async putMultiple(documents: Array<Document>, setProgress?: (count: number) => Promise<void>) {

        const [typeDocuments, nonTypeDocuments] = separate(
            on(
                ['resource', 'category'], 
                includedIn(this.projectConfiguration.getTypeCategories().map(to(Named.NAME)))
            ),
            documents
        );

        let count: number = 0;

        for (let document of typeDocuments) {
            this._put(document, true, false);
            count++;
            if (setProgress && (count % 250 === 0 || count === documents.length)) {
                await setProgress(count * 0.75);
            }
        }
        for (let document of nonTypeDocuments) {
            this._put(document, true, false);
            count++;
            if (setProgress && (count % 250 === 0 || count === documents.length)) {
                await setProgress(count * 0.75);
            }
        }

        ObserverUtil.notify(this.observers, undefined);
    }


    public remove(document: Document) {

        ConstraintIndex.remove(this.constraintIndex, document);
        FulltextIndex.remove(this.fulltextIndex, document);
        delete this.indexItems[document.resource.id];
        if (!this.projectConfiguration.getTypeCategories().map(to(Named.NAME)).includes(document.resource.category)) {
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


    public addConstraintIndexDefinitionsForField(field: Field) {

        ConstraintIndex.addIndexDefinitionsForField(this.constraintIndex, field);
    }


    public notifyObservers() {

        ObserverUtil.notify(this.observers, undefined);
    }


    private getSortedResult(query: Query, queryResult: Array<Resource.Id>): Array<Resource.Id> {

        if (query.sort && query.sort.mode === 'none') {
            return queryResult;
        } else {
            const indexItems = queryResult.map(lookup(this.indexItems));
            return getSortedIds(indexItems, query, this.projectConfiguration.getTypeCategories().map(to(Named.NAME)));
        }
    }


    private _put(document: Document, skipRemoval: boolean, notify: boolean) {

        IndexFacade.setChildOfRelation(document);

        const item = this.getIndexItem(document);
        if (!item || document.resource.category === CONFIGURATION) return;

        item.identifier = document.resource.identifier;

        if (this.projectConfiguration.getTypeCategories().map(to(Named.NAME)).includes(document.resource.category)) {
            IndexFacade.updateTypeItem(item as TypeResourceIndexItem);
        } else {
            if (!skipRemoval) {
                IndexFacade.deleteAssociatedTypeItem(this.indexItems, document);
            }
            IndexFacade.createAssociatedTypeItem(this.indexItems, document);
        }

        ConstraintIndex.put(this.constraintIndex, document, skipRemoval);
        FulltextIndex.put(
            this.fulltextIndex, document,
            getFieldsToIndex(
                Named.arrayToMap(Tree.flatten(this.projectConfiguration.getCategories())),
                document.resource.category
            ),
            skipRemoval
        );

        IndexFacade.removeChildOfRelation(document);

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
            })
        );
    }


    private static updateTypeItem(item: TypeResourceIndexItem) {

        if (!item.instances) { // keep existing instances on update
            item.instances = {};
        }
    }


    private static setChildOfRelation(document: Document) {

        if (Resource.hasRelations(document.resource, Relation.Hierarchy.LIESWITHIN)) {
            document.resource.relations['isChildOf'] = [document.resource.relations.liesWithin[0]];
        } else if (Resource.hasRelations(document.resource, Relation.Hierarchy.RECORDEDIN)) {
            document.resource.relations['isChildOf'] = [document.resource.relations.isRecordedIn[0]];
        }
    }


    private static removeChildOfRelation(document: Document) {

        delete document.resource.relations['isChildOf'];
    }
}
