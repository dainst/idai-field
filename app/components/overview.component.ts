import {Component, OnInit, Inject, Input, OnChanges, Output, EventEmitter, ChangeDetectorRef, ViewChild} from 'angular2/core';
import {Datastore} from '../datastore/datastore';
import {IdaiFieldObject} from '../model/idai-field-object';
import {ObjectEditComponent} from "./object-edit.component";
import {ObjectList} from "../services/object-list";
import {ProjectConfiguration} from "../model/project-configuration";
import {Http} from "angular2/http";
import {Messages} from "../services/messages";
import {ConfigLoader} from "../services/config-loader";
import {M} from "../m";
import {MODAL_DIRECTIVES, ModalComponent} from 'ng2-bs3-modal/ng2-bs3-modal';

@Component({
    templateUrl: 'templates/overview.html',
    directives: [ObjectEditComponent, MODAL_DIRECTIVES],
    providers: [ObjectList]
})

/**
 * @author Sebastian Cuy
 * @author Daniel M. de Oliveira
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class OverviewComponent implements OnInit {

    @ViewChild('modal')
    modal: ModalComponent;

    /**
     * The object currently selected in the list and shown in the edit component.
     */
    private selectedObject: IdaiFieldObject;
    private projectConfiguration: ProjectConfiguration;
    private callback;

    constructor(private datastore: Datastore,
        @Inject('app.config') private config,
        private objectList: ObjectList,
        private configLoader: ConfigLoader,
        private messages: Messages) {

        // console.log("h")
    }

    private askForPermissionForChange(object) {
        this.messages.delete(M.OBJLIST_IDEXISTS);
        this.messages.delete(M.OBJLIST_IDMISSING);
        this.messages.delete(M.OBJLIST_SAVE_SUCCESS);

        // Remove object from list if it is new and no data has been entered
        if (object && (!object.type || (!this.selectedObject.id && !this.objectList.isChanged(this.selectedObject)))) {
            this.objectList.setChanged(object);
            return this.discardChanges();
        }

        if (!object || !this.objectList.isChanged(this.selectedObject)) return this.callback();

        this.modal.open();
    }

    public save() {
        this.objectList.persistChangedObjects().then(()=> {
            this.callback();
        }, (err) => {
            this.messages.add(err, 'danger');
        });
    }

    public discardChanges() {
        this.objectList.restoreChangedObjects().then(() => {
            this.callback();
        }, (err) => {
            this.messages.add(err, 'danger');
        });
    }
    
    public onSelect(object: IdaiFieldObject) {
        if (object == this.selectedObject) return;
        this.callback = function() {
            this.datastore.get(object.id).then(
                (obj) => this.selectedObject = obj,
                (err) => console.error(err)
            );
        }.bind(this);
        this.askForPermissionForChange(this.selectedObject);
    }

    public onCreate() {
        this.callback = function() {
            var newObject = {};
            this.objectList.getObjects().unshift(newObject);
            this.selectedObject = <IdaiFieldObject> newObject;
        }.bind(this);
        this.askForPermissionForChange(this.selectedObject);
    }

    public ngOnInit() {
        this.configLoader.getProjectConfiguration().then((dmc)=>{
            this.projectConfiguration=dmc;
            if (this.config.environment == "test") {
                setTimeout(() => this.fetchObjects(), 500);
            } else {
                this.fetchObjects();
            }
        });
    }

    onKey(event:any) {

        if (event.target.value == "") {
            this.datastore.all({}).then(objects => {
                this.objectList.setObjects(objects);
            }).catch(err => console.error(err));
        } else {
            this.datastore.find(event.target.value, {}).then(objects => {
                this.objectList.setObjects(objects);
            }).catch(err => console.error(err));
        }
    }

    private fetchObjects() {

        this.datastore.all({}).then(objects => {
            this.objectList.setObjects(objects);
        }).catch(err => console.error(err));
    }
}
