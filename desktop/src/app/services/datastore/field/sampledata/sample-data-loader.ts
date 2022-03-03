import { ImageDocument, SampleDataLoaderBase } from 'idai-field-core';
import { ImageConverter } from '../../../imagestore/image-converter';


const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');
const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class SampleDataLoader extends SampleDataLoaderBase {

    constructor(private imageConverter: ImageConverter,
                private imagestorePath: string,
                locale: string) {

        super(locale);
    }


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
}
