import {Component, Input, Output, ElementRef, ViewChild, EventEmitter, DoCheck} from '@angular/core';
import {Document, FieldDocument} from 'idai-components-2';
import {ProjectTypes} from '../../../core/configuration/project-types';
import {Groups} from '../../../core/configuration/model/group';


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
    @Input() showThumbnail: boolean = false;

    @Output() onStartEdit: EventEmitter<void> = new EventEmitter<void>();
    @Output() onJumpToResource: EventEmitter<FieldDocument> = new EventEmitter<FieldDocument>();
    @Output() onThumbnailClicked: EventEmitter<void> = new EventEmitter<void>();

    public scrollbarVisible: boolean = false;
    public openSection: string|undefined = Groups.STEM;


    constructor(private projectTypes: ProjectTypes) {}


    public startEdit = () => this.onStartEdit.emit();

    public jumpToResource = (document: FieldDocument) => this.onJumpToResource.emit(document);

    public clickThumbnail = () => this.onThumbnailClicked.emit();


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


    public isThumbnailShown(): boolean {

        return this.showThumbnail && Document.hasRelations(this.document, 'isDepictedIn');
    }


    private static isScrollbarVisible(element: ElementRef): boolean {

        return element && element.nativeElement.scrollHeight > element.nativeElement.clientHeight;
    }
}
