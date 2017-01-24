import {Component, Input} from "@angular/core";
import {ConfigLoader, WithConfiguration} from "idai-components-2/configuration"
import {PersistenceManager} from "idai-components-2/persist"
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
        private configLoader: ConfigLoader
    ) {
        super(configLoader);
    }

    public onSelectFile(event) {

        var files = event.target.files;
        if (files && files.length > 0) {
            this.importWorldFile(files[0]);
        }
    }

    private importWorldFile(file) {

        var reader = new FileReader();
        reader.onloadend = (that => {
            return () => {
                var worldfileContent = reader.result.split("\n");
                this.document.resource.georeference = this.createGeoreference(worldfileContent);
                this.save();
            }
        })(this);
        reader.onerror = (that => {
            return (err) => {
                that.onUploadError.emit([M.IMAGES_ERROR_FILEREADER, file.name]);
            }
        })(this);
        reader.readAsText(file);
    }

    private createGeoreference(worldfileContent): IdaiFieldGeoreference {

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

    private computeLatLng(imageX, imageY, worldfileContent): [number, number] {

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