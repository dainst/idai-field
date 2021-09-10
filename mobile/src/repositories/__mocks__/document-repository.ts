import { Datastore, Document, NewDocument, Query } from 'idai-field-core';
import { Observable } from 'rxjs';
import { bu1 } from '../../../test_data/test_docs/bu1';
import { lineBuilding } from '../../../test_data/test_docs/lineBuilding';
import { pointBuilding } from '../../../test_data/test_docs/pointBuilding';
import { r1 } from '../../../test_data/test_docs/r1';
import { si1 } from '../../../test_data/test_docs/si1';
import { multiPointSurvey } from './../../../test_data/test_docs/multiPointSurvey';
import { multiPolyTrench } from './../../../test_data/test_docs/multiPolyTrench';
import { si3 } from './../../../test_data/test_docs/si3';
import { si4 } from './../../../test_data/test_docs/si4';
import { t2 } from './../../../test_data/test_docs/t2';
import { tf1 } from './../../../test_data/test_docs/tf1';

const bu1Id = bu1.resource.id;
const lineBuildingId = lineBuilding.resource.id;
const multiPolyTrenchId = multiPolyTrench.resource.id;
const pointBuildingId = pointBuilding.resource.id;
const r1Id = r1.resource.id;
const si1Id = si1.resource.id;

const ids = [bu1Id, lineBuildingId, multiPolyTrenchId, pointBuildingId, r1Id, si1Id];
const docs: Document[] = [bu1, lineBuilding, multiPointSurvey, multiPolyTrench, pointBuilding, r1, si1, si3,si4,t2,tf1];

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

    public async get(resourceId: string): Promise<Document> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const doc = docs.find(doc => doc.resource.id === resourceId);
                if(doc) resolve(doc);
                else reject(
                    'Doc not found. For testing with mock repository provide doc from test_data/test_docs directory!');
            },50);
        });
    }

    public remoteChanged = (): Observable<Document> => new Observable<Document>();

    create = jest.fn(async (doc: Document | NewDocument): Promise<Document> => {
        return {
            resource: { ...doc.resource, id: 'id' },
            _id: 'id',
            modified: [],
            created: {
                user: 'testUser',
                date: new Date()
            }
        };
    });

    update = jest.fn(async (doc: Document): Promise<Document> => {
        return doc;
    });
    
}
