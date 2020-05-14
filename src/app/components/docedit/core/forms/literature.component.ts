import {Component, Input} from '@angular/core';
import {is, remove} from 'tsfun';
import {Literature, Resource} from 'idai-components-2';
import {FieldDefinition} from '../../../../core/configuration/model/field-definition';
import {UtilTranslations} from '../../../../core/util/util-translations';


@Component({
    selector: 'dai-literature',
    templateUrl: './literature.html'
})
/**
 * @author Thomas Kleinke
 */
export class LiteratureComponent {

    @Input() resource: Resource;
    @Input() field: FieldDefinition;

    public newLiterature: Literature|undefined;
    public inEditing: Array<Literature> = [];


    constructor(private utilTranslations: UtilTranslations) {}


    public isInEditing = (literature: Literature) => this.inEditing.includes(literature);

    public startEditing = (literature: Literature) => this.inEditing.push(literature);

    public getLabel = (literature: Literature) => Literature.generateLabel(
        literature, (key: string) => this.utilTranslations.getTranslation(key)
    );


    public createNewLiterature() {

        this.newLiterature = { quotation: '' };
        this.inEditing.push(this.newLiterature);
    }


    public discardNewLiterature() {

        if (!this.newLiterature) return;

        this.inEditing = remove(is(this.newLiterature), this.inEditing);
        this.newLiterature = undefined;
    }


    public save(literature: Literature) {

        if (!literature.zenonId || literature.zenonId.length === 0) delete literature.zenonId;
        if (this.newLiterature === literature) this.add(literature);
        this.inEditing = remove(is(literature), this.inEditing);
    }


    public remove(literature: Literature) {

        this.resource[this.field.name] = remove(is(literature))(this.resource[this.field.name]);
        this.inEditing = remove(is(literature), this.inEditing);
    }


    public validate(literature: Literature): boolean {

        return literature.quotation.length > 0;
    }


    private add(literature: Literature) {

        if (!this.resource[this.field.name]) this.resource[this.field.name] = [];
        this.resource[this.field.name].push(literature);
        this.newLiterature = undefined;
    }
}
