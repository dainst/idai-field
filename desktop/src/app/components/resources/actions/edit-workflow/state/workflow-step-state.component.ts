import { Map } from 'tsfun';
import { Component, Input, OnInit } from '@angular/core';
import { CategoryForm, Datastore, Field, Labels, ProjectConfiguration, Valuelist,
    WorkflowStepDocument } from 'idai-field-core';


@Component({
    selector: 'workflow-step-state',
    templateUrl: './workflow-step-state.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class WorkflowStepStateComponent implements OnInit {

    @Input() workflowStep: WorkflowStepDocument;

    public valuelist: Valuelist;

    private readonly icons: Map<string> = {
        'planned': 'mdi-calendar-month',
        'in progress': 'mdi-dots-horizontal-circle',
        'completed': 'mdi-check-circle',
        'canceled': 'mdi-close-circle'
    };


    constructor(private projectConfiguration: ProjectConfiguration,
                private labels: Labels,
                private datastore: Datastore) {}


    public getState = () => this.workflowStep.resource.state;

    public getValues = () => this.valuelist.order;

    public getValueLabel = (valueId: string) => this.labels.getValueLabel(this.valuelist, valueId);

    public getValueIcon = (valueId: string) => this.icons[valueId];


    ngOnInit() {
        
        this.valuelist = this.getValuelist();
    }


    public async setState(valueId: string) {

        this.workflowStep.resource.state = valueId;
        await this.datastore.update(this.workflowStep);
    }


    private getValuelist(): Valuelist {

        const stateField: Field = CategoryForm.getField(
            this.projectConfiguration.getCategory('WorkflowStep'),
            'state'
        );

        return stateField.valuelist;
    }
}
