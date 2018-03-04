import {Injectable} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2/core';
import {IdaiType} from 'idai-components-2/configuration';
import {DocumentReadDatastore} from '../core/datastore/document-read-datastore';
import {UploadStatus} from './upload-status';
import {UploadResult} from './upload-result';
import {ExtensionUtil} from '../util/extension-util';
import {UploadModalComponent} from './upload-modal.component';
import {IdaiFieldFindResult} from '../core/datastore/core/cached-read-datastore';
import {M} from '../m';



@Injectable()
/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export abstract class Uploader {

    protected static supportedFileTypes: Array<string> = [];


    public constructor(
        protected modalService: NgbModal,
        private datastore: DocumentReadDatastore,
        private uploadStatus: UploadStatus
    ) {}


    /**
     * @param event The event containing the files to upload (can be drag event or event from file input
     * element)
     * @param depictsRelationTargetId If this parameter is set, each of the newly created documents will
     * contain a relation to the resource specified by the id. The type of the relation is determined by the
     * extending class.
     */
    public startUpload(event: Event, relationTarget?: Document): Promise<UploadResult> {

        const uploadResult: UploadResult = { uploadedFiles: 0, messages: [] };

        const files = Uploader.getFiles(event);
        const result = ExtensionUtil.reportUnsupportedFileTypes(files,
            (<typeof Uploader>this.constructor).supportedFileTypes);
        if (result[1]) uploadResult.messages.push([M.UPLOAD_ERROR_UNSUPPORTED_EXTS, result[1]]);
        if (result[0] == 0) return Promise.resolve(uploadResult);

        let uploadModalRef: any;
        return this.determineType(files.length, relationTarget)
            .then(type => {
                uploadModalRef = this.modalService.open(UploadModalComponent,
                    { backdrop: 'static', keyboard: false });
                return this.uploadFiles(files, type, uploadResult, relationTarget).then(result => {
                    uploadModalRef.close();
                    return Promise.resolve(result);
                });
            }).catch(() => Promise.resolve(uploadResult));
    }


    protected abstract determineType(fileCount: number, relationTarget?: Document): Promise<IdaiType>;


    private uploadFiles(files: Array<File>, type: IdaiType, uploadResult: UploadResult,
                        depictsRelationTarget?: Document): Promise<UploadResult> {

        if (!files) return Promise.resolve(uploadResult);

        this.uploadStatus.setTotalFiles(files.length);
        this.uploadStatus.setHandledFiles(0);

        const duplicateFilenames: string[] = [];
        let promise: Promise<any> = Promise.resolve();

        for (let file of files) {
            if (ExtensionUtil.ofUnsupportedExtension(file,
                    (<typeof Uploader>this.constructor).supportedFileTypes)) {
                this.uploadStatus.setTotalFiles(this.uploadStatus.getTotalFiles() - 1);
            } else {
                promise = promise.then(() => this.isDuplicateFilename(file.name))
                    .then(isDuplicateFilename => {
                        if (!isDuplicateFilename) {
                            return this.uploadFile(file, type, depictsRelationTarget);
                        } else {
                            duplicateFilenames.push(file.name);
                        }
                    }).then(() => this.uploadStatus.setHandledFiles(this.uploadStatus.getHandledFiles() + 1));
            }
        }

        return promise.then(
            () => {
                uploadResult.uploadedFiles = this.uploadStatus.getHandledFiles() - duplicateFilenames.length;
            }, msgWithParams => {
                uploadResult.messages.push(msgWithParams);
            }
        ).then(
            () => {
                if (duplicateFilenames.length == 1) {
                    uploadResult.messages.push([M.UPLOAD_ERROR_DUPLICATE_FILENAME, duplicateFilenames[0]]);
                } else if (duplicateFilenames.length > 1) {
                    uploadResult.messages.push([M.UPLOAD_ERROR_DUPLICATE_FILENAMES, duplicateFilenames.join(', ')]);
                }

                return Promise.resolve(uploadResult);
            }
        )
    }


    protected abstract uploadFile(file: File, type: IdaiType, relationTarget?: Document): Promise<any>;


    private isDuplicateFilename(filename: string): Promise<boolean> {

        return this.datastore.find({
            constraints: {
                'identifier:match' : this.getIdentifier(filename)
            }
        }).then((result: IdaiFieldFindResult<Document>) => result.totalCount > 0);
    }


    protected abstract getIdentifier(filename: string): string;


    private static getFiles(event: any): Array<File> {

        if (event['dataTransfer'] && event['dataTransfer']['files']) {
            return event['dataTransfer']['files'];
        } else if (event['srcElement'] && event['srcElement']['files']) {
            return event['srcElement']['files'];
        }

        return [];
    }
}