import { Component, Input } from '@angular/core';
import { WorkflowStepDocument } from 'idai-field-core';
import { Routing } from '../../../services/routing';


@Component({
    selector: 'workflow-overview',
    templateUrl: './workflow-overview.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class WorkflowOverviewComponent {

    @Input() documents: Array<WorkflowStepDocument>;
    @Input() selectedDocument: WorkflowStepDocument;


    constructor(private routingService: Routing) {}


    public jumpToResource = (document: WorkflowStepDocument) => this.routingService.jumpToResource(document);   
}
