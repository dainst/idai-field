import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { and, any, compose, flatten, includedIn, is, isnt, map, not, on, or, Predicate, to } from 'tsfun';
import { Category, CustomCategoryDefinition, CustomFieldDefinition, FieldDefinition, FieldResource, Group, I18nString,
    LabelUtil, LanguageConfiguration, Named, RelationDefinition, Relations, Resource } from 'idai-field-core';
import { ConfigurationUtil } from '../../core/configuration/configuration-util';
import { LanguageConfigurationUtil } from '../../core/configuration/language-configuration-util';


export const OVERRIDE_VISIBLE_FIELDS = [Resource.IDENTIFIER, FieldResource.SHORTDESCRIPTION];


@Component({
    selector: 'configuration-category',
    templateUrl: './configuration-category.html'
})
/**
* @author Sebastian Cuy
* @author Thomas Kleinke
 */
export class ConfigurationCategoryComponent implements OnChanges {

    @Input() category: Category;
    @Input() customCategoryDefinition: CustomCategoryDefinition|undefined;
    @Input() parentCustomCategoryDefinition: CustomCategoryDefinition|undefined;
    @Input() customLanguageConfigurations: { [language: string]: LanguageConfiguration };
    @Input() showHiddenFields: boolean = true;

    public selectedGroup: string;
    public editing: boolean = false;

    public label: string;
    public description: string;

    public editableLabel: I18nString;
    public editableDescription: I18nString;

    private permanentlyHiddenFields: string[];
    

    ngOnChanges(changes: SimpleChanges) {

        if (changes['category']) {
            this.selectedGroup = this.getGroups()[0].name;
            this.permanentlyHiddenFields = this.getPermanentlyHiddenFields();
        }

        this.updateLabelAndDescription();
        this.editing = false;
    }

    
    public getGroupLabel = (group: Group) => LabelUtil.getLabel(group);


    public isHidden = (field: FieldDefinition) =>
        ConfigurationUtil.isHidden(this.customCategoryDefinition, this.parentCustomCategoryDefinition)(field);


    public getGroups(): Array<Group> {

        return this.category.groups.filter(
            or(
                (group: Group) => group.fields.length > 0,
                (group: Group) => group.relations.length > 0
            )
        );
    }


    public hasCustomFields: Predicate<Group> = compose(
        to<Array<FieldDefinition>>(Group.FIELDS),
        map(_ => _.source),
        any(is(FieldDefinition.Source.CUSTOM))
    );


    public getFields(): Array<FieldDefinition> {

        return this.category.groups
            .find(on(Named.NAME, is(this.selectedGroup)))!
            .fields
            .filter(
                and(
                    on(FieldDefinition.NAME, not(includedIn(this.permanentlyHiddenFields))),
                    or(
                        () => this.showHiddenFields,
                        not(ConfigurationUtil.isHidden(
                            this.customCategoryDefinition, this.parentCustomCategoryDefinition
                        ))
                    )
                )
            );
    }


    public toggleHidden(field: FieldDefinition) {
        
        if (ConfigurationUtil.isHidden(this.customCategoryDefinition, this.parentCustomCategoryDefinition)(field)) {
            this.customCategoryDefinition.hidden
                = this.customCategoryDefinition.hidden.filter(name => name !== field.name);
        } else {
            if (!this.customCategoryDefinition.hidden) this.customCategoryDefinition.hidden = [];
            this.customCategoryDefinition.hidden.push(field.name);
        }
    }


    public getCustomFieldDefinition(field: FieldDefinition): CustomFieldDefinition|undefined {

        return this.customCategoryDefinition.fields[field.name];
    }


    public getRelations(): Array<RelationDefinition> {

        return this.category.groups
            .find(on(Named.NAME, is(this.selectedGroup)))!
            .relations
            .filter(on(Named.NAME, isnt(Relations.Type.INSTANCEOF)));
    }


    public startEditing() {

        this.editableLabel = LanguageConfigurationUtil.createEditableI18nString(
            this.customLanguageConfigurations, 'label', this.category
        );
        this.editableDescription = LanguageConfigurationUtil.createEditableI18nString(
            this.customLanguageConfigurations, 'description', this.category
        );
        this.editing = true;
    }


    public finishEditing() {

        LanguageConfigurationUtil.updateCustomLanguageConfigurations(
            this.customLanguageConfigurations, this.editableLabel, this.editableDescription, this.category
        );
        this.updateLabelAndDescription();
        this.editing = false;
    }


    private updateLabelAndDescription() {

        const { label, description } = LabelUtil.getLabelAndDescription(
            LanguageConfigurationUtil.getUpdatedDefinition(this.customLanguageConfigurations, this.category)
        );
        this.label = label;
        this.description = description;
    }


    private getPermanentlyHiddenFields(): string[] {

        return flatten(this.category.groups.map(to('fields')))
            .filter(field => !field.visible
                && !OVERRIDE_VISIBLE_FIELDS.includes(field.name)
                && (!this.category.libraryId || !ConfigurationUtil.isHidden(
                    this.customCategoryDefinition, this.parentCustomCategoryDefinition
                )(field)))
            .map(to('name'));
    }
}
