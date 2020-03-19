export function createMockProjectConfiguration(): any {

    const projectConfiguration = jasmine.createSpyObj('projectConfiguration',
        ['getTypesMap']);

    const defaultFieldConfiguration =  {
        groups: [{ fields: {
            identifier: {},
            shortDescription: {},
        }}]
    };

    projectConfiguration.getTypesMap.and.returnValue({
        type1: defaultFieldConfiguration,
        type2: defaultFieldConfiguration,
        type3: defaultFieldConfiguration,
        Find: defaultFieldConfiguration,
        Type: defaultFieldConfiguration
    });

    return projectConfiguration;
}