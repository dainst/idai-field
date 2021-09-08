import { Datastore, Document, Query } from 'idai-field-core';
import { Observable } from 'rxjs';
import { bu1 } from '../../../test_data/test_docs/bu1';
import { lineBuilding } from '../../../test_data/test_docs/lineBuilding';
import { multiPolyTrench } from '../../../test_data/test_docs/multiPolyTrench';
import { pointBuilding } from '../../../test_data/test_docs/pointBuilding';
import { r1 } from '../../../test_data/test_docs/r1';
import { si1 } from '../../../test_data/test_docs/si1';

const bu1Id = bu1.resource.id;
const lineBuildingId = lineBuilding.resource.id;
const multiPolyTrenchId = multiPolyTrench.resource.id;
const pointBuildingId = pointBuilding.resource.id;
const r1Id = r1.resource.id;
const si1Id = si1.resource.id;

const ids = [bu1Id, lineBuildingId, multiPolyTrenchId, pointBuildingId, r1Id, si1Id];

export class DocumentRepository {

    public static async init() : Promise<DocumentRepository> {

        return new DocumentRepository();
    }

    find = jest.fn(async (_query: Query): Promise<Datastore.FindResult> => {
        
        return {
            ids,
            totalCount: ids.length,
            documents: [bu1, lineBuilding, multiPolyTrench, pointBuilding, r1, si1]
        };
    });

    public async get(_query: Query): Promise<Document> {
        return bu1;
    }

    public remoteChanged = (): Observable<Document> => new Observable<Document>();

    create = jest.fn(async (doc: Document): Promise<Document> => doc);
    
}
