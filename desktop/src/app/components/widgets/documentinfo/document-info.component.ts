import {
    Component,
    Input,
    Output,
    ElementRef,
    ViewChild,
    EventEmitter,
    OnChanges,
} from '@angular/core';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SettingsProvider } from '../../../services/settings/settings-provider';
import {
    Document,
    Named,
    FieldDocument,
    Groups,
    ProjectConfiguration,
    Datastore,
    Hierarchy
} from 'idai-field-core';
import { QrCodeModalComponent } from './qrcode-modal';
import { Menus } from '../../../services/menus';
import { MenuContext} from '../../../services/menu-context';

@Component({
    selector: 'document-info',
    templateUrl: './document-info.html'
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
    @Output() onJumpToResource: EventEmitter<FieldDocument> =
        new EventEmitter<FieldDocument>();
    @Output() onThumbnailClicked: EventEmitter<void> = new EventEmitter<void>();
    @Output() onCloseButtonClicked: EventEmitter<void> =
        new EventEmitter<void>();

    public openSection: string | undefined = Groups.STEM;
    public parentDocument: FieldDocument | undefined;
    public project: string;

    constructor(
        private projectConfiguration: ProjectConfiguration,
        private datastore: Datastore,
        private settingsProvider: SettingsProvider,
        private menus: Menus,
        private modalService: NgbModal
    ) {
        this.project = this.settingsProvider.getSettings().selectedProject;
    }

    public startEdit = () => this.onStartEdit.emit();

    public jumpToResource = (document: FieldDocument) =>
        this.onJumpToResource.emit(document);

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
        return this.projectConfiguration
            .getImageCategories()
            .map(Named.toName)
            .includes(this.document.resource.category);
    }

    public isThumbnailShown(): boolean {
        return (
            this.showThumbnail &&
            Document.hasRelations(this.document, 'isDepictedIn')
        );
    }

    private async getParentDocument(): Promise<FieldDocument | undefined> {
        return (await Hierarchy.getParentDocument(
            (id) => this.datastore.get(id),
            this.document
        )) as FieldDocument;
    }

    public async openQRCodeModal() {

        try {
            this.menus.setContext(MenuContext.MODAL);

            const modalRef: NgbModalRef = this.modalService.open(
                QrCodeModalComponent, { animation: false, backdrop: 'static' }
            );
            
            modalRef.componentInstance.project = this.project;
            modalRef.componentInstance.documentId = this.document._id;
            modalRef.componentInstance.identifier = this.document.resource.identifier;

            modalRef.componentInstance.render();
            return true;
        } catch (_) {
            return false;
        } finally {
            this.menus.setContext(MenuContext.DEFAULT);
        }
    }
}
