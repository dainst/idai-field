import {
    AppConfigurator, ConfigLoader, ConfigReader, getConfigurationName, PouchdbManager,
    ProjectConfiguration
} from 'idai-field-core';


const loadConfiguration = async (
    pouchdbmanager: PouchdbManager,
    project: string,
    languages: string[],
    username: string
): Promise<ProjectConfiguration> => {

    const customConfigName = getConfigurationName(project);
    const configurator = new AppConfigurator(new ConfigLoader(new ConfigReader(), pouchdbmanager));
    return await configurator.go(customConfigName, languages, username);
};

export default loadConfiguration;
