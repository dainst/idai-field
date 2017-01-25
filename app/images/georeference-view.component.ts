import {Component, Input} from "@angular/core";
import {ConfigLoader, WithConfiguration} from "idai-components-2/configuration";
import {PersistenceManager} from "idai-components-2/persist";
import {Messages} from "idai-components-2/messages";
import {M} from "../m";
import {IdaiFieldGeoreference} from "../model/idai-field-georeference";


@Component({
    selector: 'georeference-view',
    moduleId: module.id,
    templateUrl: './georeference-view.html'
})

/**
 * @author Thomas Kleinke
 */
export class GeoreferenceViewComponent extends WithConfiguration {

    @Input() document: any;

    constructor(
        private persistenceManager: PersistenceManager,
        private configLoader: ConfigLoader,
        private messages: Messages
    ) {
        super(configLoader);
    }

    public onSelectFile(event) {

        var files = event.target.files;
        if (files && files.length > 0) {
            this.readFile(files[0]);
        }
    }

    private readFile(file: File) {

        var reader = new FileReader();
        reader.onloadend = (that => {
            return () => {
                var worldfileContent = reader.result.split("\n");
                that.importWorldfile(worldfileContent, file);
            }
        })(this);
        reader.onerror = (that => {
            return (err) => {
                that.messages.addWithParams([M.IMAGES_ERROR_FILEREADER, file.name]);
            }
        })(this);
        reader.readAsText(file);
    }

    private importWorldfile(worldfileContent: string[], file: File) {

        worldfileContent = this.removeEmptyLines(worldfileContent);
        if (this.worldFileContentIsValid(worldfileContent)) {
            this.document.resource.georeference = this.createGeoreference(worldfileContent);
            this.save();
        } else {
            this.messages.addWithParams([M.IMAGES_ERROR_INVALID_WORLDFILE, file.name]);
        }
    }

    private removeEmptyLines(worldfileContent: string[]): string[] {

        var result: string[] = [];

        for (let i in worldfileContent) {
            if (worldfileContent[i].length > 0) {
                result.push(worldfileContent[i]);
            }
        }

        return result;
    }

    private worldFileContentIsValid(worldfileContent: string[]): boolean {

        if (worldfileContent.length != 6) {
            return false;
        }

        for (let i in worldfileContent) {
            var number = parseFloat(worldfileContent[i]);
            if (isNaN(number)) return false;
        }

        return true;
    }

    private createGeoreference(worldfileContent: string[]): IdaiFieldGeoreference {

        var width: number = parseInt(this.document.resource.width);
        var height: number = parseInt(this.document.resource.height);

        var topLeftCoordinates: [number, number] = this.computeLatLng(0, 0, worldfileContent);
        var topRightCoordinates: [number, number] = this.computeLatLng(width - 1, 0, worldfileContent);
        var bottomLeftCoordinates: [number, number] = this.computeLatLng(0, height - 1, worldfileContent);

        var georeference: IdaiFieldGeoreference = {
            topLeftCoordinates: topLeftCoordinates,
            topRightCoordinates: topRightCoordinates,
            bottomLeftCoordinates: bottomLeftCoordinates
        };

        return georeference;
        
    }

    private computeLatLng(imageX: number, imageY: number, worldfileContent: string[]): [number, number] {

        var latPosition: number = parseFloat(worldfileContent[3]) * imageY;
        var latRotation: number = parseFloat(worldfileContent[1]) * imageX;
        var latTranslation: number = parseFloat(worldfileContent[5]);
        var lat: number = latPosition + latRotation + latTranslation;

        var lngPosition: number = parseFloat(worldfileContent[0]) * imageX;
        var lngRotation: number = parseFloat(worldfileContent[2]) * imageY;
        var lngTranslation: number = parseFloat(worldfileContent[4]);
        var lng: number = lngPosition + lngRotation + lngTranslation;

        return [ lat, lng ];
    }

    private save() {

        this.persistenceManager.setProjectConfiguration(this.projectConfiguration);
        this.persistenceManager.setOldVersion(this.document);

        this.persistenceManager.persist(this.document).then(
            () => {},
            errors => { console.log(errors); }
        );
    }

}