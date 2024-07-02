import { describe, expect, test, beforeEach } from '@jest/globals';
import { Resource } from 'idai-field-core';
import { RelationPickerGroupComponent } from '../../../../../src/app/components/docedit/widgets/relationpicker/relation-picker-group.component';


/**
 * @author Thomas Kleinke
 */
describe('RelationPickerGroupComponent', () => {

    let resource: Resource;
    let relationPickerGroupComponent: RelationPickerGroupComponent;


    beforeEach(() => {

        resource = { id: 'id1', identifier: 'ob1', category: 'Category', relations : {} };

        relationPickerGroupComponent = new RelationPickerGroupComponent();
        relationPickerGroupComponent.resource = resource;
        relationPickerGroupComponent.relationDefinition = {
            name: 'Above',
            inverse: 'Below',
            domain: ['Category'],
            range: ['Category'],
            inputType: 'relation'
        };
    });


    test('should create an empty relation array if no relation array exists and a new relation is created', () => {

        relationPickerGroupComponent.ngOnChanges();
        relationPickerGroupComponent.createRelation();

        expect(resource.relations['Above'].length).toBe(1);
        expect(resource.relations['Above'][0]).toBe('');
    });
});

