import {Component, OnInit, AfterViewChecked, OnDestroy, Input} from '@angular/core';
import {ResourcesComponent} from './resources.component';
import {PersistenceManager} from 'idai-components-2/persist';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {SettingsService} from '../settings/settings-service';

@Component({
    selector: 'map-wrapper',
    moduleId: module.id,
    templateUrl: './map-wrapper.html'
})

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class MapWrapperComponent implements OnInit, AfterViewChecked, OnDestroy {

    @Input() activeDoc: IdaiFieldDocument;
    @Input() editMode: boolean = false;
    @Input() scrollTarget: IdaiFieldDocument;

    private docs: IdaiFieldDocument[];

    constructor(
        private resourcesComponent: ResourcesComponent,
        private persistenceManager: PersistenceManager,
        private settingsService: SettingsService
    ) { }

    ngOnInit(): void {

        this.resourcesComponent.getDocuments().subscribe(result => {
           this.docs = result as IdaiFieldDocument[];
        });
    }

    ngAfterViewChecked() {

        if (this.scrollTarget) {
            this.scrollToDocument(this.scrollTarget);
            this.scrollTarget = undefined;
        }
    }

    ngOnDestroy(): void {
        this.removeEmptyDocument();
    }

    private selectedDocIsNew(): boolean {
        return (this.resourcesComponent.getSelected().resource.id == undefined);
    }

    public select(document: IdaiFieldDocument) {

        this.resourcesComponent.select(document);
        this.scrollTarget = document;
    }

    /**
     * @param geometry
     *   <code>null</code> indicates geometry should get deleted.
     *   <code>undefined</code> indicates editing operation aborted.
     */
    public quitEditing(geometry: IdaiFieldGeometry) {

        let selectedDoc = this.resourcesComponent.getSelected();
        if (geometry) {
            selectedDoc.resource.geometry = geometry;
        } else if (geometry === null) { 
            delete selectedDoc.resource.geometry;
        }

        if (this.selectedDocIsNew()) {
            if (geometry !== undefined) {
                this.resourcesComponent.editDocument();
            } else {
                this.resourcesComponent.endEditGeometry();
                this.removeEmptyDocument();
            }
        } else {
            this.resourcesComponent.endEditGeometry();
            if (geometry !== undefined) this.save();
        }
    }

    private removeEmptyDocument() {

        var selectedDocument = this.resourcesComponent.getSelected();
        if (selectedDocument && !selectedDocument.resource.id && !selectedDocument.resource.geometry) {
            this.resourcesComponent.remove(selectedDocument);
        }
    }

    private save() {

        this.persistenceManager.setOldVersions([this.resourcesComponent.getSelected()]);
        this.persistenceManager.persist(this.resourcesComponent.getSelected(), this.settingsService.getUsername()).then(
            () => {
                this.resourcesComponent.getSelected()['synced'] = 0;
            }, err => { console.log(err); });
    }

    private scrollToDocument(doc: IdaiFieldDocument) {

        let element = document.getElementById('resource-' + doc.resource.identifier);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    }

}
