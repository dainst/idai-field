import {Document, Query, ReadDatastore, RelationDefinition, Resource} from 'idai-components-2';
import {filter, flow, isNot, on, take} from 'tsfun';

/**
 *  @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module Suggestions {

    export function makeSuggestionsFrom(documents: Document[],
                                        resource: any,
                                        relationDefinition: any,
                                        maxSuggestions: number) {

        return flow<any>(documents,
            filter(isNot(on('resource.id:')(resource.id))), // Don't suggest the resource itself
            filter(isNot(alreadyIncluded(resource, relationDefinition))),
            filter(isNot(includedInTargetRelationList(resource, relationDefinition))),
            filter(rightRelationType(relationDefinition)),
            filter(isValidSuggestion(resource, relationDefinition)),
            take(maxSuggestions));
    }


    // If a resource that is already included as a target in the relation list
    function alreadyIncluded(resource: Resource, relDef: RelationDefinition) {

        return (suggestionDocument: Document) => resource.relations[relDef.name]
            .includes(suggestionDocument.resource.id as any);
    }


    // If a resource is already included as a target in the inverse relation list
    function includedInTargetRelationList(resource: Resource, relDef: RelationDefinition) {

        return (suggestionDocument: Document) =>
            (resource.relations[relDef.inverse]
                && resource.relations[relDef.inverse]
                    .includes(suggestionDocument.resource.id))
    }


    // If a resource's type is a part of the relation's range
    function rightRelationType(relDef: RelationDefinition) {

        return (suggestionDocument: Document) =>
            relDef.range.includes(suggestionDocument.resource.type);
    }


    // Don't suggest a resource which is linked to a different main type resource if the relation property
    // sameMainTypeResource' is set to true
    function isValidSuggestion(resource: Resource, relDef: RelationDefinition) {

        return (suggestionDocument: Document) =>
            !relDef.sameMainTypeResource ||
                isSameMainTypeResource(
                    resource, suggestionDocument.resource);

    }


    function isSameMainTypeResource(
        resource1: Resource,
        resource2: Resource) {

        const relations1 = resource1.relations['isRecordedIn'];
        const relations2 = resource2.relations['isRecordedIn'];

        if (!relations1 || relations1.length == 0 ||
            !relations2 || relations2.length == 0) return false;

        return relations1[0] == relations2[0];
    }
}