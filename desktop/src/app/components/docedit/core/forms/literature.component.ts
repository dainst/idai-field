import {Component, Input} from '@angular/core';
import {is, remove, clone} from 'tsfun';
import {Literature, Resource} from 'idai-field-core';
import {FieldDefinition} from 'idai-field-core';
import {UtilTranslations} from '../../../../core/util/util-translations';


type LiteratureInEditing = { original: Literature, clone: Literature };


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
    public inEditing: Array<LiteratureInEditing> = [];


    constructor(private utilTranslations: UtilTranslations) {}


    public isInEditing(literature: Literature) {

        return this.inEditing.find(l => l.original === literature) !== undefined;
    }


    public startEditing(literature: Literature) {

        this.inEditing.push({ original: literature, clone: clone(literature) });
    }


    public getLabel = (literature: Literature) => Literature.generateLabel(
        literature, (key: string) => this.utilTranslations.getTranslation(key)
    );


    public createNewLiterature() {

        this.newLiterature = { quotation: '' };
    }


    public discardNewLiterature() {

        if (!this.newLiterature) return;

        this.newLiterature = undefined;
    }


    public getClone(literature: Literature): Literature|undefined {

        const literatureInEditing = this.inEditing.find(l => l.original === literature);
        if (literatureInEditing) return literatureInEditing.clone;
    }


    public getOriginal(clonedLiterature: Literature): Literature|undefined {

        const literatureInEditing = this.inEditing.find(l => l.clone === clonedLiterature);
        if (literatureInEditing) return literatureInEditing.original;
    }


    public save(literature: Literature) {

        if (!literature.zenonId || literature.zenonId.length === 0) delete literature.zenonId;
        if (this.newLiterature === literature) {
            this.add(literature);
        } else {
            const index: number = this.resource[this.field.name].indexOf(this.getOriginal(literature));
            this.resource[this.field.name].splice(index, 1, literature);
        }

        this.inEditing = this.inEditing.filter(l => l.clone !== literature);
    }


    public remove(literature: Literature) {

        this.resource[this.field.name] = remove(is(literature))(this.resource[this.field.name]);
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
