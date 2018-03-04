import {Injectable} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2/core';
import {IdaiType, ProjectConfiguration} from 'idai-components-2/configuration';
import {SettingsService} from '../../core/settings/settings-service';
import {UploadStatus} from '../upload-status';
import {PersistenceManager} from "../../core/persist/persistence-manager";
import {DocumentReadDatastore} from "../../core/datastore/document-read-datastore";
import {Uploader} from '../uploader';
import {M} from '../../m';
import {IdaiField3DDocument} from '../../core/model/idai-field-3d-document';
import {Object3DThumbnailCreatorModalComponent} from './object-3d-thumbnail-creator-modal.component';
import {PouchdbManager} from '../../core/datastore/core/pouchdb-manager';

const fs = require('fs');


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class Object3DUploader extends Uploader {

    protected static supportedFileTypes: Array<string> = ['dae'];


    public constructor(
        private persistenceManager: PersistenceManager,
        private projectConfiguration: ProjectConfiguration,
        private settingsService: SettingsService,
        private pouchdbManager: PouchdbManager,
        modalService: NgbModal,
        datastore: DocumentReadDatastore,
        uploadStatus: UploadStatus
    ) {
        super(modalService, datastore, uploadStatus);
    }


    protected async determineType(fileCount: number, relationTarget?: Document): Promise<IdaiType> {

        return this.projectConfiguration.getTypesMap()['Object3D'];
    }


    protected async uploadFile(file: File, type: IdaiType, relationTarget?: Document): Promise<any> {

        const document: IdaiField3DDocument = await this.create3DDocument(file, type);
        await this.copyToModel3DStore(file, document);
        await this.createThumbnail(document, relationTarget);
    }


    private async copyToModel3DStore(file: File, document: IdaiField3DDocument): Promise<any> {

        let directoryPath = '';
        try {
            directoryPath = await this.createModel3DStoreDirectory(document);
        } catch(err) {
            return Promise.reject([M.MODEL3DSTORE_ERROR_WRITE]);
        }

        await this.copyFile(file.path, directoryPath + '/' + document.resource.id);
        await this.copyImageFilesToModel3DStore(file, directoryPath);
    }


    private async copyImageFilesToModel3DStore(file: File, directoryPath: string): Promise<any> {

        for (let imageFileName of Object3DUploader.getImageFileNames(file)) {
            await this.copyFile(Object3DUploader.getImageFilePath(imageFileName, file),
                directoryPath + '/' + imageFileName);
        }
    }


    private async createThumbnail(document: IdaiField3DDocument, relationTarget?: Document): Promise<any> {

        const { blob, width, height } = await this.openThumbnailCreator(document);
        if (!blob) return;

        const updatedDocument: IdaiField3DDocument
            = await this.complete(document, width, height, relationTarget);
        await this.saveThumbnail(updatedDocument, blob);
    }


    private openThumbnailCreator(document: IdaiField3DDocument)
            : Promise<{ blob: Blob|null, width: number, height: number }> {

        const modal: NgbModalRef = this.modalService.open(Object3DThumbnailCreatorModalComponent,
            { backdrop: 'static', keyboard: false }
        );

        modal.componentInstance.document = document;

        return modal.result.then(
            result => Promise.resolve(result),
            closeReason => Promise.resolve({})
        );
    }


    private copyFile(sourcePath: string, targetPath: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            const readStream = fs.createReadStream(sourcePath);
            readStream.on('error', () => reject([M.UPLOAD_ERROR_FILEREADER]));

            const writeStream = fs.createWriteStream(targetPath);
            writeStream.on('error', () => reject([M.MODEL3DSTORE_ERROR_WRITE]));
            writeStream.on('close', () => resolve());

            readStream.pipe(writeStream);
        });
    }


    private createModel3DStoreDirectory(document: IdaiField3DDocument): string {

        const model3DStorePath: string = this.settingsService.getSettings().model3DStorePath;
        const projectDirectoryPath: string = model3DStorePath + this.settingsService.getSelectedProject();
        const object3DDirectoryPath: string = projectDirectoryPath + '/' + document.resource.id;

        if (!fs.existsSync(model3DStorePath)) fs.mkdirSync(model3DStorePath);
        if (!fs.existsSync(projectDirectoryPath)) fs.mkdirSync(projectDirectoryPath);
        if (!fs.existsSync(object3DDirectoryPath)) fs.mkdirSync(object3DDirectoryPath);

        return object3DDirectoryPath;
    }


    private async create3DDocument(file: File, type: IdaiType): Promise<IdaiField3DDocument> {

        const document: IdaiField3DDocument = {
            resource: {
                identifier: this.getIdentifier(file.name),
                shortDescription: '',
                type: type.name,
                originalFilename: file.name,
                thumbnailWidth: 0,
                thumbnailHeight: 0,
                relations: {
                    is3DRepresentationOf: []
                }
            }
        };

        return this.persistenceManager.persist(document, this.settingsService.getUsername(),
            [document]);
    }


    private async complete(document: IdaiField3DDocument, width: number, height: number,
                           relationTarget?: Document): Promise<any> {

        document.resource.thumbnailWidth = width;
        document.resource.thumbnailHeight = height;

        if (relationTarget && relationTarget.resource.id) {
            document.resource.relations['is3DRepresentationOf'] = [relationTarget.resource.id];
        }

        return this.persistenceManager.persist(document, this.settingsService.getUsername(),
            [document]);
    }


    private async saveThumbnail(document: IdaiField3DDocument, blob: Blob) {

        await this.pouchdbManager.getDb().putAttachment(
            document.resource.id,
            'thumb',
            (document as any)['_rev'],
            blob,
            'image/jpeg'
        );
    }


    protected getIdentifier(filename: string): string {

        const fileName: string[] = filename.split('.');
        fileName.pop();

        return fileName.join('');
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