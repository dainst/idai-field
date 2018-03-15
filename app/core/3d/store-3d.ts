import {Injectable} from '@angular/core';
import * as rimraf from 'rimraf';
import {IdaiField3DDocument} from '../model/idai-field-3d-document';
import {M} from '../../m';
import {SettingsService} from '../settings/settings-service';
import {PouchdbManager} from '../datastore/core/pouchdb-manager';

const fs = require('fs');


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class Store3D {

    constructor(private settingsService: SettingsService,
                private pouchdbManager: PouchdbManager) {}


    public async save(file: File, document: IdaiField3DDocument): Promise<any> {

        let directoryPath = '';
        try {
            directoryPath = await this.createDirectory(document);
        } catch(err) {
            return Promise.reject([M.MODEL3DSTORE_ERROR_WRITE]);
        }

        await this.copyFile(file.path, directoryPath + '/' + document.resource.id);
        await this.copyImageFiles(file, directoryPath);
    }


    public async saveThumbnail(document: IdaiField3DDocument, blob: Blob|null) {

        if (!blob) return;

        await this.pouchdbManager.getDb().putAttachment(
            document.resource.id,
            'thumb',
            (document as any)['_rev'],
            blob,
            'image/jpeg'
        );
    }


    public async remove(id: string): Promise<any> {

        return new Promise((resolve) => {
            rimraf(this.getObjectDirectoryPath(id), () => resolve());
        });
    }


    private copyFile(sourcePath: string, targetPath: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            const readStream = fs.createReadStream(sourcePath);
            readStream.on('error', () => reject([M.UPLOAD_ERROR_FILEREADER, sourcePath]));

            const writeStream = fs.createWriteStream(targetPath);
            writeStream.on('error', () => reject([M.MODEL3DSTORE_ERROR_WRITE]));
            writeStream.on('close', () => resolve());

            readStream.pipe(writeStream);
        });
    }


    private async copyImageFiles(file: File, directoryPath: string): Promise<any> {

        for (let imageFileName of Store3D.getImageFileNames(file)) {
            await this.copyFile(Store3D.getImageFilePath(imageFileName, file),
                directoryPath + '/' + imageFileName);
        }
    }


    private createDirectory(document: IdaiField3DDocument): string {

        const storeDirectoryPath: string = this.getStoreDirectoryPath();
        const projectDirectoryPath: string = this.getProjectDirectoryPath();
        const objectDirectoryPath: string = this.getObjectDirectoryPath(document.resource.id as string);

        if (!fs.existsSync(storeDirectoryPath)) fs.mkdirSync(storeDirectoryPath);
        if (!fs.existsSync(projectDirectoryPath)) fs.mkdirSync(projectDirectoryPath);
        if (!fs.existsSync(objectDirectoryPath)) fs.mkdirSync(objectDirectoryPath);

        return objectDirectoryPath;
    }


    private getStoreDirectoryPath(): string {

        return this.settingsService.getSettings().model3DStorePath;
    }


    private getProjectDirectoryPath(): string {

        return this.getStoreDirectoryPath() + this.settingsService.getSelectedProject();
    }


    private getObjectDirectoryPath(id: string): string {

        return this.getProjectDirectoryPath() + '/' + id;
    }


    private static getImageFileNames(file: File): string[] {

        const fileContent: string = fs.readFileSync(file.path);
        const xml: XMLDocument = new DOMParser().parseFromString(fileContent, 'text/xml');
        const imageElements = xml.getElementsByTagName('library_images')[0]
            .getElementsByTagName('image');

        const imageFileNames: string[] = [];

        for (let i = 0; i < imageElements.length; i++) {
            const fileName: string = imageElements[i]
                .getElementsByTagName('init_from')[0]
                .textContent as string;
            imageFileNames.push(fileName);
        }

        return imageFileNames;
    }


    private static getImageFilePath(imageFileName: string, modelFile: File): string {

        const filePath: string[] = modelFile.path.split('/');
        filePath.pop();

        return filePath.join('/') + '/' + imageFileName;
    }
}