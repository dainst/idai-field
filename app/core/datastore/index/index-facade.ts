import {Injectable} from '@angular/core';
import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';
import {Document} from 'idai-components-2';
import {Constraint, Query} from 'idai-components-2';
import {ConstraintIndexer} from './constraint-indexer';
import {FulltextIndexer} from './fulltext-indexer';
import {ResultSets} from './result-sets';
import {IndexItem} from './index-item';
import {ObserverUtil} from '../../../util/observer-util';


@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class IndexFacade {

    private observers: Array<Observer<Document>> = [];

    constructor(
        private constraintIndexer: ConstraintIndexer,
        private fulltextIndexer: FulltextIndexer
    ) {}


    public changesNotifications = (): Observable<Document> => ObserverUtil.register(this.observers);


    public perform(query: Query): any {

        let resultSets = query.constraints ?
            this.performConstraints(query.constraints) :
            ResultSets.make();

        resultSets = (Query.isEmpty(query) && !resultSets.isEmpty()
            ? resultSets
            : this.performFulltext(query, resultSets));

        return IndexItem.generateOrderedResultList(resultSets.collapse());
    }


    public put(document: Document, skipRemoval: boolean = false, notify: boolean = true) {

        this.constraintIndexer.put(document, skipRemoval);
        this.fulltextIndexer.put(document, skipRemoval);

        if (notify) ObserverUtil.notify(this.observers, document);
    }


    public remove(document: Document) {

        this.constraintIndexer.remove(document);
        this.fulltextIndexer.remove(document);

        ObserverUtil.notify(this.observers, document);
    }


    public clear() {

        this.constraintIndexer.clear();
        this.fulltextIndexer.clear();
    }


    private performFulltext(query: Query, resultSets: ResultSets): ResultSets {

        const q = !query.q || query.q.trim() == '' ? '*' : query.q;
        return resultSets.combine(this.fulltextIndexer.get(q, query.types));
    }


    private performConstraints(constraints: { [name: string]: Constraint|string|string[] }): ResultSets {

        return Object.keys(constraints)
            .reduce((resultSets: ResultSets, name: string) => {

                const {type, value} = Constraint.convertTo(constraints[name]);
                return resultSets.combine(this.constraintIndexer.get(name, value), type)

            }, ResultSets.make());
    }
}