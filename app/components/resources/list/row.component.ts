import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Messages} from 'idai-components-2/messages';
import {IdaiType} from 'idai-components-2/configuration';
import {M} from '../../../m';
import {SettingsService} from '../../../core/settings/settings-service';
import {ResourcesComponent} from '../resources.component';
import {ViewFacade} from '../state/view-facade';
import {PersistenceManager} from '../../../core/persist/persistence-manager';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/idai-field-document-read-datastore';
import {NavigationService} from '../navigation/navigation-service';
import {Validator} from '../../../core/model/validator';


const RETURN_KEY = 13;


@Component({
    selector: 'row',
    moduleId: module.id,
    templateUrl: './row.html'
})
/**
 * @author Fabian Z.
 * @autor Thomas Kleinke
 */
export class RowComponent implements AfterViewInit {

    @Input() document: IdaiFieldDocument;
    @Input() typesMap: { [type: string]: IdaiType };

    @ViewChild('identifierInput') identifierInput: ElementRef;

    private initialValueOfCurrentlyEditedField: string|undefined;


    constructor(
        public resourcesComponent: ResourcesComponent,
        public viewFacade: ViewFacade,
        private messages: Messages,
        private persistenceManager: PersistenceManager,
        private settingsService: SettingsService,
        private validator: Validator,
        private datastore: IdaiFieldDocumentReadDatastore,
        private navigationService: NavigationService
    ) {}


    ngAfterViewInit = () => this.focusIdentifierInputIfDocumentIsNew();

    public editDocument = () => this.resourcesComponent.editDocument(this.document);

    public startEditing = (fieldValue: string) => this.initialValueOfCurrentlyEditedField = fieldValue;

    public showMoveIntoOption = () => this.navigationService.showMoveIntoOption(this.document);

    public moveInto = () => this.navigationService.moveInto(this.document);

    public getLabel = () => this.typesMap[this.document.resource.type].label;

    public makeId = () => this.document.resource.id ? 'resource-' + this.document.resource.identifier : 'new-resource';


    public stopEditing(fieldValue: string) {

        if (this.initialValueOfCurrentlyEditedField != fieldValue) this.save();
        this.initialValueOfCurrentlyEditedField = fieldValue;
    }


    public onKeyup(event: KeyboardEvent, fieldValue: string) {

        if (event.keyCode == RETURN_KEY) this.stopEditing(fieldValue);
    }


    private async save() {

        const oldVersion = JSON.parse(JSON.stringify(this.document));

        try {
            await this.validator.validate(this.document);
        } catch(msgWithParams) {
            this.messages.add(msgWithParams);
            return this.restoreIdentifier(this.document);
        }

        try {
            await this.persistenceManager.persist(this.document, this.settingsService.getUsername(),
                [oldVersion]);
            this.messages.add([M.DOCEDIT_SAVE_SUCCESS]);
        } catch(msgWithParams) {
            return this.messages.add(msgWithParams);
        }

        if (!oldVersion.resource.id) await this.viewFacade.populateDocumentList();
    }


    private async restoreIdentifier(document: IdaiFieldDocument): Promise<any> {

        try {
            document.resource.identifier =
                (await this.datastore.get(document.resource.id as any, {skip_cache: true})
                ).resource.identifier;
        } catch(_) {
            return [M.DATASTORE_NOT_FOUND];
        }
    }


    private focusIdentifierInputIfDocumentIsNew() {

        if (!this.document.resource.identifier) this.identifierInput.nativeElement.focus();
    }
}