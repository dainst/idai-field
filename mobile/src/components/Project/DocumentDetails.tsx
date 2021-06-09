/* eslint-disable react/display-name */
import {
    Document, FieldsViewField, FieldsViewGroup, FieldsViewRelation, FieldsViewUtil, LabelUtil,
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
    navigateToDocument: (docId: string) => void;
}


const DrawerContent: React.FC<DocumentDetailsProps> = ({
    config,
    repository,
    docId,
    languages,
    navigateToDocument,
}) => {

    const doc = useDocument(repository, docId);
    const [groups, setGroups] = useState<FieldsViewGroup[]>();
    
    useEffect(() => {

        if (!doc) return;

        FieldsViewUtil.getGroupsForResource(doc.resource, config, repository.datastore, languages)
            .then(setGroups);
    }, [doc, config, repository, languages]);

    if (!doc || !groups) return null;

    return <ScrollView style={ styles.container }>
        { groups.map(renderGroup(navigateToDocument, config, languages)) }
    </ScrollView>;
};


const renderGroup = (
    navigateToDocument: (docId: string) => void,
    config: ProjectConfiguration,
    languages: string[]
) =>
    (group: FieldsViewGroup) =>
        <View key={ group.name }>
            <Text style={ styles.groupLabel }>{ LabelUtil.getLabel(group, languages) }</Text>
            { group.fields.map(renderField(languages)) }
            { group.relations.map(renderRelation(navigateToDocument, config)) }
        </View>;


const renderField = (languages: string[]) =>
    (field: FieldsViewField) =>
        <Column style={ styles.fieldColumn } key={ field.label }>
            <Text style={ styles.fieldLabel }>{ field.label }</Text>
            { renderFieldValue(field, field.value, languages) }
        </Column>;


const renderFieldValue = (field: FieldsViewField, value: unknown, languages: string[]): ReactNode =>
    field.type === 'default' && typeof value === 'string'
        ? renderStringValue(value)
        : field.type === 'array' && Array.isArray(value)
            ? value.map(value => renderFieldValue(field, value, languages))
            : renderObjectValue(value, field, languages);


const renderStringValue = (value: string) => <Text key={ value }>{ value }</Text>;


const renderObjectValue = (value: unknown, field: FieldsViewField, languages: string[]) =>
    <Text>
        { FieldsViewUtil.getObjectLabel(
            value,
            field,
            getTranslation(languages),
            (value: number) => value.toLocaleString(languages)
        ) }
    </Text>;


const renderRelation = (navigateToDocument: (docId: string) => void, config: ProjectConfiguration) =>
    (relation: FieldsViewRelation) =>
        <Column style={ styles.fieldColumn } key={ relation.label }>
            <Text style={ styles.fieldLabel }>{ relation.label }</Text>
            { relation.targets.map(renderRelationTarget(navigateToDocument, config)) }
        </Column>;


const renderRelationTarget = (navigateToDocument: (docId: string) => void, config: ProjectConfiguration) =>
    (target: Document) =>
        <DocumentButton
            key={ target.resource.id }
            onPress={ () => navigateToDocument(target.resource.id) }
            config={ config }
            document={ target }
            size={ 20 }
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


export default DrawerContent;
