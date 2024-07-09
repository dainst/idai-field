import { SampleDataLoaderBase } from 'idai-field-core';
import { getAsynchronousFs } from '../../../get-asynchronous-fs';
import { ThumbnailGenerator } from '../../../imagestore/thumbnail-generator';

const fs = window.require('fs');
const remote = window.require('@electron/remote');


/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Simon Hohl
 */
export class SampleDataLoader extends SampleDataLoaderBase {

    constructor(private thumbnailGenerator: ThumbnailGenerator,
                private imagestorePath: string,
                locale: string) {

        super(locale);
    }


    public async go(db: PouchDB.Database, project: string) {

        try {
            await this.loadSampleDocuments(db);
            await this.loadSampleImages(
                remote.getGlobal('samplesPath'),
                this.imagestorePath + project
            );
        } catch (err) {
            console.error('Failed to load sample data', err);
        }
    }


    private async loadSampleImages(srcFolderPath: string, destFolderPath: string) {

        const fileNames: string[] = await SampleDataLoader.getFileNames(srcFolderPath);

        for (const fileName of fileNames) {
            if (!fs.statSync(srcFolderPath + fileName).isDirectory()) {
                await this.copyImageFiles(srcFolderPath, destFolderPath, fileName);
            }
        }
    }

    
    private async copyImageFiles(srcFolderPath: string, destFolderPath: string, fileName: string) {

        fs.mkdirSync(destFolderPath, { recursive: true });
        fs.createReadStream(srcFolderPath + fileName).pipe(
            fs.createWriteStream(destFolderPath + '/' + fileName)
        );

        const buffer: Buffer = await this.thumbnailGenerator.generate(
            fs.readFileSync(srcFolderPath + fileName)
        ) as Buffer;
        const thumbnailDir = destFolderPath + '/thumbs';

        fs.mkdirSync(thumbnailDir, { recursive: true });
        fs.writeFileSync(thumbnailDir + '/' + fileName, buffer);
    }


    private static async getFileNames(folderPath: string): Promise<string[]> {

        try {
            return await getAsynchronousFs().readdir(folderPath);
        } catch (err) {
            console.error('Could not find sample data folder: ' + folderPath);
            throw err;
        }
    }
}
