import { flatten, intersection, set, to } from 'tsfun';
import { Document, ProjectConfiguration, RelationsManager,
    FieldDocument, IndexFacade, Constraint, CategoryForm, Relation, Named, Datastore } from 'idai-field-core';
import { M } from '../messages/m';


/**
 * @author Thomas Kleinke
 */
export module MoveUtility {

    export async function moveDocument(document: FieldDocument, newParent: FieldDocument,
                                       relationsManager: RelationsManager,
                                       isRecordedInTargetCategories: Array<CategoryForm>,
                                       projectConfiguration: ProjectConfiguration,
                                       datastore: Datastore) {

        if (!(await checkForSameOperationRelations(document, newParent, projectConfiguration))) {
            throw [M.RESOURCES_ERROR_CANNOT_MOVE_WITH_SAME_OPERATION_RELATIONS, document.resource.identifier];
        }

        if (!(await checkChildren(document, newParent, projectConfiguration, datastore))) {
            throw [M.RESOURCES_ERROR_CANNOT_MOVE_CHILDREN, document.resource.identifier];
        }

        const oldVersion = Document.clone(document);
        updateRelations(document, newParent, isRecordedInTargetCategories);
        await relationsManager.update(document, oldVersion);
    }


    export async function createConstraints(documents: Array<FieldDocument>, indexFacade: IndexFacade)
            : Promise<{ [name: string]: Constraint }> {

        return {
            'id:match': {
                value: set(flatten(documents.map(document => getResourceIdsToSubtract(document, indexFacade)))),
                subtract: true
            }
        };
    }


    export function getAllowedTargetCategories(documents: Array<FieldDocument>,
                                               projectConfiguration: ProjectConfiguration): Array<CategoryForm> {

        const result = set(getIsRecordedInTargetCategories(documents, projectConfiguration)
            .concat(getLiesWithinTargetCategories(documents, projectConfiguration)));

        return (isProjectOptionAllowed(documents, projectConfiguration))
            ? [projectConfiguration.getCategory('Project')]
                .concat(result)
            : result;
    }



    export function isProjectOptionAllowed(documents: Array<FieldDocument>, projectConfiguration: ProjectConfiguration): boolean {

        return documents.filter(document => {
            return !projectConfiguration.getConcreteOverviewCategories()
                    .map(to(Named.NAME))
                    .includes(document.resource.category)
                || !Document.hasRelations(document, Relation.Hierarchy.LIESWITHIN);
        }).length === 0;
    }


    export function getIsRecordedInTargetCategories(documents: Array<FieldDocument>,
                                                    projectConfiguration: ProjectConfiguration): Array<CategoryForm> {

        return intersection(
            documents.map(document => {
                const category: CategoryForm = projectConfiguration.getCategory(document.resource.category);
                return category.mustLieWithin
                    ? []
                    : projectConfiguration.getAllowedRelationRangeCategories(
                        'isRecordedIn', document.resource.category
                    );
            }
        ));
    }


    function updateRelations(document: FieldDocument, newParent: FieldDocument,
                             isRecordedInTargetCategories: Array<CategoryForm>) {

        if (newParent.resource.category === 'Project') {
            document.resource.relations['isRecordedIn'] = [];
            document.resource.relations['liesWithin'] = [];
        } else if (isRecordedInTargetCategories.map(category => category.name)
            .includes(newParent.resource.category)) {
            document.resource.relations['isRecordedIn'] = [newParent.resource.id];
            document.resource.relations['liesWithin'] = [];
        } else {
            document.resource.relations['liesWithin'] = [newParent.resource.id];
            document.resource.relations['isRecordedIn'] = newParent.resource.relations['isRecordedIn'];
        }
    }


    function getResourceIdsToSubtract(document: FieldDocument, indexFacade: IndexFacade): string[] {

        const ids = [document.resource.id];

        const parentId: string|undefined = getParentId(document);
        if (parentId) ids.push(parentId);

        return ids.concat(indexFacade.getDescendantIds(
            'isChildOf:contain', document.resource.id
        ));
    }


    function getParentId(document: FieldDocument): string|undefined {

        return Document.hasRelations(document, 'liesWithin')
            ? document.resource.relations['liesWithin'][0]
            : Document.hasRelations(document, 'isRecordedIn')
                ? document.resource.relations.isRecordedIn[0]
                : undefined;
    }


    function getLiesWithinTargetCategories(documents: Array<FieldDocument>,
                                           projectConfiguration: ProjectConfiguration): Array<CategoryForm> {

        return intersection(
            documents.map(document => projectConfiguration.getAllowedRelationRangeCategories(
                'liesWithin', document.resource.category
            ))
        );
    }


    async function checkForSameOperationRelations(document: FieldDocument, newParent: FieldDocument,
                                                  projectConfiguration: ProjectConfiguration): Promise<boolean> {

        const currentOperationId: string|undefined = document.resource.relations?.[Relation.Hierarchy.RECORDEDIN]?.[0];

        if (newParent.resource.relations?.[Relation.Hierarchy.RECORDEDIN]?.[0] === currentOperationId
               || newParent.resource.id === currentOperationId) {
            return true;
        }

        const relations: Array<Relation> =
            projectConfiguration.getRelationsForDomainCategory(document.resource.category);

        const targetIds: string[] = flatten(
            Object.keys(document.resource.relations)
                .filter(relationName => {
                    return !Relation.Hierarchy.ALL.includes(relationName) 
                        && relations.find(relation => relation.name === relationName)?.sameMainCategoryResource;
                }).map(relationName => document.resource.relations[relationName])
        );

        return targetIds.length === 0;
    }


    async function checkChildren(document: FieldDocument, newParent: FieldDocument,
                                 projectConfiguration: ProjectConfiguration,
                                 datastore: Datastore,): Promise<boolean> {

        if (projectConfiguration.getConcreteOverviewCategories()
                .map(to(Named.NAME))
                .includes(document.resource.category)) {
            return true;
        }

        const newIsRecordedInTarget: Document = await datastore.get(
            newParent.resource.relations.isRecordedIn?.[0] ?? newParent.resource.id
        );

        const children: Array<Document> = (await datastore.find({
            constraints: { 'isChildOf:contain': { value: document.resource.id, searchRecursively: true } }
        })).documents;

        return children.filter(child => {
            return !projectConfiguration.isAllowedRelationDomainCategory(
                child.resource.category,
                newIsRecordedInTarget.resource.category,
                Relation.Hierarchy.RECORDEDIN
            );
        }).length === 0;
    }
}
