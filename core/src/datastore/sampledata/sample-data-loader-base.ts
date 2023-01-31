import { Document, NewDocument } from '../../model/document';
import { getSampleDocuments } from './sample-data';


export class SampleDataLoaderBase {

    constructor(private locale: string) {}
    

    public async go(db: PouchDB.Database, project: string) {
        try {
            await this.loadSampleDocuments(db);
        } catch(err) {
            console.error('Failed to load sample data', err)
        }
    }


    protected async loadSampleDocuments(db: any): Promise<any> {

        try {
            const project = await db.get('project');
            await db.remove('project', project._rev);
        } catch {
            // Ignore errors
        }

        const documents = getSampleDocuments(this.locale).map(document => {
            return SampleDataLoaderBase.createDocument(document, db);
        });

        return db.bulkDocs(documents);
    }


    protected static createDocument(document: NewDocument, db: PouchDB.Database): Document {

        const result: Document = Document.clone(document as Document);

        result.created = { user: 'sample_data', date: new Date() };
        result.modified = [{ user: 'sample_data', date: new Date() }];
        result._id = document.resource.id;

        return result;
    }
}