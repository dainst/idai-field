import {Component, Input, ViewChild, ElementRef} from '@angular/core';
import {Messages} from 'idai-components-2/messages';
import {M} from '../../m';
import {IdaiFieldGeoreference} from '../../core/model/idai-field-georeference';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {SettingsService} from '../../core/settings/settings-service';
import {PersistenceManager} from "../../core/persist/persistence-manager";


@Component({
    selector: 'georeference-view',
    moduleId: module.id,
    templateUrl: './georeference-view.html'
})
/**
 * @author Thomas Kleinke
 */
export class GeoreferenceViewComponent {

    @Input() document: any;

    @ViewChild('worldfileInput') worldfileInput: ElementRef;


    constructor(
        private persistenceManager: PersistenceManager,
        private messages: Messages,
        private modalService: NgbModal,
        private settingsService: SettingsService
    ) {}


    public onSelectFile(event: any) {

        const files = event.target.files;
        if (files && files.length > 0) {
            this.readFile(files[0]);
        }
    }


    public openDeleteModal(modal: any) {

        this.modalService.open(modal).result.then(result => {
            if (result == 'delete') this.deleteGeoreference();
        });
    }


    private readFile(file: File) {

        const reader = new FileReader();
        reader.onloadend = (that => {
            return () => {
                this.worldfileInput.nativeElement.value = '';
                const worldfileContent = reader.result.split("\n");
                that.importWorldfile(worldfileContent, file);
            }
        })(this);
        reader.onerror = (that => {
            return () => {
                that.messages.add([M.IMAGES_ERROR_FILEREADER, file.name]);
            }
        })(this);
        reader.readAsText(file);
    }


    private importWorldfile(worldfileContent: string[], file: File) {

        worldfileContent = GeoreferenceViewComponent.removeEmptyLines(worldfileContent);
        if (GeoreferenceViewComponent.worldFileContentIsValid(worldfileContent)) {
            this.document.resource.georeference = this.createGeoreference(worldfileContent);
            this.save().then(
                () => this.messages.add([M.IMAGES_SUCCESS_WORLDFILE_UPLOADED]),
                msgWithParams => this.messages.add(msgWithParams));
        } else {
            this.messages.add([M.IMAGESTORE_ERROR_INVALID_WORLDFILE, file.name]);
        }
    }


    private createGeoreference(worldfileContent: string[]): IdaiFieldGeoreference {

        const width: number = parseInt(this.document.resource.width);
        const height: number = parseInt(this.document.resource.height);

        const topLeftCoordinates: [number, number] = GeoreferenceViewComponent.computeLatLng(0, 0, worldfileContent);
        const topRightCoordinates: [number, number] = GeoreferenceViewComponent.computeLatLng(width - 1, 0, worldfileContent);
        const bottomLeftCoordinates: [number, number] = GeoreferenceViewComponent.computeLatLng(0, height - 1, worldfileContent);

        return {
            topLeftCoordinates: topLeftCoordinates,
            topRightCoordinates: topRightCoordinates,
            bottomLeftCoordinates: bottomLeftCoordinates
        };
    }


    private deleteGeoreference() {

        this.document.resource.georeference = undefined;

        this.save().then(
            () => this.messages.add([M.IMAGES_SUCCESS_GEOREFERENCE_DELETED]),
            msgWithParams => this.messages.add(msgWithParams));
    }


    private save(): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            this.persistenceManager.setOldVersions([this.document]);

            this.persistenceManager.persist(this.document, this.settingsService.getUsername()).then(
                () => { resolve(); },
                err => { console.error(err); reject([M.APP_GENERIC_SAVE_ERROR]); }
            );
        });
    }


    private static removeEmptyLines(worldfileContent: string[]): string[] {

        const result: string[] = [];

        for (let i in worldfileContent) {
            if (worldfileContent[i].length > 0) {
                result.push(worldfileContent[i]);
            }
        }

        return result;
    }


    private static worldFileContentIsValid(worldfileContent: string[]): boolean {

        if (worldfileContent.length != 6) {
            return false;
        }

        for (let i in worldfileContent) {
            const number = parseFloat(worldfileContent[i]);
            if (isNaN(number)) return false;
        }

        return true;
    }


    private static computeLatLng(imageX: number, imageY: number, worldfileContent: string[]): [number, number] {

        const latPosition: number = parseFloat(worldfileContent[3]) * imageY;
        const latRotation: number = parseFloat(worldfileContent[1]) * imageX;
        const latTranslation: number = parseFloat(worldfileContent[5]);
        const lat: number = latPosition + latRotation + latTranslation;

        const lngPosition: number = parseFloat(worldfileContent[0]) * imageX;
        const lngRotation: number = parseFloat(worldfileContent[2]) * imageY;
        const lngTranslation: number = parseFloat(worldfileContent[4]);
        const lng: number = lngPosition + lngRotation + lngTranslation;

        return [ lat, lng ];
    }
}