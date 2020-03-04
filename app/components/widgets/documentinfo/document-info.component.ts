import {Component, Input, Output, ElementRef, ViewChild, EventEmitter, DoCheck} from '@angular/core';
import {Document, FieldDocument} from 'idai-components-2';
import {ProjectTypes} from '../../../core/configuration/project-types';


@Component({
    moduleId: module.id,
    selector: 'document-info',
    templateUrl: './document-info.html'
})
/**
 * @author Thomas Kleinke
 */
export class DocumentInfoComponent implements DoCheck {

    @ViewChild('documentInfo', { static: false }) documentInfoElement: ElementRef;

    @Input() document: Document;
    @Input() getExpandAllGroups: () => boolean;
    @Input() setExpandAllGroups: (expandAllGroups: boolean) => void;

    @Output() onStartEdit: EventEmitter<void> = new EventEmitter<void>();
    @Output() onJumpToResource: EventEmitter<FieldDocument> = new EventEmitter<FieldDocument>();

    public scrollbarVisible: boolean = false;
    public openSection: string|undefined = 'stem';


    constructor(private projectTypes: ProjectTypes) {}


    public startEdit = () => this.onStartEdit.emit();

    public jumpToResource = (document: FieldDocument) => this.onJumpToResource.emit(document);


    ngDoCheck() {

        this.scrollbarVisible = DocumentInfoComponent.isScrollbarVisible(this.documentInfoElement);
    }


    public toggleExpandAllGroups() {

        this.setExpandAllGroups(!this.getExpandAllGroups());
    }


    public setOpenSection(section: string) {

        this.openSection = section;
        this.setExpandAllGroups(false);
    }


    public isImageDocument() {

        return this.projectTypes.getImageTypeNames().includes(this.document.resource.type);
    }


    private static isScrollbarVisible(element: ElementRef): boolean {

        return element && element.nativeElement.scrollHeight > element.nativeElement.clientHeight;
    }
}
