export interface Reference {
    predicate: Predicate;
    uri: string;
}


export type Predicate = 'skos:exactMatch'
    |'skos:closeMatch'
    |'skos:broadMatch'
    |'skos:narrowMatch'
    |'skos:relatedMatch'
    |'idw:unknownMatch';


export module Predicate {

    export const ALL: Array<Predicate> = [
        'skos:exactMatch', 'skos:closeMatch', 'skos:broadMatch', 'skos:narrowMatch', 'skos:relatedMatch',
        'idw:unknownMatch'
    ];
}


