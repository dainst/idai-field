import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import {
    Category, Document, FieldDefinition,
    Group, NewResource, ProjectConfiguration, Relations
} from 'idai-field-core';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TextStyle, TouchableOpacity } from 'react-native';
import { isUndefinedOrEmpty } from 'tsfun';
import { DocumentRepository } from '../../repositories/document-repository';
import { colors } from '../../utils/colors';
import Button from '../common/Button';
import CategoryIcon from '../common/CategoryIcon';
import Column from '../common/Column';
import EditFormField from '../common/forms/EditFormField';
import Heading from '../common/Heading';
import Row from '../common/Row';
import TitleBar from '../common/TitleBar';
import { DocumentsContainerDrawerParamList } from './DocumentsContainer';

type DocumentAddNav = DrawerNavigationProp<DocumentsContainerDrawerParamList, 'DocumentAdd'>;

interface DocumentAddProps {
    config: ProjectConfiguration;
    repository: DocumentRepository;
    navigation: DocumentAddNav;
    parentDoc: Document;
    category: Category;
}

const DocumentAdd: React.FC<DocumentAddProps> = ({ config, repository, navigation ,parentDoc, category }) => {
    
    const [activeGroup, setActiveGroup] = useState<Group>(category.groups[0]);
    const [newResource, setNewResource] = useState<NewResource>();
    const [saveBtnEnabled, setSaveBtnEnabled] = useState<boolean>(false);

   
    useEffect(() => {

        setNewResource({
                identifier: '',
                relations: createRelations(parentDoc),
                category: category.name
        });

    },[parentDoc, category]);

    
    useEffect(() => {

        if(newResource?.identifier) setSaveBtnEnabled(true);
        else setSaveBtnEnabled(false);
    },[newResource]);

    
    const updateResource = (key: string, value: any) =>
        setNewResource(oldResource => oldResource && { ...oldResource, [key]: value });
    
    
    return (
        <SafeAreaView style={ styles.container }>
            <TitleBar
                title={
                    <>
                        <CategoryIcon category={ category.name } config={ config } size={ 25 } />
                        <Heading style={ styles.heading }>
                            Add {category.name} to { parentDoc.resource.identifier }
                        </Heading>
                    </>
                }
                left={ <Button
                    variant="transparent"
                    onPress={ () => navigation.navigate('DocumentsMap',{}) }
                    icon={ <Ionicons name="chevron-back" size={ 18 } /> }
                /> }
                right={ <Button
                    variant="success"
                    onPress={ () => console.log('Save') }
                    title="Save"
                    isDisabled={ !saveBtnEnabled }
                    icon={ <MaterialIcons name="save" size={ 18 } color="white" /> }
                /> }
            />
            <Row style={ styles.formContainer }>
                <Column style={ styles.groupColumn }>
                    {category.groups.map(group => (
                        <TouchableOpacity
                            key={ group.name } style={ styles.groupBtn }
                            onPress={ () => setActiveGroup(group) }>
                            <Text style={ styleGroupText(group, activeGroup) }>{group.name}</Text>
                        </TouchableOpacity>))}
                </Column>
                <Column style={ styles.fieldColumn }>
                    {activeGroup.fields.map(fieldDef =>
                        (shouldShow(fieldDef) && newResource) &&
                            <EditFormField
                                setFunction={ updateResource }
                                fieldDefinition={ fieldDef }
                                resource={ newResource } />)}
                </Column>
            </Row>
        </SafeAreaView>
    );
};


const styleGroupText = (activeGroup: Group, group: Group): TextStyle =>
    group.name === activeGroup.name ? { ...styles.groupText, ...styles.groupTextActive } : styles.groupText;


const shouldShow = (field: FieldDefinition)=> field !== undefined && field.editable === true;


const createRelations = (parentDoc: Document): Relations => {

    const parentDocIsOperation = () => isUndefinedOrEmpty(parentDoc.resource.relations.isRecordedIn);
    const relations: Relations = { isRecordedIn:[] };
    
    if(parentDocIsOperation()){
        relations['isRecordedIn'] = [parentDoc.resource.id];
    } else {
        relations['isRecordedIn'] = [ parentDoc.resource.relations.isRecordedIn[0]];
        relations['liesWithin'] = [parentDoc.resource.id];
    }
    return relations;
};


const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1
    },
    heading: {
        marginLeft: 10,
    },
    formContainer: {
        margin: 20,
        justifyContent: 'flex-start',
        flex: 1
    },
    groupColumn: {
        backgroundColor: colors.lightgray,
        width: '30%',
        height: '50%',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        marginRight: 50,
        paddingHorizontal: 30,
        paddingVertical: 10
    },
    groupBtn: {
        margin: 1,
        width: '100%'
    },
    groupText: {
        color: colors.primary,
        fontSize: 20,
        textTransform: 'capitalize',
        padding: 2,
    },
    groupTextActive: {
        color: colors.secondary,
        backgroundColor: colors.primary,
        borderRadius: 2,
    },
    fieldColumn: {
        flex: 1
    }
});


export default DocumentAdd;