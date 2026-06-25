import { SampleDataLoaderBase } from 'idai-field-core';
import { getAsynchronousFs } from '../../../get-asynchronous-fs';
import { ThumbnailGenerator } from '../../../imagestore/thumbnail-generator';

import { electronFs as fs } from 'src/app/electron/electron';
import { electronRemote as remote } from 'src/app/electron/electron';


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


    public async go(db: any, project: string) {

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

        const imageBuffer = fs.readFileSync(srcFolderPath + fileName);

        fs.mkdirSync(destFolderPath, { recursive: true });
        fs.writeFileSync(destFolderPath + '/' + fileName, imageBuffer);

        const buffer: Buffer = await this.thumbnailGenerator.generate(
            imageBuffer
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
