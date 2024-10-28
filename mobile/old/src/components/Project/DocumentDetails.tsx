/* eslint-disable react/display-name */
import {
  Document,
  FieldsViewField,
  FieldsViewGroup,
  FieldsViewUtil,
  Labels,
  ProjectConfiguration,
} from 'idai-field-core';
import React, { ReactNode, useContext, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ConfigurationContext } from '../../contexts/configuration-context';
import LabelsContext from '../../contexts/labels/labels-context';
import { PreferencesContext } from '../../contexts/preferences-context';
import useDocument from '../../hooks/use-document';
import { DocumentRepository } from '../../repositories/document-repository';
import translations from '../../utils/translations';
import Column from '../common/Column';
import DocumentButton from '../common/DocumentButton';
import I18NLabel from '../common/I18NLabel';

interface DocumentDetailsProps {
  repository: DocumentRepository;
  docId: string;
}

const DocumentDetails: React.FC<DocumentDetailsProps> = ({
  repository,
  docId,
}) => {
  const config = useContext(ConfigurationContext);
  const languages = useContext(PreferencesContext).preferences.languages;
  const { labels } = useContext(LabelsContext);

  const doc = useDocument(repository, docId);
  const [groups, setGroups] = useState<FieldsViewGroup[]>();

  useEffect(() => {
    if (!doc || !labels) return;

    FieldsViewUtil.getGroupsForResource(
      doc.resource,
      config,
      repository.datastore,
      labels
    ).then(setGroups);
  }, [doc, config, repository, languages, labels]);

  if (!doc || !groups || !labels) return null;

  return (
    <ScrollView style={styles.container}>
      {groups.map(renderGroup(config, languages, labels))}
    </ScrollView>
  );
};

const renderGroup =
  (config: ProjectConfiguration, languages: string[], labels: Labels) =>
  (group: FieldsViewGroup) =>
    (
      <View key={group.name}>
        <I18NLabel style={styles.groupLabel} label={group} />
        {group.fields.map(renderField(languages, config, labels))}
      </View>
    );

const renderField =
  (languages: string[], config: ProjectConfiguration, labels: Labels) =>
  (field: FieldsViewField) =>
    (
      <Column style={styles.fieldColumn} key={field.label}>
        <Text style={styles.fieldLabel}>{field.label}</Text>
        {renderFieldValue(field, field.value, languages, config, labels)}
      </Column>
    );

const renderFieldValue = (
  field: FieldsViewField,
  value: unknown,
  languages: string[],
  config: ProjectConfiguration,
  labels: Labels
): ReactNode =>
  field.type === 'relation'
    ? field.targets?.map(renderRelationTarget)
    : field.type === 'default' && typeof value === 'string'
    ? renderStringValue(value)
    : field.type === 'array' && Array.isArray(value)
    ? value.map((value) =>
        renderFieldValue(field, value, languages, config, labels)
      )
    : renderObjectValue(value, field, languages, labels);

const renderStringValue = (value: string) => <Text key={value}>{value}</Text>;

const renderObjectValue = (
  value: unknown,
  field: FieldsViewField,
  languages: string[],
  labels: Labels
) => {
  const text = FieldsViewUtil.getObjectLabel(
    value,
    field,
    getTranslation(languages),
    (value: number) => value.toLocaleString(languages),
    labels
  );
  return <Text key={text}>{text}</Text>;
};

const renderRelationTarget = (target: Document) => (
  <DocumentButton
    key={target.resource.id}
    disabled={true}
    document={target}
    size={20}
  />
);

const getTranslation = (_languages: string[]) => (key: string) =>
  translations[key];

const styles = StyleSheet.create({
  container: {
    padding: 10,
    flex: 1,
  },
  groupLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    paddingVertical: 5,
  },
  fieldColumn: {
    paddingBottom: 5,
  },
  fieldLabel: {
    fontWeight: 'bold',
  },
});

export default DocumentDetails;
