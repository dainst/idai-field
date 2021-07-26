/* eslint-disable react/display-name */
import {
    Document, FieldsViewField, FieldsViewGroup, FieldsViewUtil, I18N,
    Labels,
    ProjectConfiguration
} from 'idai-field-core';
import React, { ReactNode, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import useDocument from '../../hooks/use-document';
import { DocumentRepository } from '../../repositories/document-repository';
import translations from '../../utils/translations';
import Column from '../common/Column';
import DocumentButton from '../common/DocumentButton';


interface DocumentDetailsProps {
    config: ProjectConfiguration;
    repository: DocumentRepository;
    docId: string;
    languages: string[];
}


const DocumentDetails: React.FC<DocumentDetailsProps> = ({
    config,
    repository,
    docId,
    languages,
}) => {

    const doc = useDocument(repository, docId);
    const [groups, setGroups] = useState<FieldsViewGroup[]>();
    
    useEffect(() => {

        if (!doc) return;

        FieldsViewUtil.getGroupsForResource(doc.resource, config, repository.datastore, new Labels(() => languages))
            .then(setGroups);
    }, [doc, config, repository, languages]);

    if (!doc || !groups) return null;

    return <ScrollView style={ styles.container }>
        { groups.map(renderGroup( config, languages)) }
    </ScrollView>;
};


const renderGroup = (config: ProjectConfiguration,languages: string[]) =>
    (group: FieldsViewGroup) =>
        <View key={ group.name }>
            <Text style={ styles.groupLabel }>{ I18N.getLabel(group, languages) }</Text>
            { group.fields.map(renderField(languages, config)) }
        </View>;


const renderField = (languages: string[], config: ProjectConfiguration) =>
    (field: FieldsViewField) =>
        <Column style={ styles.fieldColumn } key={ field.label }>
            <Text style={ styles.fieldLabel }>{ field.label }</Text>
            { renderFieldValue(field, field.value, languages, config) }
        </Column>;


const renderFieldValue =
        (field: FieldsViewField, value: unknown, languages: string[], config: ProjectConfiguration): ReactNode =>
    field.type === 'relation'
        ? field.targets?.map(renderRelationTarget( config, languages))
        : field.type === 'default' && typeof value === 'string'
            ? renderStringValue(value)
            : field.type === 'array' && Array.isArray(value)
                ? value.map(value => renderFieldValue(field, value, languages, config))
                : renderObjectValue(value, field, languages);


const renderStringValue = (value: string) => <Text key={ value }>{ value }</Text>;


const renderObjectValue = (value: unknown, field: FieldsViewField, languages: string[]) =>
    <Text>
        { FieldsViewUtil.getObjectLabel(
            value,
            field,
            getTranslation(languages),
            (value: number) => value.toLocaleString(languages),
            new Labels(() => languages)
        ) }
    </Text>;


// const renderRelation = (config: ProjectConfiguration) =>
//     (relation: FieldsViewRelation) =>
//         <Column style={ styles.fieldColumn } key={ relation.label }>
//             <Text style={ styles.fieldLabel }>{ relation.label }</Text>
//             { relation.targets.map(renderRelationTarget( config)) }
//         </Column>;


const renderRelationTarget = (config: ProjectConfiguration, languages: string[]) =>
    (target: Document) =>
        <DocumentButton
            key={ target.resource.id }
            disabled={ true }
            config={ config }
            document={ target }
            size={ 20 }
            languages={ languages }
        />;


const getTranslation = (_languages: string[]) =>
    (key: string) => translations[key];


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
    }
});


export default DocumentDetails;
