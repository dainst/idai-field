/* eslint-disable react/display-name */
import { Ionicons } from '@expo/vector-icons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import {
    Document, FieldsViewField, FieldsViewGroup, FieldsViewRelation,
    FieldsViewUtil, ProjectConfiguration
} from 'idai-field-core';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DocumentRepository } from '../../repositories/document-repository';
import Button from '../common/Button';
import CategoryIcon from '../common/CategoryIcon';
import Column from '../common/Column';
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

    const [doc, setDoc] = useState<Document>();
    const [groups, setGroups] = useState<FieldsViewGroup[]>();

    useEffect(() => {

        repository.get(docId).then(setDoc);
    }, [repository, docId]);

    useEffect(() => {

        if (!doc) return;

        FieldsViewUtil.getGroupsForResource(doc.resource, config, repository.datastore, languages)
            .then(setGroups);
    }, [doc, config, repository, languages]);

    if (!doc || !groups) return null;

    return (
        <SafeAreaView>
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
                { groups.map(renderGroup(navigation, config)) }
            </ScrollView>
        </SafeAreaView>
    );
};


const renderGroup = (nav: DocumentDetailsNav, config: ProjectConfiguration) => (group: FieldsViewGroup) =>
    <View>
        <Text style={ styles.groupLabel }>{ group.label }</Text>
        { group.fields.map(renderField) }
        { group.relations.map(renderRelation(nav, config)) }
    </View>;


const renderField = (field: FieldsViewField) =>
    <Column style={ styles.fieldColumn }>
        <Text style={ styles.fieldLabel }>{ field.label }</Text>
        { field.type === 'default' && typeof field.value === 'string'
            ? renderStringValue(field.value)
            : field.type === 'array' && Array.isArray(field.value)
                ? renderArrayValue(field.value)
                : renderObjectValue(field.value)
        }
    </Column>;


const renderArrayValue = (values: string[]) => values.map(renderStringValue);


const renderStringValue = (value: string) => <Text key={ value }>{ value }</Text>;


// TODO
const renderObjectValue = (_: unknown) => <Text>[Object type rendering is not implemented yet]</Text>;


const renderRelation = (nav: DocumentDetailsNav, config: ProjectConfiguration) => (relation: FieldsViewRelation) =>
    <Column style={ styles.fieldColumn }>
        <Text style={ styles.fieldLabel }>{ relation.label }</Text>
        { relation.targets.map(renderRelationTarget(nav, config)) }
    </Column>;


const renderRelationTarget = (nav: DocumentDetailsNav, config: ProjectConfiguration) => (target: Document) =>
    <Button
        key={ target.resource.id }
        title={ target.resource.identifier }
        onPress={ () => nav.navigate('DocumentDetails', { docId: target.resource.id }) }
        icon={ <CategoryIcon config={ config } document={ target } size={ 20 } /> } />;


const styles = StyleSheet.create({
    heading: {
        marginLeft: 10,
    },
    container: {
        padding: 10,
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
