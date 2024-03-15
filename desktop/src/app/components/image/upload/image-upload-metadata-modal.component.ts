import { isArray } from 'tsfun';
import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Document, ProjectConfiguration, CategoryForm, Datastore, Labels } from 'idai-field-core';
import { ImageMetadata } from '../../../services/imagestore/file-metadata';
import { ImagesState } from '../overview/view/images-state';
import { AngularUtility } from '../../../angular/angular-utility';


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
export class ImageUploadMetadataModalComponent implements OnInit {

    public fileCount: number;
    public depictsRelationTarget: Document;

    public topLevelCategories: Array<CategoryForm>;
    public projectStaff: string[];
    public metadata: ImageMetadata;


    constructor(public activeModal: NgbActiveModal,
                private projectConfiguration: ProjectConfiguration,
                private imagesState: ImagesState,
                private datastore: Datastore,
                private labels: Labels) {

        this.topLevelCategories = [projectConfiguration.getCategory('Image')];

        this.projectStaff = [];
        this.metadata = {
            category: 'Image',
            draughtsmen: []
        }

        this.loadProjectDocumentData();
    }


    public hasImageChildCategories = () => this.topLevelCategories[0].children.length > 0;

    public getSelectedCategoryNames = () => [this.metadata.category];


    ngOnInit() {
        
        AngularUtility.blurActiveElement();
    }


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public setCategory(category: CategoryForm) {

        this.metadata.category = category.name;
    }


    public getParseFileMetadata(fieldName: string) {

        return this.imagesState.getParseFileMetadata(fieldName);
    }


    public async setParseFileMetadata(fieldName: string, value: boolean) {
        
        await this.imagesState.setParseFileMetadata(fieldName, value);
    }


    public isFieldConfigured(categoryName: string, fieldName: string): boolean {

        const category: CategoryForm = this.projectConfiguration.getCategory(categoryName);
        return CategoryForm.getField(category, fieldName) !== undefined;
    }


    public getFieldLabel(categoryName: string, fieldName: string): string {
        
        const category: CategoryForm = this.projectConfiguration.getCategory(categoryName);
        return this.labels.getFieldLabel(category, fieldName) ?? '';
    }


    public toggleDraughtsman(person: string) {

        if (this.metadata.draughtsmen.includes(person)) {
            this.metadata.draughtsmen = this.metadata.draughtsmen.filter((selected) => selected !== person);
        } else {
            this.metadata.draughtsmen.push(person);
        }
    }


    private async loadProjectDocumentData() {

        const projectDocument: Document = await this.datastore.get('project');

        if (projectDocument.resource.staff && isArray(projectDocument.resource.staff)) {
            this.projectStaff = projectDocument.resource['staff'];
        }
    }
}
