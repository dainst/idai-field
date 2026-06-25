import {
  AppConfigurator,
  ConfigLoader,
  ConfigReader,
  PouchdbDatastore,
  ProjectConfiguration,
  ConfigurationDocument,
  KOREAN_FIELDWORK_CONFIGURATION_NAME,
  KOREAN_FIELDWORK_PROJECT_IDENTIFIER,
  getConfigurationName,
} from 'idai-field-core';
import {
  isKoreanFieldworkProject,
  KOREAN_FIELDWORK_PROJECT_LANGUAGES,
} from '@/constants/korean-fieldwork-project';

const loadConfiguration = async (
  pouchdbDatastore: PouchdbDatastore,
  project: string,
  languages: string[],
  username: string
): Promise<ProjectConfiguration> => {
  const configReader = new ConfigReader();

  const db = await getProjectDb(pouchdbDatastore, project);
  
  const config = await ConfigurationDocument.getConfigurationDocument(
    (id: string) => db.get(id),
    configReader,
    project,
    username
  );
  const configurationName =
    config.resource.customConfigurationName ?? getConfigurationName(project);
  const normalizedConfig = await normalizeKoreanFieldworkConfiguration(
    config,
    configReader,
    configurationName,
    project,
    username
  );

  const configurator = new AppConfigurator(
    new ConfigLoader(new ConfigReader())
  );
  return await configurator.go(
    getConfigurationName(project, normalizedConfig.resource.customConfigurationName),
    normalizedConfig
  );
};

const getProjectDb = async (
  pouchdbDatastore: PouchdbDatastore,
  project: string
) => {
  const currentDb = pouchdbDatastore.getDb();
  if (currentDb && await isDbForProject(currentDb, project)) return currentDb;

  await pouchdbDatastore.createDb(project);
  return pouchdbDatastore.getDb();
};

const isDbForProject = async (db: any, project: string): Promise<boolean> => {
  try {
    return (await db.info()).db_name === project;
  } catch {
    return false;
  }
};

const normalizeKoreanFieldworkConfiguration = async (
  config: ConfigurationDocument,
  configReader: ConfigReader,
  configurationName: string,
  project: string,
  username: string
): Promise<ConfigurationDocument> => {
  if (configurationName !== KOREAN_FIELDWORK_CONFIGURATION_NAME
      && !isKoreanFieldworkProject(project)) return config;

  const latestConfig = await ConfigurationDocument.getConfigurationDocument(
    async () => {
      throw new Error('Latest KoreanFieldwork configuration document must be read from bundled files');
    },
    configReader,
    KOREAN_FIELDWORK_PROJECT_IDENTIFIER,
    username
  );

  config.resource.forms = mergeKoreanFieldworkForms(
    config.resource.forms,
    latestConfig.resource.forms
  );
  config.resource.order = mergeKoreanFieldworkOrder(
    config.resource.order,
    latestConfig.resource.order
  );
  config.resource.languages = latestConfig.resource.languages;
  config.resource.projectLanguages = KOREAN_FIELDWORK_PROJECT_LANGUAGES.slice();
  config.resource.customConfigurationName = KOREAN_FIELDWORK_CONFIGURATION_NAME;

  return config;
};

const mergeKoreanFieldworkForms = (
  currentForms: Record<string, any>,
  latestForms: Record<string, any>
): Record<string, any> => Object.keys(latestForms).reduce((result, formName) => {
  result[formName] = mergeForm(result[formName], latestForms[formName]);
  return result;
}, { ...currentForms });

const mergeForm = (currentForm: any, latestForm: any) => {
  if (!currentForm) return latestForm;

  return {
    ...latestForm,
    ...currentForm,
    fields: mergeFields(currentForm.fields ?? {}, latestForm.fields ?? {}),
    groups: mergeGroups(currentForm.groups, latestForm.groups),
    valuelists: {
      ...(latestForm.valuelists ?? {}),
      ...(currentForm.valuelists ?? {}),
    },
  };
};

const mergeFields = (
  currentFields: Record<string, any>,
  latestFields: Record<string, any>
): Record<string, any> => Object.keys(latestFields).reduce((result, fieldName) => {
  result[fieldName] = mergeField(result[fieldName], latestFields[fieldName]);
  return result;
}, { ...currentFields });

const mergeField = (currentField: any, latestField: any) => {
  if (!currentField) return latestField;

  const mergedField = {
    ...latestField,
    ...currentField,
  };

  if (latestField.domain || currentField.domain) {
    mergedField.domain = mergeUnique(latestField.domain, currentField.domain);
  }
  if (latestField.range || currentField.range) {
    mergedField.range = mergeUnique(latestField.range, currentField.range);
  }

  return mergedField;
};

const mergeGroups = (
  currentGroups: any[] | undefined,
  latestGroups: any[] | undefined
) => {
  if (!currentGroups) return latestGroups;
  if (!latestGroups) return currentGroups;

  const currentGroupNames = new Set(currentGroups.map((group) => group.name));
  return currentGroups.concat(
    latestGroups.filter((group) => !currentGroupNames.has(group.name))
  );
};

const mergeKoreanFieldworkOrder = (
  currentOrder: string[] = [],
  latestOrder: string[] = []
) => latestOrder.concat(
  currentOrder.filter((formName) => !latestOrder.includes(formName))
);

const mergeUnique = (
  latestValues: string[] | undefined,
  currentValues: string[] | undefined
) => {
  if (!latestValues && !currentValues) return undefined;
  return Array.from(new Set([
    ...(latestValues ?? []),
    ...(currentValues ?? []),
  ]));
};

export default loadConfiguration;
