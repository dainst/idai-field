import {Injectable} from '@angular/core';
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

        await this.copyModelFile(file.path, directoryPath + '/' + document.resource.id);
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


    private copyModelFile(sourcePath: string, targetPath: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            const readStream = fs.createReadStream(sourcePath);
            readStream.on('error', () => reject([M.UPLOAD_ERROR_FILEREADER]));

            const writeStream = fs.createWriteStream(targetPath);
            writeStream.on('error', () => reject([M.MODEL3DSTORE_ERROR_WRITE]));
            writeStream.on('close', () => resolve());

            readStream.pipe(writeStream);
        });
    }


    private async copyImageFiles(file: File, directoryPath: string): Promise<any> {

        for (let imageFileName of Store3D.getImageFileNames(file)) {
            await this.copyModelFile(Store3D.getImageFilePath(imageFileName, file),
                directoryPath + '/' + imageFileName);
        }
    }


    private createDirectory(document: IdaiField3DDocument): string {

        const model3DStorePath: string = this.settingsService.getSettings().model3DStorePath;
        const projectDirectoryPath: string = model3DStorePath + this.settingsService.getSelectedProject();
        const object3DDirectoryPath: string = projectDirectoryPath + '/' + document.resource.id;

        if (!fs.existsSync(model3DStorePath)) fs.mkdirSync(model3DStorePath);
        if (!fs.existsSync(projectDirectoryPath)) fs.mkdirSync(projectDirectoryPath);
        if (!fs.existsSync(object3DDirectoryPath)) fs.mkdirSync(object3DDirectoryPath);

        return object3DDirectoryPath;
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