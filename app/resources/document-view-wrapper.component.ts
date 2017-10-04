import {Component, Input} from '@angular/core';
import {ResourcesComponent} from './resources.component';
import {PersistenceManager} from 'idai-components-2/persist';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Messages} from 'idai-components-2/messages';
import {SettingsService} from '../settings/settings-service';
import {Loading} from '../widgets/loading';
import {ObjectUtil} from '../util/object-util';

@Component({
    selector: 'document-view-wrapper',
    moduleId: module.id,
    templateUrl: './document-view-wrapper.html'
})

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class DocumentViewWrapperComponent {

    @Input() activeTab;
    @Input() selectedDocument: IdaiFieldDocument;
    @Input() isEditing: boolean = false;

    constructor(public resourcesComponent: ResourcesComponent) { }

    public hasRelations() {

        const relations: any = this.selectedDocument.resource.relations;

        if (ObjectUtil.isEmpty(relations)) return false;

        // TODO Check relation definition for visibility
        if (Object.keys(relations).length == 1
            && relations['isRecordedIn']
            && relations['isRecordedIn'].length == 1
            && relations['isRecordedIn'][0]
            == this.resourcesComponent.projectDocument.resource.id) {
            return false;
        }

        return true;
    }
}