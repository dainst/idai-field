import {Component, Input, OnChanges} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ProjectConfiguration, FieldDefinition} from 'idai-components-2/core';
import {ViewFacade} from '../view/view-facade';

@Component({
    moduleId: module.id,
    selector: 'search-constraints',
    templateUrl: './search-constraints.html'
})

/**
 * @author Thomas Kleinke
 */
export class SearchConstraintsComponent implements OnChanges {

    @Input() type: string;

    public fields: Array<FieldDefinition>;
    public selectedField: FieldDefinition|undefined;
    public searchTerm: string = '';
    public constraints: Array<{ fieldName: string; searchTerm: string }> = [];

    private static textFieldInputTypes: string[] = ['input', 'text', 'unsignedInt', 'float', 'unsignedFloat'];


    constructor(private projectConfiguration: ProjectConfiguration,
                private modalService: NgbModal,
                private viewFacade: ViewFacade) {

        this.viewFacade.navigationPathNotifications().subscribe(() => this.reset());
    }


    ngOnChanges() {

        this.updateFields();
    }


    public async openModal(modal: any) {

        if (await this.modalService.open(modal).result == 'ok') {
            await this.addConstraint();
            this.reset();
        }
    }


    public getSearchInputType(field: FieldDefinition|undefined): 'input'|'dropdown'|undefined {

        if (!field) return undefined;

        if (SearchConstraintsComponent.textFieldInputTypes.includes(field.inputType as string)) {
            return 'input';
        } else if (field.inputType === 'dropdown') {
            return 'dropdown';
        } else {
            return undefined;
        }
    }


    public selectField(fieldName: string) {

        this.selectedField = this.fields.find(field => field.name === fieldName);
        this.searchTerm = '';
    }


    private updateFields() {

        this.fields = this.projectConfiguration.getFieldDefinitions(this.type)
            .filter(field => field.constraintIndexed && this.getSearchInputType(field));
    }


    private async addConstraint() {

        if (!this.selectedField || this.searchTerm.length == 0) return;

        const constraints: { [name: string]: string } = this.viewFacade.getCustomConstraints();
        constraints[this.selectedField.name + ':match'] = this.searchTerm;
        await this.viewFacade.setCustomConstraints(constraints);
    }


    private reset() {

        this.updateConstraints();
        this.selectedField = undefined;
        this.searchTerm = '';
    }


    private updateConstraints() {

        const constraints: { [name: string]: string } = this.viewFacade.getCustomConstraints();
        this.constraints = Object.keys(constraints)
            .map(constraintName => {
                return {
                    fieldName: constraintName.substring(0, constraintName.indexOf(':')),
                    searchTerm: constraints[constraintName]
                }
            });
    }
}