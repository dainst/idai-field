import {Injectable} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2/core';
import {IdaiType, ProjectConfiguration} from 'idai-components-2/configuration';
import {SettingsService} from '../../core/settings/settings-service';
import {UploadStatus} from '../upload-status';
import {PersistenceManager} from "../../core/persist/persistence-manager";
import {DocumentReadDatastore} from "../../core/datastore/document-read-datastore";
import {Uploader} from '../uploader';
import {IdaiField3DDocument} from '../../core/model/idai-field-3d-document';
import {Object3DThumbnailCreatorModalComponent} from './object-3d-thumbnail-creator-modal.component';
import {Store3D} from '../../core/3d/store-3d';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class Object3DUploader extends Uploader {

    public static supportedFileTypes: Array<string> = ['dae'];


    public constructor(
        private store3D: Store3D,
        private persistenceManager: PersistenceManager,
        private projectConfiguration: ProjectConfiguration,
        private settingsService: SettingsService,
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
        await this.store3D.save(file, document);

        const {blob, width, height} = await this.createThumbnail(document);
        const updatedDocument: IdaiField3DDocument = await this.complete(document, width, height,
            relationTarget);
        await this.store3D.saveThumbnail(updatedDocument, blob);
    }


    private createThumbnail(document: IdaiField3DDocument)
            : Promise<{ blob: Blob|null, width: number, height: number }> {

        const modal: NgbModalRef = this.modalService.open(Object3DThumbnailCreatorModalComponent,
            {
                backdrop: 'static',
                keyboard: false,
                size: 'lg',
                windowClass: 'thumbnail-creator-modal'
            }
        );

        modal.componentInstance.document = document;

        return modal.result.then(
            result => Promise.resolve(result),
            closeReason => Promise.resolve({})
        );
    }


    private async create3DDocument(file: File, type: IdaiType): Promise<IdaiField3DDocument> {

        const document: IdaiField3DDocument = {
            resource: {
                identifier: this.getIdentifier(file.name),
                shortDescription: '',
                type: type.name,
                georeferenced: false,
                originalFilename: file.name,
                thumbnailWidth: 0,
                thumbnailHeight: 0,
                relations: {
                    depicts: []
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
            document.resource.relations.depicts = [relationTarget.resource.id];
        }

        return this.persistenceManager.persist(document, this.settingsService.getUsername(),
            [document]);
    }


    protected getIdentifier(filename: string): string {

        const fileName: string[] = filename.split('.');
        fileName.pop();

        return fileName.join('');
    }
}