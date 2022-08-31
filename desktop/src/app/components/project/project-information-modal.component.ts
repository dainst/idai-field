import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Map } from 'tsfun';
import { Datastore, PouchdbDatastore, Document, ImageStore, FileInfo, ImageVariant,
    ProjectConfiguration } from 'idai-field-core';
import { Messages } from '../messages/messages';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { RevisionLabels } from '../../services/revision-labels';


@Component({
    selector: 'project-information-modal',
    templateUrl: './project-information-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})

/**
 * @author Thomas Kleinke
 */
export class ProjectInformationModalComponent implements OnInit {

    public totalDocumentCount: number;
    public imageDocumentCount: number;
    public typeDocumentCount: number;

    public lastChangedDocument: Document;
    public lastChangedDocumentUser: string;
    public lastChangedDocumentDate: string;

    public thumbnailFileCount: number;
    public originalFileCount: number;
    public thumbnailFileSize: string;
    public originalFileSize: string;

    public ready: boolean = false;


    constructor(public activeModal: NgbActiveModal,
                private pouchdbDatastore: PouchdbDatastore,
                private datastore: Datastore,
                private imagestore: ImageStore,
                private settings: SettingsProvider,
                private projectConfiguration: ProjectConfiguration,
                private messages: Messages,
                private decimalPipe: DecimalPipe) {}

  
    async ngOnInit() {

        try {
            await this.updateInformation();
            this.ready = true;
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.close();
    }


    private async updateInformation() {

        this.totalDocumentCount = await this.getDocumentCount();
        this.imageDocumentCount = await this.getImageDocumentCount();
        this.typeDocumentCount = await this.getTypeDocumentCount();

        this.lastChangedDocument = await this.getLastChangedDocument();
        this.lastChangedDocumentUser = Document.getLastModified(this.lastChangedDocument).user;
        this.lastChangedDocumentDate = RevisionLabels.getLastModifiedDateLabel(this.lastChangedDocument);
        
        const fileInfos: Map<FileInfo> = await this.imagestore.getFileInfos(
            this.settings.getSettings().selectedProject
        );

        this.thumbnailFileCount = await ProjectInformationModalComponent.getFileCount(
            fileInfos, ImageVariant.THUMBNAIL
        );
        this.originalFileCount = await ProjectInformationModalComponent.getFileCount(
            fileInfos, ImageVariant.ORIGINAL
        );

        this.thumbnailFileSize = await this.getFileSize(ImageVariant.THUMBNAIL);
        this.originalFileSize = await this.getFileSize(ImageVariant.ORIGINAL);
    }


    private async getDocumentCount(): Promise<number> {

        return (await this.pouchdbDatastore.getDb().info()).doc_count;
    }


    private async getImageDocumentCount(): Promise<number> {

        return await this.getDocumentCountForCategories(
            this.projectConfiguration.getImageCategories().map(category => category.name)
        );
    }


    private async getTypeDocumentCount(): Promise<number> {

        return await this.getDocumentCountForCategories(
            this.projectConfiguration.getTypeCategories().map(category => category.name)
        );
    }


    private async getDocumentCountForCategories(categories: string[]): Promise<number> {

        return (await this.datastore.findIds({ categories })).totalCount;
    }

    
    private async getLastChangedDocument(): Promise<Document|undefined> {

        const lastChangedDocumentId: string|undefined = await this.pouchdbDatastore.getLatestChange();

        return lastChangedDocumentId
            ? this.datastore.get(lastChangedDocumentId)
            : undefined;
    }


    private async getFileSize(variant: ImageVariant): Promise<string> {

        const fileList = await this.imagestore.getFileInfos(
            this.settings.getSettings().selectedProject,
            [variant]
        );

        const sizes = ImageStore.getFileSizeSums(fileList);

        return `${ImageStore.byteCountToDescription(
            sizes[variant], (value) => this.decimalPipe.transform(value)
        )}`;
    }


    private static async getFileCount(fileInfos: Map<FileInfo>, variant: ImageVariant): Promise<number> {

        return Object.values(fileInfos).filter(fileInfo => {
            return fileInfo.variants.filter(v => v.name === variant).length === 1;
        }).length;
    }
}
