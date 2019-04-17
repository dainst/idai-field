import {RelationDefinition} from 'idai-components-2/src/configuration/relation-definition';
import {includedIn, is, isNot, on, undefinedOrEmpty} from 'tsfun';
import {FieldDefinition} from 'idai-components-2/src/configuration/field-definition';
import {I18n} from '@ngx-translate/i18n-polyfill';



const STEM = 0;
const PROPERTIES = 1;
const CHILD_PROPERTIES = 2;
const DIMENSIONS = 3;
const POSITION = 4;
const TIME = 5;
const IMAGES = 6;
const CONFLICTS = 7;


/**
 * @author Daniel de Oliveira
 */
export module GroupsConfiguration {


    export interface GroupDefinition {

        name: string;
        label: string;
        fields: any[];
        relations: any[];
        widget: string|undefined;
    }


    export const groups: GroupDefinition[] = [
        { name: 'stem', label: 'Stammdaten', fields: [], relations: [], widget: 'generic'},
        { name: 'properties', label: 'Eigenschaften', fields: [], relations: [], widget: 'generic'},
        { name: 'childProperties', label: 'Eigenschaften speziell', fields: [], relations: [], widget: 'generic'},
        { name: 'dimensions', label: 'Maße', fields: [], relations: [], widget: 'generic'},
        { name: 'position', label: 'Lage', fields: [], relations: [], widget: 'generic'},
        { name: 'time', label: 'Zeit', fields: [], relations: [], widget: 'generic'},
        { name: 'images', label: 'Bilder', fields: [], relations: [], widget: undefined},
        { name: 'conflicts', label: 'Konflikte', fields: [], relations: [], widget: undefined}];


    /**
     * Configures a bunch of groups in such a way that it represents a resource type.
     */
    export function configure(groups: Array<GroupDefinition>,
                              fieldDefinitions: Array<FieldDefinition>,
                              relationDefinitions: Array<RelationDefinition>,
                              i18n: I18n) {

        setLabels(groups, i18n);

        if (isNot(undefinedOrEmpty)(fieldDefinitions)) {

            setFields(groups, fieldDefinitions);
            sortGroups(groups);
        }

        if (isNot(undefinedOrEmpty)(relationDefinitions)) {

            setRelations(groups, relationDefinitions);
        }
    }


    function setRelations(groups: Array<GroupDefinition>, relationDefinitions: Array<RelationDefinition>) {

        groups[POSITION].relations = relationDefinitions
            .filter(on('name', includedIn(['borders', 'cuts', 'isCutBy', 'isAbove', 'isBelow'])));
        groups[TIME].relations = relationDefinitions
            .filter(on('name', includedIn(['isAfter', 'isBefore', 'isContemporaryWith'])));
    }


    function setFields(groups: Array<GroupDefinition>, fieldDefinitions: Array<FieldDefinition>) {

        groups[STEM].fields = fieldDefinitions.filter(on('group', is('stem')));
        groups[PROPERTIES].fields = fieldDefinitions.filter(on('group', is(undefined)));
        groups[CHILD_PROPERTIES].fields = fieldDefinitions.filter(on('group', is('child')));
        groups[DIMENSIONS].fields = fieldDefinitions.filter(on('group', is('dimension')));
        groups[POSITION].fields = fieldDefinitions.filter(on('group', is('position')));
        groups[TIME].fields = fieldDefinitions.filter(on('group', is('time')));
    }


    function setLabels(groups: Array<GroupDefinition>, i18n: I18n) {

        groups[STEM].label = i18n({ id: 'docedit.group.stem', value: 'Stammdaten' });
        groups[PROPERTIES].label = i18n({ id: 'docedit.group.properties', value: 'Eigenschaften' });
        if (this.label) groups[CHILD_PROPERTIES].label = this.label;
        groups[DIMENSIONS].label = i18n({ id: 'docedit.group.dimensions', value: 'Maße' });
        groups[POSITION].label = i18n({ id: 'docedit.group.position', value: 'Lage' });
        groups[TIME].label = i18n({ id: 'docedit.group.time', value: 'Zeit' });
        groups[IMAGES].label = i18n({ id: 'docedit.group.images', value: 'Bilder' });
        groups[CONFLICTS].label = i18n({ id: 'docedit.group.conflicts', value: 'Konflikte' });
    }


    function sortGroups(groups: Array<GroupDefinition>) {

        sortGroup(this.groups[STEM].fields, ['identifier', 'shortDescription',
            'processor', 'description', 'diary', 'date', 'beginningDate', 'endDate']);
        sortGroup(this.groups[DIMENSIONS].fields, ['dimensionHeight',
            'dimensionLength', 'dimensionWidth', 'dimensionPerimeter',
            'dimensionDiameter', 'dimensionThickness', 'dimensionVerticalExtent', 'dimensionOther']);
    }


    /**
     * Fields not defined via 'order' are not considered
     */
    function sortGroup(fds: Array<FieldDefinition>, order: string[]) {

        const temp = fds;
        const l = temp.length;
        for (let fieldName of order) {

            const got = temp.find((fd: FieldDefinition) => fd.name === fieldName);
            if (got) temp.push(got);

        }
        fds.splice(0, l);
    }
}