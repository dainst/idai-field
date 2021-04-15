import { Document, ImageDocument } from 'idai-field-core';
import { ImageConverter } from '../../../images/imagestore/image-converter';
import { getSampleDocuments } from './sample-data';

const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');
const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class SampleDataLoader {

    constructor(private imageConverter: ImageConverter,
                private imagestorePath: string,
                private locale: string) {}


    public async go(db: PouchDB.Database, project: string) {

        try {
            await this.loadSampleDocuments(db);
            await this.loadSampleImages(
                remote.getGlobal('samplesPath'),
                this.imagestorePath + project,
                db
            );
        } catch(err) {
            console.error('Failed to load sample data', err);
        }
    }


    private async loadSampleDocuments(db: any): Promise<any> {

        for (let document of getSampleDocuments(this.locale)) {
            await SampleDataLoader.createDocument(document as Document, db);
        }
    }


    private async loadSampleImages(srcFolderPath: string, destFolderPath: string, db: any) {

        const fileNames: string[] = await SampleDataLoader.getFileNames(srcFolderPath);

        for (let fileName of fileNames) {
            if (!fs.statSync(srcFolderPath + fileName).isDirectory()) {
                SampleDataLoader.copyImageFile(srcFolderPath, destFolderPath, fileName);
                await this.createThumbnail(srcFolderPath, fileName, db);
            }
        }
    }


    private async createThumbnail(filePath: string, fileName: string, db: PouchDB.Database) {

        const buffer: Buffer = await this.imageConverter.convert(fs.readFileSync(filePath + fileName)) as Buffer;
        const imageDocument: ImageDocument = await db.get(fileName);

        await db.putAttachment(
            fileName,
            'thumb',
            imageDocument._rev,
            new Blob([buffer]),
            'image/jpeg'
        );
    }


    private static getFileNames(folderPath: string): Promise<string[]> {

        return new Promise<any>((resolve, reject) => {
            fs.readdir(folderPath, (err, fileNames) => {
                if (fileNames && !err) {
                    resolve(fileNames);
                } else {
                    console.error('Could not find sample data folder: ' + folderPath);
                    reject(err);
                }
            });
        });
    }


    private static copyImageFile(srcFolderPath: string, destFolderPath: string, fileName: string) {

        fs.createReadStream(srcFolderPath + fileName).pipe(
            fs.createWriteStream(destFolderPath + '/' + fileName)
        );
    }


    private static async createDocument(document: Document, db: PouchDB.Database) {

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
