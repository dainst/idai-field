import {update} from 'tsfun';

export function createMockProjectConfiguration(): any {

    const projectConfiguration = jasmine.createSpyObj('projectConfiguration',
        ['getCategoriesArray']);

    const defaultFieldConfiguration =  {
        name: '',
        groups: [{ fields: {
            identifier: {},
            shortDescription: {},
        }}]
    };

    projectConfiguration.getCategoriesArray.and.returnValue([
        update('name', 'category1', defaultFieldConfiguration),
        update('name', 'category2', defaultFieldConfiguration),
        update('name', 'category3', defaultFieldConfiguration),
        update('name', 'Find', defaultFieldConfiguration),
        update('name', 'Type', defaultFieldConfiguration),
    ]);

    return projectConfiguration;
}
