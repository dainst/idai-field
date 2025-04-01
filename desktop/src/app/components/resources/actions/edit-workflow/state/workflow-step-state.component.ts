import { Component, Input } from '@angular/core';
import { Document } from 'idai-field-core';


@Component({
    selector: 'workflow-step-state',
    templateUrl: './workflow-step-state.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class WorkflowStepStateComponent {

    @Input() workflowStep: Document;


    constructor() {}


    public getState = () => this.workflowStep.resource.state;
}
