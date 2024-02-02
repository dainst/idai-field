import { aFlow, aMap, includedIn, isNot, map, on, pairWith, to, val } from 'tsfun';
import { CategoryForm, Document, FieldDocument, Name, Named, Query, Resource, Constraints } from 'idai-field-core';
import { CategoryCount, Find, GetIdentifierForId, PerformExport } from './export-helper';

const IS_CHILD_OF_CONTAIN = 'isChildOf:contain';

/**
 * Fetches documents, rewrites identifiers in relations, triggering the export of the transformed docs.
 *
 * Currently this gets used only by CSV export, though in principle it serves every export
 * with the abovementioned requirements, especially the second.
 *
 * @author Daniel de Oliveira
 */
export module ExportRunner {

    const PROJECT_CONTEXT = 'project';

    export const EXCLUDED_CATEGORIES = ['Operation'];


    /**
     * 'project', if the whole project is the context
     * undefined, if only the schema is to be exported
     * a resource id of a place or an operation, otherwise
     */
    export type ExportContext = undefined | 'project' | Resource.Id;


    export async function performExport(find: Find,
                                        getIdentifierForId: GetIdentifierForId,
                                        context: ExportContext,
                                        selectedCategory: CategoryForm,
                                        relations: string[],
                                        performExport: PerformExport) {

        const documents = [];
        if (context !== undefined) {
            documents.push(...(await fetchDocuments(find, context, selectedCategory)));
        }

        return await aFlow(
                documents,
                aMap(rewriteIdentifiers(getIdentifierForId)),
                map(to(Document.RESOURCE)),
                performExport(selectedCategory, relations));
    }


    export function getCategoriesWithoutExcludedCategories(categories: Array<CategoryForm>, exclusion: string[]) {

        return categories.filter(on(Named.NAME, isNot(includedIn(exclusion))))
    }


    export async function determineCategoryCounts(find: Find,
                                                  context: ExportContext,
                                                  categoriesList: Array<CategoryForm>): Promise<Array<CategoryCount>> {

        if (!context) return determineCategoryCountsForSchema(categoriesList);

        return (await determineCategoryCountsForSelectedOperation(
            find, context, categoriesList
        )).filter(([_category, count]) => count > 0);
    }


    async function determineCategoryCountsForSelectedOperation(find: Find,
                                                               selectedOperationId: string|undefined,
                                                               categoriesList: Array<CategoryForm>): Promise<Array<CategoryCount>> {

        const categories = getCategoriesWithoutExcludedCategories(categoriesList, EXCLUDED_CATEGORIES);

        const counts: Array<CategoryCount> = [];
        for (let category of categories) {
            const query = getQuery(category.name, selectedOperationId, 0);
            counts.push([
                category,
                (await find(query)).totalCount
            ]);
        }
        return counts;
    }


    function determineCategoryCountsForSchema(categoriesList: Array<CategoryForm>) {

        const categories = getCategoriesWithoutExcludedCategories(categoriesList, EXCLUDED_CATEGORIES);
        return categories.map(pairWith(val(-1))) as Array<CategoryCount>;
    }


    /**
     * Fetches documents, clones them and replaces ids with identifiers
     *
     * @param find
     * @param selectedOperationId
     * @param selectedCategory
     */
    async function fetchDocuments(find: Find,
                                  selectedOperationId: string,
                                  selectedCategory: CategoryForm): Promise<Array<FieldDocument>> {

        try {
            const query = getQuery(selectedCategory.name, selectedOperationId);
            return (await find(query)).documents as Array<FieldDocument>;
        } catch (msgWithParams) {
            console.error(msgWithParams);
            return [];
        }
    }


    function rewriteIdentifiers(getIdentifierForId: GetIdentifierForId) {

        return async (document: FieldDocument): Promise<FieldDocument> => {

            const clonedDocument: FieldDocument = Document.clone(document);
            if (!clonedDocument.resource.relations) return clonedDocument;

            for (let relation of Object.keys(clonedDocument.resource.relations)) {

                const newTargets = [];
                for (let target of clonedDocument.resource.relations[relation]) {
                    try {
                        newTargets.push(await getIdentifierForId(target));
                    } catch(err) {
                        console.warn('Relation target "' + target + '" of resource "'
                            + document.resource.id + '" not found', err);
                    }
                }
                clonedDocument.resource.relations[relation] = newTargets;
            }
            return clonedDocument;
        }
    }


    function getQuery(category: Name, selectedOperationId: string, limit?: number) {

        const query: Query = {
            categories: [category],
            constraints: {}
        };
        if (limit) query.limit = limit;

        if (selectedOperationId !== PROJECT_CONTEXT) {
            (query.constraints as Constraints)[IS_CHILD_OF_CONTAIN] =
                { value: selectedOperationId, searchRecursively: true };
        }
        return query;
    }
}
