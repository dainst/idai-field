import { AfterViewInit, Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { SortMode, ProcessDocument } from 'idai-field-core';
import { Routing } from '../../../services/routing';
import { BaseList } from '../base-list';
import { ViewFacade } from '../view/view-facade';
import { Loading } from '../../widgets/loading';
import { Menus } from '../../../services/menus';
import { ProcessListComponent } from './process-list.component';


@Component({
    selector: 'workflow-overview',
    templateUrl: './workflow-overview.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class WorkflowOverviewComponent extends BaseList implements AfterViewInit, OnChanges {

    @Input() documents: Array<ProcessDocument>;
    @Input() selectedDocument: ProcessDocument;

    @ViewChild(ProcessListComponent) processListComponent: ProcessListComponent;


    constructor(private routingService: Routing,
                viewFacade: ViewFacade,
                loading: Loading,
                menuService: Menus) {
        
        super(viewFacade, loading, menuService);
    }


    public jumpToResource = (document: ProcessDocument) => this.routingService.jumpToResource(document);

    public getSortMode = () => this.viewFacade.getSortMode();

    public setSortMode = (sortMode: SortMode) => this.viewFacade.setSortMode(sortMode);


    ngAfterViewInit() {

        this.scrollViewport = this.processListComponent.scrollViewport;
    }


    ngOnChanges(changes: SimpleChanges) {
    
        if (changes['selectedDocument']) this.scrollTo(this.selectedDocument);
    }


    public async onChanged(editedProcess?: ProcessDocument) {

        if (editedProcess) this.scrollTo(editedProcess);
        await this.viewFacade.populateDocumentList();
    }


    public getCurrentFilterCategory(): string {

        const categoryName: string = super.getCurrentFilterCategory();

        return categoryName !== 'Process'
            ? categoryName
            : undefined;
    }
}
