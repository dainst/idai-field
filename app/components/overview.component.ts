import {Component, OnInit, Inject, Input, OnChanges, Output, EventEmitter, ChangeDetectorRef, ViewChild} from '@angular/core';
import {Datastore} from '../datastore/datastore';
import {IdaiFieldObject} from '../model/idai-field-object';
import {ObjectEditComponent} from "./object-edit.component";
import {PersistenceManager} from "../services/persistence-manager";
import {ProjectConfiguration} from "../model/project-configuration";
import {Project} from "../model/project";
import {Messages} from "../services/messages";
import {ConfigLoader} from "../services/config-loader";
import {MODAL_DIRECTIVES, ModalComponent} from 'ng2-bs3-modal/ng2-bs3-modal';

@Component({
    templateUrl: 'templates/overview.html',
    directives: [ObjectEditComponent, MODAL_DIRECTIVES],
    providers: [PersistenceManager]
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
        private persistenceManager: PersistenceManager,
        private project: Project,
        private configLoader: ConfigLoader,
        private messages: Messages) {
    }

    private askForPermissionForChange(object) {
        this.messages.clear();

        // Remove object from list if it is new and no data has been entered
        if (object && (!object.type || (!this.selectedObject.id && !this.persistenceManager.isChanged(this.selectedObject)))) {
            this.persistenceManager.setChanged(object);
            return this.discardChanges();
        }

        if (!object || !this.persistenceManager.isChanged(this.selectedObject)) return this.callback();

        this.modal.open();
    }

    public save() {
        this.persistenceManager.persistChangedObjects().then(()=> {
            this.callback();
        }, (err) => {
            this.messages.add(err);
        });
    }

    public discardChanges() {
        this.persistenceManager.restoreChangedObjects().then(() => {
            this.callback();
        }, (err) => {
            this.messages.add(err);
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
            this.project.getObjects().unshift(newObject);
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
                this.project.setObjects(objects);
            }).catch(err => console.error(err));
        } else {
            this.datastore.find(event.target.value, {}).then(objects => {
                this.project.setObjects(objects);
            }).catch(err => console.error(err));
        }
    }

    private fetchObjects() {

        this.datastore.all({}).then(objects => {
            this.project.setObjects(objects);
        }).catch(err => console.error(err));
    }
}
