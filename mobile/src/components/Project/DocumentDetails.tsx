/* eslint-disable react/display-name */
import { Ionicons } from '@expo/vector-icons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import {
    Document, FieldsViewField, FieldsViewGroup, FieldsViewRelation, FieldsViewUtil, LabelUtil,
    ProjectConfiguration
} from 'idai-field-core';
import React, { ReactNode, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useDocument from '../../hooks/use-document';
import { DocumentRepository } from '../../repositories/document-repository';
import translations from '../../utils/translations';
import Button from '../common/Button';
import CategoryIcon from '../common/CategoryIcon';
import Column from '../common/Column';
import DocumentButton from '../common/DocumentButton';
import Heading from '../common/Heading';
import TitleBar from '../common/TitleBar';
import { DocumentsContainerDrawerParamList } from './DocumentsContainer';


type DocumentDetailsNav = DrawerNavigationProp<DocumentsContainerDrawerParamList, 'DocumentDetails'>;


interface DocumentDetailsProps {
    config: ProjectConfiguration;
    repository: DocumentRepository;
    docId: string;
    navigation: DocumentDetailsNav;
    languages: string[];
}


const DrawerContent: React.FC<DocumentDetailsProps> = ({ config, repository, docId, navigation, languages }) => {

    const doc = useDocument(repository, docId);
    const [groups, setGroups] = useState<FieldsViewGroup[]>();
    
    useEffect(() => {

        if (!doc) return;

        FieldsViewUtil.getGroupsForResource(doc.resource, config, repository.datastore, languages)
            .then(setGroups);
    }, [doc, config, repository, languages]);

    if (!doc || !groups) return null;

    return (
        <SafeAreaView style={ { flex: 1 } }>
            <TitleBar
                title={ <>
                    <CategoryIcon
                        size={ 30 }
                        config={ config }
                        document={ doc }
                    />
                    <Heading style={ styles.heading }>{ doc.resource.identifier }</Heading>
                </> }
                left={ <Button
                    variant="transparent"
                    onPress={ () => navigation.navigate('DocumentsMap') }
                    icon={ <Ionicons name="chevron-back" size={ 18 } /> }
                /> }
                right={ <Button
                    variant="transparent"
                    onPress={ () => { return; } }
                    icon={ <Ionicons name="pencil" size={ 18 } /> } /> }
            />
            <ScrollView style={ styles.container }>
                { groups.map(renderGroup(navigation, config, languages)) }
            </ScrollView>
        </SafeAreaView>
    );
};


const renderGroup = (
    nav: DocumentDetailsNav,
    config: ProjectConfiguration,
    languages: string[]
) =>
    (group: FieldsViewGroup) =>
        <View key={ group.name }>
            <Text style={ styles.groupLabel }>{ LabelUtil.getLabel(group, languages) }</Text>
            { group.fields.map(renderField(languages)) }
            { group.relations.map(renderRelation(nav, config)) }
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


const renderRelation = (nav: DocumentDetailsNav, config: ProjectConfiguration) => (relation: FieldsViewRelation) =>
    <Column style={ styles.fieldColumn } key={ relation.label }>
        <Text style={ styles.fieldLabel }>{ relation.label }</Text>
        { relation.targets.map(renderRelationTarget(nav, config)) }
    </Column>;


const renderRelationTarget = (nav: DocumentDetailsNav, config: ProjectConfiguration) =>
    (target: Document) =>
        <DocumentButton
            key={ target.resource.id }
            onPress={ () => nav.navigate('DocumentDetails', { docId: target.resource.id }) }
            config={ config }
            document={ target }
            size={ 20 }
        />;


const getTranslation = (_languages: string[]) =>
    (key: string) => translations[key];


const styles = StyleSheet.create({
    heading: {
        marginLeft: 10,
    },
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
