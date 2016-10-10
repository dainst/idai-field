import {Component, Input, OnChanges} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldGeometry} from "../../model/idai-field-geometry";
import {PersistenceManager, Messages, ConfigLoader} from "idai-components-2/idai-components-2";
import {M} from "../../m";
import {OverviewComponent} from "../../overview/overview.component";


@Component({
    selector: 'document-geometry-edit',
    moduleId: module.id,
    templateUrl: './document-geometry-edit.html'
})

/**
 * @author Thomas Kleinke
 */
export class DocumentGeometryEditComponent implements OnChanges {

    @Input() document: any;
    @Input() isEditing: boolean;

    private geometry: IdaiFieldGeometry;

    constructor(
            private router: Router,
            private persistenceManager: PersistenceManager,
            private messages: Messages,
            private configLoader: ConfigLoader,
            private overviewComponent: OverviewComponent) {

        this.configLoader.configuration().subscribe((result)=>{
            if (result.error == undefined) {
                this.persistenceManager.setRelationsConfiguration(result.relationsConfiguration);
            } else {
                // TODO Meldung geben/zeigen wenn es ein Problem mit der Configuration gibt
            }
        });
    }

    ngOnChanges() {

        if (!this.document.resource.geometries || this.document.resource.geometries.length == 0) {
            this.geometry = undefined;
        } else {
            this.geometry = this.document.resource.geometries[0];
        }
    }

    public createGeometry(geometryType) {

        this.router.navigate(['resources/editGeometry', this.document.resource.id, geometryType, {menuMode:'geometryEdit'}]);
    } 
    
    public editGeometry() {

        this.router.navigate(['resources/editGeometry', this.document.resource.id, 'existing', {menuMode:'geometryEdit'}]);
    }
    
    public deleteGeometry() {
        
        this.document.resource.geometries = [];
        this.save();
    }

    private save() {

        this.persistenceManager.setOldVersion(this.document);

        this.persistenceManager.persist(this.document).then(
            () => {
                this.document['synced'] = 0;
                this.messages.add(M.OVERVIEW_SAVE_SUCCESS);
            },
            errors => { console.log(errors); });
    }

    private cancel() {

        this.router.navigate(['resources/', {id:this.document.resource.id,menuMode:'geometryEdit'}]);
    }
}