import {Component, OnInit, Inject, Input, OnChanges, Output, EventEmitter, ChangeDetectorRef, ViewChild} from '@angular/core';
import {Datastore} from 'idai-components-2/idai-components-2';
import {IdaiFieldObject} from '../model/idai-field-object';
import {ObjectEditComponent} from "idai-components-2/idai-components-2";
import {AppComponent} from "../components/app.component";
import {PersistenceManager} from "idai-components-2/idai-components-2";
import {Project} from "../model/project";
import {Messages} from "idai-components-2/idai-components-2";
import {ConfigLoader} from "idai-components-2/idai-components-2";
import {LoadAndSaveService} from "idai-components-2/idai-components-2";
import {MODAL_DIRECTIVES, ModalComponent} from 'ng2-bs3-modal/ng2-bs3-modal';

@Component({
    templateUrl: 'templates/overview.html',
    directives: [ObjectEditComponent, MODAL_DIRECTIVES],
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
    private callback;

    constructor(private datastore: Datastore,
        @Inject('app.config') private config,
        private persistenceManager: PersistenceManager,
        private project: Project,
        private configLoader: ConfigLoader,
        private messages: Messages,
        private loadAndSaveService:LoadAndSaveService) {
    }

    private askForPermissionForChange(object) {
        this.messages.clear();

        console.log("ask permission for ",object)

        // Remove object from list if it is new and no data has been entered
        if (object && (!object.type || (!this.selectedObject.id && !this.persistenceManager.isLoaded()))) {
            this.persistenceManager.load(object);
            return this.discardChanges();
        }

        if (!object || !this.persistenceManager.isLoaded()) return this.callback();

        this.modal.open();
    }

    public save(object) {
        this.loadAndSaveService.save(object).then(()=>true);
    }

    public discardChanges() {

        this.project.restore(this.selectedObject).then(() => {
            this.persistenceManager.unload();
            this.callback();
        }, (err) => {
            this.messages.add(err);
        });
    }

    private setConfigs() {
        this.configLoader.setProjectConfiguration(AppComponent.PROJECT_CONFIGURATION_PATH);
        this.configLoader.setRelationsConfiguration(AppComponent.RELATIONS_CONFIGURATION_PATH);
    }

    public onSelect(object: IdaiFieldObject) {
        this.setConfigs();

        if (object == this.selectedObject) return;
        this.callback = function() {
            this.datastore.refresh(object.id).then(
                (obj) => this.selectedObject = obj,
                (err) => console.error(err)
            );
        }.bind(this);
        this.askForPermissionForChange(this.selectedObject);
    }

    public onCreate() {
        this.setConfigs();

        this.callback = function() {
            var newObject = {};
            this.project.getObjects().unshift(newObject);
            this.selectedObject = <IdaiFieldObject> newObject;
        }.bind(this);
        this.askForPermissionForChange(this.selectedObject);
    }

    public ngOnInit() {
        if (this.config.environment == "test") {
            setTimeout(() => this.fetchObjects(), 500);
        } else {
            this.fetchObjects();
        }
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
