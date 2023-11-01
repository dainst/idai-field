import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ImageMetadata } from '../../../services/imagestore/file-metadata';
import { Document, ProjectConfiguration, CategoryForm, Datastore } from 'idai-field-core';
import { ImagesState } from '../overview/view/images-state';


/**
 * @author Thomas Kleinke
 * @author Simon Hohl
 * 
 * This modal lets the user select some {@link ImageMetadata} explicitly:
 * - category, defaults to "Image"
 * - draughtsmen, alternatively the user can choose to load the data from internal image metadata (EXIF etc.)
 */
@Component({
    selector: 'image-upload-metadata-modal',
    templateUrl: './image-upload-metadata-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
export class ImageUploadMetadataModalComponent {

    public fileCount: number;
    public depictsRelationTarget: Document;
    public topLevelCategories: Array<CategoryForm>;
    public projectStaff: string[];
    public metadata: ImageMetadata;

    constructor(private imagesState: ImagesState,
                public activeModal: NgbActiveModal,
                projectConfiguration: ProjectConfiguration,
                private datastore: Datastore) {

        this.topLevelCategories = [projectConfiguration.getCategory('Image')];

        this.projectStaff = [];
        this.metadata = {
            category: "Image",
            draughtsmen: []
        }

        this.loadProjectDocumentData();
    }


    public hasImageChildCategories = () => this.topLevelCategories[0].children.length > 0;

    public getSelectedCategoryNames = () => [this.metadata.category];


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public setCategory(category: CategoryForm) {

        this.metadata.category = category.name;
    }


    public toggleDraughtsman(person: string) {
        if(person in this.metadata.draughtsmen) {
            this.metadata.draughtsmen = this.metadata.draughtsmen.filter((selected) => selected !== person);
        } else {
            this.metadata.draughtsmen.push(person);
        }
    }


    public getParseFileMetadata = () => this.imagesState.getParseFileMetadata();


    public setParseFileMetadata = (expand: boolean) => this.imagesState.setParseFileMetadata(expand);


    private async loadProjectDocumentData() {
        const projectDoc: Document = await this.datastore.get('project');

        if ('staff' in projectDoc.resource) {
            this.projectStaff = projectDoc.resource['staff'];
        }
    }
}
