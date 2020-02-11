import {Observable, Observer} from 'rxjs';
import {is, on, separate} from 'tsfun';
import {Document, Query} from 'idai-components-2';
import {ConstraintIndex} from './constraint-index';
import {FulltextIndex} from './fulltext-index';
import {IndexItem, TypeResourceIndexItem} from './index-item';
import {ObserverUtil} from '../../util/observer-util';
import {IdaiType} from '../../configuration/model/idai-type';
import {performQuery} from './perform-query';

const INSTANCE_OF = 'isInstanceOf';

/**
 * @author Daniel de Oliveira
 */
export class IndexFacade {

    private observers: Array<Observer<Document>> = [];

    private indexItems: { [resourceId: string]: IndexItem } = {};

    constructor(
        private constraintIndex: ConstraintIndex,
        private fulltextIndex: FulltextIndex,
        private typesMap: { [typeName: string]: IdaiType },
        private showWarnings: boolean
    ) {}


    public changesNotifications = (): Observable<Document> => ObserverUtil.register(this.observers);


    public find(query: Query): Array<IndexItem> {

        return performQuery(query, this.constraintIndex, this.fulltextIndex);
    }


    public put(document: Document) {

        return this._put(document, false, true);
    }


    public putMultiple(documents: Array<Document>) {

        const [typeDocuments, nonTypeDocuments]
            = separate(on('resource.type', is('Type')))(documents);

        typeDocuments.forEach(_ => this._put(_, true, false));
        nonTypeDocuments.forEach(_ => this._put(_, true, false));
    }


    public remove(document: Document) {

        ConstraintIndex.remove(this.constraintIndex, document);
        FulltextIndex.remove(this.fulltextIndex, document);
        delete this.indexItems[document.resource.id]; // TODO test

        ObserverUtil.notify(this.observers, document);
    }


    public clear() {

        ConstraintIndex.clear(this.constraintIndex);
        FulltextIndex.clear(this.fulltextIndex);
        // TODO clear index items
    }


    public getCount(constraintIndexName: string, matchTerm: string): number {

        return ConstraintIndex.getCount(this.constraintIndex, constraintIndexName, matchTerm);
    }


    public getDescendantIds(constraintIndexName: string, matchTerm: string): string[] {

        return ConstraintIndex.getDescendantIds(this.constraintIndex, constraintIndexName, matchTerm);
    }


    private _put(document: Document,
                 skipRemoval: boolean,
                 notify: boolean) {

        const item = this.getIndexItem(document);
        if (!item) return;

        if (document.resource.type === 'Type') {
            IndexFacade.updateTypeItem(item as TypeResourceIndexItem);
        } else {
            IndexFacade.updateAssociatedTypeItem(document, this.indexItems);
        }

        ConstraintIndex.put(this.constraintIndex, document, item, skipRemoval);
        FulltextIndex.put(this.fulltextIndex, document, item, this.typesMap, skipRemoval);

        if (notify) ObserverUtil.notify(this.observers, document);
    }


    private static updateAssociatedTypeItem(document: Document, items: { [resourceId: string]: IndexItem }) {

        if (!document.resource.relations[INSTANCE_OF]) return;

        for (let target of document.resource.relations[INSTANCE_OF]) {
            const typeItem = items[target] as TypeResourceIndexItem;
            if (typeItem) typeItem.instances[target] = document.resource.type; // TODO remove these relations on remove
        }
    }


    private getIndexItem(document: Document) {

        const existingItem = this.indexItems[document.resource.id];
        const indexItem = existingItem !== undefined
            ? existingItem
            : IndexItem.from(document, this.showWarnings);
        if (!existingItem && indexItem) this.indexItems[document.resource.id] = indexItem;
        return indexItem;
    }


    private static updateTypeItem(item: TypeResourceIndexItem) {

        if (!item.instances) item.instances = {};
    }
}