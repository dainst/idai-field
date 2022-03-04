import { Document } from '../../model/document';
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

        for (let document of getSampleDocuments(this.locale)) {
            await SampleDataLoaderBase.createDocument(document as Document, db);
        }
    }


    protected static async createDocument(document: Document, db: PouchDB.Database) {

        document.created = { user: 'sample_data', date: new Date() };
        document.modified = [{ user: 'sample_data', date: new Date() }];
        document._id = document.resource.id;
        document.resource.type = document.resource.category;
        delete document.resource.category;

        if (document.resource.id === 'project') {
            try {
                const project = await db.get('project');
                await db.remove('project', project._rev);
            } catch {
                // Ignore errors
            }
        }
        await db.put(document);
    }
}