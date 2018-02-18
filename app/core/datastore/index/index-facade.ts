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

        if (!query) return [];

        const resultSets = query.constraints ?
            this.performThem(query.constraints) :
            ResultSets.make();

        return IndexItem.generateOrderedResultList(
            (Query.isEmpty(query) && !resultSets.isEmpty() ?
                resultSets :
                this.performFulltext(query, resultSets))
                .collapse() as Array<IndexItem>);
    }


    public put(document: Document) {

        this.constraintIndexer.put(document);
        this.fulltextIndexer.put(document);
        return document;
    }


    public remove(document: Document) {

        this.constraintIndexer.remove(document);
        this.fulltextIndexer.remove(document);
    }


    private performFulltext(query: Query, resultSets: ResultSets): ResultSets {

        return resultSets.combine(
            this.fulltextIndexer.get(
                !query.q || query.q.trim() == '' ? '*' : query.q,
                query.types));
    }


    /**
     * @param constraints
     * @returns {any} undefined if there is no usable constraint
     */
    private performThem(constraints: { [name: string]: Constraint|string }): ResultSets {

        return Object.keys(constraints).reduce((setsAcc: ResultSets, name: string) => {

            const {type, value} = Constraint.convertTo(constraints[name]);

            const indexItems = this.constraintIndexer.get(name, value);
            return indexItems
                ? setsAcc.combine(indexItems, type)
                : setsAcc;

        }, ResultSets.make());
    }
}