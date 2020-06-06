import {Document} from 'idai-components-2';
import {DocumentReadDatastore} from '../datastore/document-read-datastore';
import {ProjectConfiguration} from '../configuration/project-configuration';
import {ProjectCategoriesUtility} from '../configuration/project-categories-utility';
import {FindIdsResult, FindResult} from '../datastore/model/read-datastore';
import {Query} from '../datastore/model/query';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DescendantsUtility {

    constructor(private projectCategories: ProjectCategoriesUtility,
                private projectConfiguration: ProjectConfiguration,
                private datastore: DocumentReadDatastore) {}


    public async fetchChildren(document: Document): Promise<Array<Document>> {

        return (await this.findDescendants(document) as FindResult).documents;
    }


    public async fetchChildrenCount(document: Document): Promise<number> {

        return !document.resource.id
            ? 0
            : (await this.findDescendants(document, true)).totalCount;
    }


    private async findDescendants(document: Document, skipDocuments = false): Promise<FindIdsResult> {

        return this.projectConfiguration.isSubcategory(document.resource.category, 'Operation')
            ? await this.findRecordedInDocs(document.resource.id, skipDocuments)
            : await this.findLiesWithinDocs(document.resource.id, skipDocuments);
    }


    public async findRecordedInDocs(resourceId: string, skipDocuments: boolean): Promise<FindIdsResult> {

        const query: Query = {
            constraints: { 'isRecordedIn:contain': resourceId }
        };

        return skipDocuments
            ? this.datastore.findIds(query)
            : await this.datastore.find(query);
    }


    private async findLiesWithinDocs(resourceId: string, skipDocuments: boolean): Promise<FindIdsResult> {

        const query: Query = {
            constraints: {
                'liesWithin:contain': {
                    value: resourceId,
                    searchRecursively: true
                }
            }
        };

        return skipDocuments
            ? this.datastore.findIds(query)
            : await this.datastore.find(query);
    }
}

