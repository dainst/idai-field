import {Component, EventEmitter, Input, Output} from "@angular/core";
import {Filter} from "idai-components-2/datastore";
import {IdaiFieldDocument} from "../model/idai-field-document";

@Component({
    selector: 'document-picker',
    moduleId: module.id,
    templateUrl: './document-picker.html'
})
export class DocumentPickerComponent {

    @Input() filters: Array<Filter>;
    @Output() documentSelected: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();
    
}