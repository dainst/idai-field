import {
  AppConfigurator,
  ConfigLoader,
  ConfigReader,
  getConfigurationName,
  PouchdbDatastore,
  ProjectConfiguration,
} from 'idai-field-core';

const loadConfiguration = async (
  pouchdbDatastore: PouchdbDatastore,
  project: string,
  languages: string[],
  username: string
): Promise<ProjectConfiguration> => {
  const customConfigName = getConfigurationName(project);
  const configurator = new AppConfigurator(
    new ConfigLoader(new ConfigReader(), pouchdbDatastore)
  );
  return await configurator.go(username, customConfigName);
};

export default loadConfiguration;
