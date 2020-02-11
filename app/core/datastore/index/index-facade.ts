import {Observable, Observer} from 'rxjs';
import {separate, on, is, keys} from 'tsfun';
import {Constraint, Document, Query} from 'idai-components-2';
import {ConstraintIndex} from './constraint-index';
import {FulltextIndex} from './fulltext-index';
import {ResultSets} from './result-sets';
import {IndexItem, TypeResourceIndexItem} from './index-item';
import {ObserverUtil} from '../../util/observer-util';
import {IdaiType} from '../../configuration/model/idai-type';

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


    /**
     * Runtime info: Skips the fulltime query if query is empty and constraint search delivered results
     *
     * @param query
     */
    public perform(query: Query): Array<IndexItem> {

        let resultSets = query.constraints ?
            IndexFacade.performConstraints(this.constraintIndex, query.constraints) :
            ResultSets.make();

        resultSets = ResultSets.containsOnlyEmptyAddSets(resultSets)
                || (Query.isEmpty(query) && !ResultSets.isEmpty(resultSets))
            ? resultSets
            : IndexFacade.performFulltext(this.fulltextIndex, query, resultSets);

        return ResultSets.collapse(resultSets);
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


    private updateTypeItemIfNecessary(document: Document) {

        if (!document.resource.relations[INSTANCE_OF]) return;

        for (let target of document.resource.relations[INSTANCE_OF]) {
            const typeItem = this.indexItems[target] as TypeResourceIndexItem;
            if (typeItem) {
                if (!typeItem.instances) typeItem.instances = {}; // TODO remove these relations on remove
                typeItem.instances[target] = document.resource.type;
            }
        }
    }


    private _put(document: Document,
                 skipRemoval: boolean,
                 notify: boolean) {

        this.updateTypeItemIfNecessary(document);

        // TODO review: if we update a type document, we should not create an entirely new index item, but instead merge it with an existing one

        const indexItem = IndexItem.from(document, this.showWarnings);
        if (indexItem) {
            this.indexItems[document.resource.id] = indexItem;
            ConstraintIndex.put(this.constraintIndex, document, indexItem, skipRemoval);
            FulltextIndex.put(this.fulltextIndex, document, indexItem, this.typesMap, skipRemoval);
        }

        if (notify) ObserverUtil.notify(this.observers, document);
    }


    private static performFulltext(fulltextIndex: FulltextIndex,
                                   query: Query,
                                   resultSets: ResultSets): ResultSets {

        const q = !query.q || query.q.trim() === '' ? '*' : query.q;
        ResultSets.combine(resultSets, FulltextIndex.get(fulltextIndex, q, query.types));

        return resultSets;
    }


    private static performConstraints(constraintIndex: ConstraintIndex,
                                      constraints: { [name: string]: Constraint|string|string[] })
        : ResultSets {

        return keys(constraints)
            .reduce((resultSets, name: string) => {
                const { type, value } = Constraint.convertTo(constraints[name]);
                ResultSets.combine(resultSets, ConstraintIndex.get(constraintIndex, name, value), type);
                return resultSets;
            }, ResultSets.make());
    }
}