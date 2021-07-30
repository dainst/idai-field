import { Category, Document, FieldDocument, FindResult, ISRECORDEDIN_CONTAIN, Name, Named, Query, Resource } from 'idai-field-core';
import { aFlow, aMap, includedIn, isNot, map, on, pairWith, to, val } from 'tsfun';
import { CategoryCount, Find, Get, GetIdentifierForId, PerformExport } from './export-helper';

const LIES_WITHIN_CONTAIN = 'liesWithin:contain';

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

    export const BASE_EXCLUSION = ['Operation', 'Project'];
    const ADD_EXCLUSION = ['Place', 'Survey', 'Trench', 'Building'];


    /**
     * 'project', if the whole project is the context
     * undefined, if only the schema is to be exported
     * a resource id of a place or an operation, otherwise
     */
    export type ExportContext = undefined | 'project' | Resource.Id;


    export async function performExport(get: Get,
                                        find: Find,
                                        getIdentifierForId: GetIdentifierForId,
                                        context: ExportContext,
                                        selectedCategory: Category,
                                        relations: string[],
                                        performExport: PerformExport) {

        const documents = [];

        if (context === undefined) {

            // nop

        } else if (context === PROJECT_CONTEXT) {

            documents.push(...(await fetchDocuments(find, PROJECT_CONTEXT, selectedCategory)));

        } else if (ADD_EXCLUSION.includes(selectedCategory.name)) {

            documents.push(...(
                await findLiesWithin(find, selectedCategory.name, context)).documents
            );

        } else {

            for (const operationId of (await getOperationIds(get, find, context))) {
                documents.push(...(await fetchDocuments(find, operationId, selectedCategory)));
            }
        }

        return await aFlow(
                documents,
                aMap(rewriteIdentifiers(getIdentifierForId)),
                map(to(Document.RESOURCE)),
                performExport(selectedCategory, relations));
    }


    export function getCategoriesWithoutExcludedCategories(categories: Array<Category>, exclusion: string[]) {

        return categories.filter(on(Named.NAME, isNot(includedIn(exclusion))))
    }


    export async function determineCategoryCounts(get: Get,
                                                  find: Find,
                                                  context: ExportContext,
                                                  categoriesList: Array<Category>): Promise<Array<CategoryCount>> {

        if (!context) return determineCategoryCountsForSchema(categoriesList);

        if (context === PROJECT_CONTEXT) {
            return (await determineCategoryCountsForSelectedOperation(
               find, context, categoriesList
            )).filter(([_category, count]) => count > 0);
        }

        const topLevelCounts = await determineCategoryCountsForToplevel(find, context, categoriesList);
        const recordedCounts = await determineCategoryCountsForMultipleOperations(
            get, find, context, categoriesList
        );

        return topLevelCounts.concat(recordedCounts).filter(([_category, count]) => count > 0);
    }


    async function determineCategoryCountsForMultipleOperations(get: Get,
                                                                find: Find,
                                                                selectedOperationId: string,
                                                                categoriesList: Array<Category>): Promise<Array<CategoryCount>> {

        const counts = {};
        for (const id of (await getOperationIds(get, find, selectedOperationId))) {
            const localCounts = await determineCategoryCountsForSelectedOperation(
                find, id, categoriesList
            );
            for (const [cat, cnt] of localCounts) {
                if (!counts[cat.name]) {
                    counts[cat.name] = [cat, cnt];
                } else {
                    counts[cat.name] = [cat, cnt + counts[cat.name][1]]
                }
            }
        }

        return Object.values(counts);
    }


    async function determineCategoryCountsForToplevel(find: Find,
                                                      id: string, categoriesList): Promise<Array<CategoryCount>> {
        const counts = [];
        for (const category of ADD_EXCLUSION.map(name => categoriesList.find(cat => cat.name === name))) {
            counts.push([category, (await findLiesWithin(find, category.name, id)).totalCount]);
        }
        return counts;
    }


    async function determineCategoryCountsForSelectedOperation(find: Find,
                                                               selectedOperationId: string|undefined,
                                                               categoriesList: Array<Category>): Promise<Array<CategoryCount>> {

        const categories = getCategoriesWithoutExcludedCategories(
            categoriesList,
            BASE_EXCLUSION.concat(selectedOperationId === 'project' ? [] : ADD_EXCLUSION)
        );

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


    async function getOperationIds(get: Get,
                                   find: Find,
                                   selectedOperationId: string) {

        const selectedOperation = await get(selectedOperationId);
        return selectedOperation.resource.category !== 'Place'
            ? [selectedOperationId]
            : (await find({ constraints: { 'liesWithin:contain': selectedOperationId }}))
                .documents
                .filter(doc => doc.resource.category !== 'Place')
                .map(doc => doc.resource.id);
    }


    function determineCategoryCountsForSchema(categoriesList: Array<Category>) {

        const categories = getCategoriesWithoutExcludedCategories(categoriesList, BASE_EXCLUSION);
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
                                  selectedCategory: Category): Promise<Array<FieldDocument>> {

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


    export async function findLiesWithin(find: Find,
                                         category: Name,
                                         context: Resource.Id): Promise<FindResult> {

        const query: Query = {
            categories: [category],
            constraints: {}
        };
        (query.constraints as any)[LIES_WITHIN_CONTAIN] = context;
        return find(query);
    }


    function getQuery(categoryName: string, selectedOperationId: string, limit?: number) {

        const query: Query = {
            categories: [categoryName],
            constraints: {},
            limit: limit
        };
        if (selectedOperationId !== PROJECT_CONTEXT) {
            (query.constraints as any)[ISRECORDEDIN_CONTAIN] = selectedOperationId;
        }
        return query;
    }
}
