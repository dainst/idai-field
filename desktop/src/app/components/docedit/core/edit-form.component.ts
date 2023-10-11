import { AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { isUndefinedOrEmpty, clone, Map } from 'tsfun';
import { Document, Field, Group, Labels } from 'idai-field-core';
import { Language, Languages } from '../../../services/languages';
import { AngularUtility } from '../../../angular/angular-utility';


@Component({
    selector: 'edit-form',
    templateUrl: './edit-form.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class EditFormComponent implements AfterViewInit, OnChanges {

    @ViewChild('editor', { static: false }) rootElement: ElementRef;

    @Input() document: Document;
    @Input() originalDocument: Document;
    @Input() fieldDefinitions: Array<Field>;
    @Input() originalGroups: Array<Group>;
    @Input() identifierPrefix: string|undefined;
    @Input() inspectedRevisions: Document[];
    @Input() activeGroup: string;
    @Input() scrollTargetField: string;

    public extraGroups: Array<Group> = [{ name: 'conflicts', fields: [] }];
    public groups: Array<Group> = [];
    public languages: Map<Language>;


    constructor(private elementRef: ElementRef,
                private i18n: I18n,
                private labels: Labels) {

        this.languages = Languages.getAvailableLanguages();
    }


    public activateGroup = (name: string) => this.activeGroup = name;

    public getGroupId = (group: Group) => 'edit-form-goto-' + group.name.replace(':', '-');


    async ngAfterViewInit() {

        await AngularUtility.refresh();
        if (!this.scrollTargetField) this.focusFirstInputElement();
    }


    ngOnChanges() {

        if (isUndefinedOrEmpty(this.originalGroups)) return;

        this.groups = [];
        for (const originalGroup of this.originalGroups) {
            const group = clone(originalGroup);
            this.groups.push(group);
        }
        this.groups = this.groups.concat(this.extraGroups);
    }


    public getLabel(group: Group): string {

        return group.name === 'conflicts'
            ? this.i18n({ id: 'docedit.group.conflicts', value: 'Konflikte' })
            : this.labels.get(group);
    }


    public shouldShow(groupName: string) {

        return (groupName === 'conflicts' && this.document._conflicts)
            || this.getFields(groupName).filter(field => field.editable).length > 0;
    }


    public getFields(groupName: string): Array<Field> {

        return this.groups.find((group: Group) => group.name === groupName).fields;
    }


    private focusFirstInputElement() {

        const inputElements: Array<HTMLElement> = this.elementRef.nativeElement
            .getElementsByTagName('input');
        if (inputElements.length > 0) inputElements[0].focus();
    }
}
