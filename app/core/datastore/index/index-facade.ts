import {Injectable} from '@angular/core';
import {ConstraintIndexer} from './constraint-indexer';
import {FulltextIndexer} from './fulltext-indexer';
import {Constraint, Query} from 'idai-components-2/datastore';
import {ResultSets} from './result-sets';
import {IndexItem} from './index-item';
import {Document} from 'idai-components-2/core';


@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class IndexFacade {

    constructor(
        private constraintIndexer: ConstraintIndexer,
        private fulltextIndexer: FulltextIndexer
    ) {}


    public perform(query: Query): any {

        let resultSets = query.constraints ?
            this.performConstraints(query.constraints) :
            ResultSets.make();

        resultSets = (Query.isEmpty(query) && !resultSets.isEmpty()
            ? resultSets
            : this.performFulltext(query, resultSets));

        return IndexItem.generateOrderedResultList(resultSets.collapse());
    }


    public put(document: Document) {

        this.constraintIndexer.put(document);
        this.fulltextIndexer.put(document);
    }


    public remove(document: Document) {

        this.constraintIndexer.remove(document);
        this.fulltextIndexer.remove(document);
    }


    private performFulltext(query: Query, resultSets: ResultSets): ResultSets {

        const indexItems = this.fulltextIndexer.get(
            !query.q || query.q.trim() == '' ? '*' : query.q,
            query.types);

        return resultSets.combine(indexItems);
    }


    private performConstraints(constraints: { [name: string]: Constraint|string }): ResultSets {

        return Object.keys(constraints)
            .reduce((resultSets: ResultSets, name: string) => {

                const {type, value} = Constraint.convertTo(constraints[name]);
                return resultSets.combine(this.constraintIndexer.get(name, value), type)

            }, ResultSets.make());
    }
}