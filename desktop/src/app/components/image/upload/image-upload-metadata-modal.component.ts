import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ImageMetadata } from '../../../services/imagestore/file-metadata';
import { Document, ProjectConfiguration, CategoryForm, Labels, Datastore } from 'idai-field-core';


@Component({
    selector: 'image-upload-metadata-modal',
    templateUrl: './image-upload-metadata-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 * @author Simon Hohl
 */
export class ImageUploadMetadataModalComponent {

    public fileCount: number;
    public depictsRelationTarget: Document;
    public imageCategory: CategoryForm;
    public projectStaff: string[];
    public metadata: ImageMetadata;

    constructor(public activeModal: NgbActiveModal,
                projectConfiguration: ProjectConfiguration,
                private datastore: Datastore,
                private labels: Labels) {

        this.imageCategory = projectConfiguration.getCategory('Image');

        this.projectStaff = [];
        this.metadata = {
            category: "Image",
            draughtsmen: [],
            processor: []
        }

        this.loadProjectDocumentData();
    }


    public getImageCategoryLabel = (category: CategoryForm) => this.labels.get(category);


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public setCategory(category: string) {
        this.metadata.category = category;
    }

    public toggleCreator(person: string) {
        if(person in this.metadata.draughtsmen) {
            this.metadata.draughtsmen = this.metadata.draughtsmen.filter((selected) => selected !== person);
        } else {
            this.metadata.draughtsmen.push(person);
        }
    }

    
    public toggleProcessor(person: string) {
        if(person in this.metadata.draughtsmen) {
            this.metadata.processor = this.metadata.processor.filter((selected) => selected !== person);
        } else {
            this.metadata.processor.push(person);
        }
    }

    private async loadProjectDocumentData() {
        const projectDoc: Document = await this.datastore.get('project');

        if ('staff' in projectDoc.resource) {
            this.projectStaff = projectDoc.resource['staff'];
        }
    }
}
