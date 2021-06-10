import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { and, any, compose, includedIn, is, isnt, map, not, on, or, Predicate, to } from 'tsfun';
import { Category, ConfigurationDocument, CustomCategoryDefinition, FieldDefinition, Group, I18nString,
    LabelUtil, LanguageConfiguration, Named, RelationDefinition, Relations } from 'idai-field-core';
import { ConfigurationUtil } from '../../core/configuration/configuration-util';
import { LanguageConfigurationUtil } from '../../core/configuration/language-configuration-util';

const locale: string = typeof window !== 'undefined'
    ? window.require('@electron/remote').getGlobal('config').locale
    : 'de';


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
    @Input() customConfigurationDocument: ConfigurationDocument; // TODO Remove this
    @Input() customLanguageConfigurations: { [language: string]: LanguageConfiguration };
    @Input() showHiddenFields: boolean = true;
    @Input() permanentlyHiddenFields: { [categoryName: string]: string[] };

    public selectedGroup: string;
    public editing: boolean = false;

    public label: string;
    public description: string;

    public editableLabel: I18nString;
    public editableDescription: I18nString;
    

    ngOnChanges(changes: SimpleChanges) {

        if (changes['category']) this.selectedGroup = this.getGroups()[0].name;
        this.updateLabelAndDescription();
    }

    
    public getGroupLabel = (group: Group) => LabelUtil.getLabel(group);


    public isHidden = (field: FieldDefinition) =>
        ConfigurationUtil.isHidden(this.category, this.customConfigurationDocument)(field);


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
                    on(FieldDefinition.NAME, not(includedIn(this.permanentlyHiddenFields[this.category.name]))),
                    or(
                        () => this.showHiddenFields,
                        not(ConfigurationUtil.isHidden(this.category, this.customConfigurationDocument))
                    )
                )
            );
    }


    public toggleHidden(field: FieldDefinition) {

        const customCategoryDefinition: CustomCategoryDefinition
            = this.customConfigurationDocument.resource.categories[this.category.libraryId];
        
        if (ConfigurationUtil.isHidden(this.category, this.customConfigurationDocument)(field)) {
            customCategoryDefinition.hidden
                = customCategoryDefinition.hidden.filter(name => name !== field.name);
        } else {
            if (!customCategoryDefinition.hidden) customCategoryDefinition.hidden = [];
            customCategoryDefinition.hidden.push(field.name);
        }
    }


    public getCustomFieldDefinition(field: FieldDefinition) {

        return this.customConfigurationDocument.resource
            .categories[this.category.libraryId ?? this.category.name]
            .fields[field.name];
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
}
