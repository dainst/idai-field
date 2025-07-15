import { Map } from 'tsfun';
import { Component, Input, OnInit } from '@angular/core';
import { CategoryForm, Field, Labels, ProjectConfiguration, Valuelist, ProcessDocument } from 'idai-field-core';


@Component({
    selector: 'process-state',
    templateUrl: './process-state.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class ProcessStateComponent implements OnInit {

    @Input() process: ProcessDocument;

    public valuelist: Valuelist;

    private readonly icons: Map<string> = {
        'planned': 'mdi-calendar-month',
        'in progress': 'mdi-dots-horizontal-circle',
        'completed': 'mdi-check-circle',
        'canceled': 'mdi-close-circle'
    };


    constructor(private projectConfiguration: ProjectConfiguration,
                private labels: Labels) {}


    public getState = () => this.process.resource.state;

    public getValues = () => this.valuelist.order;

    public getValueLabel = (valueId: string) => this.labels.getValueLabel(this.valuelist, valueId);

    public getValueIcon = (valueId: string) => this.icons[valueId];


    ngOnInit() {
        
        this.valuelist = this.getValuelist();
    }


    private getValuelist(): Valuelist {

        const stateField: Field = CategoryForm.getField(
            this.projectConfiguration.getCategory('Process'),
            'state'
        );

        return stateField.valuelist;
    }
}
