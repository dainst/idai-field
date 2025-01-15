import { intersection, set, to, isDefined } from 'tsfun';
import { Document, ProjectConfiguration, RelationsManager,
    FieldDocument, IndexFacade, Constraint, CategoryForm, Relation, Named, Datastore } from 'idai-field-core';
import { M } from '../../messages/m';
import { UtilTranslations } from '../../../util/util-translations';


/**
 * @author Thomas Kleinke
 */
export module MoveUtility {

    export async function moveDocument(document: FieldDocument, newParent: FieldDocument,
                                       relationsManager: RelationsManager,
                                       isRecordedInTargetCategories: Array<CategoryForm>,
                                       projectConfiguration: ProjectConfiguration,
                                       datastore: Datastore) {

        if (getParentId(document) === newParent.resource.id) return;

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
                value: getResourceIdsToSubtract(documents, indexFacade),
                subtract: true
            }
        };
    }


    export function getAllowedTargetCategories(documents: Array<FieldDocument>,
                                               projectConfiguration: ProjectConfiguration,
                                               utilTranslations: UtilTranslations): Array<CategoryForm> {

        const defaultCategories: Array<CategoryForm> = [];
        if (isProjectOptionAllowed(documents, projectConfiguration)) {
            defaultCategories.push(projectConfiguration.getCategory('Project'));
        }
        if (isInventoryRegisterOptionAllowed(documents, projectConfiguration)) {
            defaultCategories.push({
                name: 'InventoryRegister', label: utilTranslations.getTranslation('inventoryRegister'), children: []
            } as any);
        }

        const result: Array<CategoryForm> = set(getIsRecordedInTargetCategories(documents, projectConfiguration)
            .concat(getLiesWithinTargetCategories(documents, projectConfiguration)));

        return defaultCategories.concat(result);
    }


    export function isProjectOptionAllowed(documents: Array<FieldDocument>, projectConfiguration: ProjectConfiguration): boolean {

        return documents.filter(document => {
            return !projectConfiguration.getConcreteOverviewCategories()
                    .map(to(Named.NAME))
                    .includes(document.resource.category)
                || !Document.hasRelations(document, Relation.Hierarchy.LIESWITHIN);
        }).length === 0;
    }


    export function isInventoryRegisterOptionAllowed(documents: Array<FieldDocument>, projectConfiguration: ProjectConfiguration): boolean {

        return documents.filter(document => {
            return !projectConfiguration.getInventoryCategories()
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

        if (newParent.resource.category === 'Project' || newParent.resource.category === 'InventoryRegister') {
            document.resource.relations['isRecordedIn'] = [];
            document.resource.relations['liesWithin'] = [];
        } else if (isRecordedInTargetCategories.map(to(Named.NAME)).includes(newParent.resource.category)) {
            document.resource.relations['isRecordedIn'] = [newParent.resource.id];
            document.resource.relations['liesWithin'] = [];
        } else {
            document.resource.relations['liesWithin'] = [newParent.resource.id];
            document.resource.relations['isRecordedIn'] = newParent.resource.relations['isRecordedIn'];
        }
    }


    function getResourceIdsToSubtract(documents: Array<FieldDocument>, indexFacade: IndexFacade): string[] {

        let ids: string[] = documents.map(document => document.resource.id);

        const parentIds: string[] = documents.map(document => getParentId(document))
            .filter(isDefined);
        if (parentIds.length === 1 || (parentIds.length > 1 && parentIds.every(id => id === parentIds[0]))) {
            ids.push(parentIds[0]);
        }

        documents.forEach(document => {
            ids = ids.concat(indexFacade.getDescendantIds(
                'isChildOf:contain', document.resource.id
            ));
        });
        
        return set(ids);
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


    async function checkChildren(document: FieldDocument, newParent: FieldDocument,
                                 projectConfiguration: ProjectConfiguration,
                                 datastore: Datastore,): Promise<boolean> {

        if (projectConfiguration.getConcreteOverviewCategories()
                .concat(projectConfiguration.getTypeManagementCategories())
                .concat(projectConfiguration.getInventoryCategories())
                .map(to(Named.NAME))
                .includes(document.resource.category)) {
            return true;
        }

        const newIsRecordedInTarget: Document = await datastore.get(
            newParent.resource.relations.isRecordedIn?.[0] ?? newParent.resource.id
        );

        const children: Array<Document> = (await datastore.find({
            constraints: { 'isChildOf:contain': { value: document.resource.id, searchRecursively: true } }
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
