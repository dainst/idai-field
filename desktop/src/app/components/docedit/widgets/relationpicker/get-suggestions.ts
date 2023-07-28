import { Constraint, Query, Datastore, Relation, Constraints, CHILDOF_CONTAIN, Document,
    Resource } from 'idai-field-core';


/**
 * @author Thomas Kleinke
 */
export async function getSuggestions(datastore: Datastore, resource: Resource,
                                     relationDefinition: Relation): Promise<Array<Document>> {

    return (await datastore.find(
        makeQuery(resource, relationDefinition)
    )).documents;
}


function makeQuery(resource: Resource, relationDefinition: Relation): Query {

    return {
        q: '',
        categories: relationDefinition.range,
        constraints: makeConstraints(resource, relationDefinition)
    };
}


function makeConstraints(resource: Resource,
                         relationDefinition: Relation): { [constraintName: string]: Constraint } {

    const constraints: { [constraintName: string]: Constraint } = {
        'id:match': {
            value: getForbiddenIds(resource, relationDefinition),
            subtract: true
        }
    };

    if (relationDefinition.sameMainCategoryResource
            && Resource.hasRelations(resource, 'isRecordedIn')) {
        (constraints as Constraints)[CHILDOF_CONTAIN] =
            { value: resource.relations['isRecordedIn'][0], searchRecursively: true };
    }

    return constraints;
}


/**
 * Get ids of resources not suitable for suggestions:
 *      - The resource itself
 *      - Resources which are already targets of the relation
 *      - Resources which are targets of the inverse relation
 */
function getForbiddenIds(resource: Resource, relationDefinition: Relation): string[] {

    let ids: string[] = [resource.id]
        .concat(resource.relations[relationDefinition.name])
        .filter((id: string) => id && id.length > 0);

    if (relationDefinition.inverse && relationDefinition.name !== relationDefinition.inverse
            && Resource.hasRelations(resource, relationDefinition.inverse)) {
        ids = ids.concat(resource.relations[relationDefinition.inverse])
    }

    return ids;
}
