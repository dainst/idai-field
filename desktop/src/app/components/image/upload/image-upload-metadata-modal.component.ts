import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Document, ProjectConfiguration, CategoryForm, Datastore, Labels, ValuelistUtil,
    Valuelist } from 'idai-field-core';
import { ImageMetadata } from '../../../services/imagestore/file-metadata';
import { ImagesState } from '../overview/view/images-state';
import { AngularUtility } from '../../../angular/angular-utility';
import { Menus } from '../../../services/menus';
import { MenuContext } from '../../../services/menu-context';


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
    },
    standalone: false
})
export class ImageUploadMetadataModalComponent implements OnInit {

    public fileCount: number;
    public depictsRelationTarget: Document;

    public topLevelCategories: Array<CategoryForm>;
    public projectStaff: string[];
    public metadata: ImageMetadata;
    public isAerialLayerUpload: boolean = false;


    constructor(public activeModal: NgbActiveModal,
                private projectConfiguration: ProjectConfiguration,
                private imagesState: ImagesState,
                private datastore: Datastore,
                private labels: Labels,
                private menuService: Menus) {

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

    public hasAerialLayerSupport = () => this.projectConfiguration.getCategory('AerialMapLayer') !== undefined;


    ngOnInit() {
        
        AngularUtility.blurActiveElement();
    }


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.MODAL) {
            this.activeModal.dismiss('cancel');
        }
    }


    public setCategory(category: CategoryForm) {

        this.metadata.category = category.name;
    }


    public toggleAerialLayerUpload() {

        this.isAerialLayerUpload = !this.isAerialLayerUpload;
        if (this.isAerialLayerUpload) {
            if (this.hasAerialLayerSupport()) this.metadata.category = 'AerialMapLayer';
            this.metadata.aerialLayerType = this.metadata.aerialLayerType ?? 'orthomosaic';
            this.metadata.aerialLayerAccuracy = this.metadata.aerialLayerAccuracy ?? 'referenceOnly';
            this.metadata.aerialLayerOpacity = this.metadata.aerialLayerOpacity ?? 0.65;
        }
    }


    public setAerialLayerType(value: string) {

        this.metadata.aerialLayerType = value;
    }


    public setAerialLayerAccuracy(value: string) {

        this.metadata.aerialLayerAccuracy = value;
    }


    public setAerialLayerOpacity(value: string) {

        const parsed = parseFloat(value);
        this.metadata.aerialLayerOpacity = isNaN(parsed) ? undefined : Math.max(0, Math.min(1, parsed));
    }


    public getAerialLayerTypeOptions = () => this.getValuelistOptions('aerialLayerType');

    public getAerialLayerAccuracyOptions = () => this.getValuelistOptions('aerialLayerAccuracy');


    private getValuelistOptions(fieldName: string): { value: string, label: string }[] {

        const category: CategoryForm = this.projectConfiguration.getCategory(this.metadata.category)
            ?? this.projectConfiguration.getCategory('AerialMapLayer');
        const valuelist: Valuelist|undefined = CategoryForm.getField(category, fieldName)?.valuelist;

        if (!valuelist) return [];

        return (valuelist.order ?? Object.keys(valuelist.values)).map(value => ({
            value,
            label: this.labels.getValueLabel(valuelist, value)
        }));
    }


    public getParseFileMetadata(fieldName: string): boolean {

        return this.imagesState.getParseFileMetadata(fieldName);
    }


    public async toggleParseFileMetadata(fieldName: string) {
        
        await this.imagesState.setParseFileMetadata(
            fieldName,
            !this.getParseFileMetadata(fieldName)
        );
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

        const staffValuelist: Valuelist = ValuelistUtil.getValuelistFromProjectField(
            'staff',
            await this.datastore.get('project')
        );

        this.projectStaff = Object.keys(staffValuelist.values);
    }
}
