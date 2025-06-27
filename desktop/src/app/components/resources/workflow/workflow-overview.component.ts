import { Component, Input } from '@angular/core';
import { WorkflowStepDocument } from 'idai-field-core';
import { Routing } from '../../../services/routing';
import { BaseList } from '../base-list';
import { ViewFacade } from '../view/view-facade';
import { Loading } from '../../widgets/loading';
import { Menus } from '../../../services/menus';


@Component({
    selector: 'workflow-overview',
    templateUrl: './workflow-overview.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class WorkflowOverviewComponent extends BaseList {

    @Input() documents: Array<WorkflowStepDocument>;
    @Input() selectedDocument: WorkflowStepDocument;


    constructor(private routingService: Routing,
                viewFacade: ViewFacade,
                loading: Loading,
                menuService: Menus) {
        
        super(viewFacade, loading, menuService);
    }


    public jumpToResource = (document: WorkflowStepDocument) => this.routingService.jumpToResource(document);

    public populateDocumentList = () => this.viewFacade.populateDocumentList();


    public getCurrentFilterCategory(): string {

        const categoryName: string = super.getCurrentFilterCategory();

        return categoryName !== 'WorkflowStep'
            ? categoryName
            : undefined;
    }
}
