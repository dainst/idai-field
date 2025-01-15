import { Component, Input, Output, ElementRef, ViewChild, EventEmitter, OnChanges } from '@angular/core';
import { Document, Named, FieldDocument, Groups, ProjectConfiguration, Datastore, Hierarchy } from 'idai-field-core';


@Component({
    selector: 'document-info',
    templateUrl: './document-info.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class DocumentInfoComponent implements OnChanges {

    @ViewChild('documentInfo', { static: false }) documentInfoElement: ElementRef;

    @Input() document: Document;
    @Input() getExpandAllGroups: () => boolean;
    @Input() setExpandAllGroups: (expandAllGroups: boolean) => void;
    @Input() showThumbnail: boolean = false;
    @Input() showParent: boolean = false;
    @Input() showCloseButton: boolean = false;
    @Input() transparentBackground: boolean = false;

    @Output() onStartEdit: EventEmitter<void> = new EventEmitter<void>();
    @Output() onJumpToResource: EventEmitter<FieldDocument> = new EventEmitter<FieldDocument>();
    @Output() onThumbnailClicked: EventEmitter<void> = new EventEmitter<void>();
    @Output() onCloseButtonClicked: EventEmitter<void> = new EventEmitter<void>();
    @Output() onHeaderRightClicked: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();

    public openSection: string|undefined = Groups.STEM;
    public parentDocument: FieldDocument|undefined;


    constructor(private projectConfiguration: ProjectConfiguration,
                private datastore: Datastore) {}


    public startEdit = () => this.onStartEdit.emit();

    public jumpToResource = (document: FieldDocument) => this.onJumpToResource.emit(document);

    public close = () => this.onCloseButtonClicked.emit();

    public clickThumbnail = () => this.onThumbnailClicked.emit();

    public isReadonly = () => this.document.project !== undefined;


    async ngOnChanges() {

        this.parentDocument = this.document
            ? await this.getParentDocument()
            : undefined;
    }


    public toggleExpandAllGroups() {

        this.setExpandAllGroups(!this.getExpandAllGroups());
    }


    public setOpenSection(section: string) {

        this.openSection = section;
        this.setExpandAllGroups(false);
    }


    public isImageDocument() {

        return this.projectConfiguration.getImageCategories().map(Named.toName)
            .includes(this.document.resource.category);
    }


    public isThumbnailShown(): boolean {

        return this.showThumbnail && Document.hasRelations(this.document, 'isDepictedIn');
    }


    private async getParentDocument(): Promise<FieldDocument|undefined> {

        return await Hierarchy.getParentDocument(
            id => this.datastore.get(id),
            this.document
        ) as FieldDocument;
    }
}
