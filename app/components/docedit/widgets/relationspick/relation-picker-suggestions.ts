import {Document, ReadDatastore, Query, Constraint, RelationDefinition} from 'idai-components-2';


/**
 * @author Thomas Kleinke
 */
export module RelationPickerSuggestions {

    export const MAX_SUGGESTIONS: number = 5;


    export async function getSuggestions(datastore: ReadDatastore, document: Document,
                                         relationDefinition: RelationDefinition,
                                         idSearchString?: string): Promise<Array<Document>> {

        return (await datastore.find(
            makeQuery(document, relationDefinition, idSearchString)
        )).documents;
    }


    function makeQuery(document: Document, relationDefinition: RelationDefinition,
                       idSearchString?: string): Query {

        return {
            q: idSearchString ? idSearchString : '',
            types: relationDefinition.range,
            constraints: makeConstraints(document, relationDefinition),
            limit: MAX_SUGGESTIONS
        };
    }


    function makeConstraints(document: Document,
                             relationDefinition: RelationDefinition): { [constraintName: string]: Constraint } {

        const constraints = {
            'id:match': {
                value: getForbiddenIds(document, relationDefinition),
                type: 'subtract'
            }
        };

        if (relationDefinition.sameMainTypeResource
                && Document.hasRelations(document, 'isRecordedIn')) {
            (constraints as any)['isRecordedIn:contain'] = document.resource.relations['isRecordedIn'][0];
        }

        return constraints;
    }


    /**
     * Get ids of resources not suitable for suggestions:
     *      - The resource itself
     *      - Resources which are already targets of the relation
     *      - Resources which are targets of the inverse relation
     */
    function getForbiddenIds(document: Document, relationDefinition: RelationDefinition): string[] {

        let ids: string[] = [document.resource.id]
            .concat(document.resource.relations[relationDefinition.name])
            .filter((id: string) => id.length > 0);

        if (relationDefinition.inverse && relationDefinition.name !== relationDefinition.inverse
                && Document.hasRelations(document, relationDefinition.inverse)) {
            ids = ids.concat(document.resource.relations[relationDefinition.inverse])
        }

        return ids;
    }
}