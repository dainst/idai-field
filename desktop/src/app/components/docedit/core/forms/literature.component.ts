import { Component, Input } from '@angular/core';
import { is, remove, clone } from 'tsfun';
import { Literature, Field } from 'idai-field-core';
import { UtilTranslations } from '../../../../util/util-translations';


type LiteratureInEditing = { original: Literature, clone: Literature };


@Component({
    selector: 'form-field-literature',
    templateUrl: './literature.html'
})
/**
 * @author Thomas Kleinke
 */
export class LiteratureComponent {

    @Input() fieldContainer: any;
    @Input() field: Field;

    public newLiterature: Literature|undefined;
    public inEditing: Array<LiteratureInEditing> = [];


    constructor(private utilTranslations: UtilTranslations) {}

    
    public isEditing = () => this.inEditing.length > 0;

    public isEditingAllowed = () => !this.isEditing() && !this.newLiterature;


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

        if (!literature.zenonId) delete literature.zenonId;
        if (!literature.doi) delete literature.doi;
        if (!literature.page) delete literature.page;
        if (!literature.figure) delete literature.figure;

        if (this.newLiterature === literature) {
            this.add(literature);
        } else {
            const index: number = this.fieldContainer[this.field.name].indexOf(this.getOriginal(literature));
            this.fieldContainer[this.field.name].splice(index, 1, literature);
        }

        this.inEditing = this.inEditing.filter(l => l.clone !== literature);
    }


    public remove(literature: Literature) {

        this.fieldContainer[this.field.name] = remove(is(literature))(this.fieldContainer[this.field.name]);
    }


    public validate(literature: Literature): boolean {

        return literature.quotation.length > 0;
    }


    private add(literature: Literature) {

        if (!this.fieldContainer[this.field.name]) this.fieldContainer[this.field.name] = [];
        this.fieldContainer[this.field.name].push(literature);
        this.newLiterature = undefined;
    }
}
