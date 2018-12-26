import {Injectable} from '@angular/core';
import {Observer} from 'rxjs';
import {Observable} from 'rxjs';
import {Document} from 'idai-components-2';
import {Constraint, Query} from 'idai-components-2';
import {ConstraintIndexer} from './constraint-indexer';
import {FulltextIndex, FulltextIndexer} from './fulltext-indexer';
import {ResultSets} from './result-sets';
import {IndexItem} from './index-item';
import {ObserverUtil} from '../../util/observer-util';
import {ProjectConfiguration} from 'idai-components-2';


@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class IndexFacade {

    private observers: Array<Observer<Document>> = [];

    constructor(
        private constraintIndexer: ConstraintIndexer,
        private fulltextIndex: FulltextIndex,
        private projectConfiguration: ProjectConfiguration
    ) {}


    public changesNotifications = (): Observable<Document> => ObserverUtil.register(this.observers);


    public perform(query: Query): any {

        let resultSets = query.constraints ?
            this.performConstraints(query.constraints) :
            ResultSets.make();

        resultSets = ResultSets.containsOnlyEmptyAddSets(resultSets)
                || (Query.isEmpty(query) && !ResultSets.isEmpty(resultSets))
            ? resultSets
            : this.performFulltext(query, resultSets);

        return IndexItem.generateOrderedResultList(ResultSets.collapse(resultSets));
    }


    public put(document: Document, skipRemoval: boolean = false, notify: boolean = true) {

        this.constraintIndexer.put(document, skipRemoval);
        FulltextIndexer.put(this.fulltextIndex, document,
            this.projectConfiguration.getTypesMap(), skipRemoval);

        if (notify) ObserverUtil.notify(this.observers, document);
    }


    public remove(document: Document) {

        this.constraintIndexer.remove(document);
        FulltextIndexer.remove(this.fulltextIndex, document);

        ObserverUtil.notify(this.observers, document);
    }


    public clear() {

        this.constraintIndexer.clear();
        FulltextIndexer.clear(this.fulltextIndex);
    }


    private performFulltext(query: Query, resultSets: ResultSets): ResultSets {

        const q = !query.q || query.q.trim() === '' ? '*' : query.q;
        ResultSets.combine(resultSets, FulltextIndexer.get(this.fulltextIndex, q, query.types));

        return resultSets;
    }


    private performConstraints(constraints: { [name: string]: Constraint|string|string[] }): ResultSets {

        return Object.keys(constraints)
            .reduce((resultSets: ResultSets, name: string) => {
                const {type, value} = Constraint.convertTo(constraints[name]);
                ResultSets.combine(resultSets, this.constraintIndexer.get(name, value), type);
                return resultSets;
            }, ResultSets.make());
    }
}