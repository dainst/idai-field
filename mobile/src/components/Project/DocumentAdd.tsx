import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import {
    Category, Document, Field,
    Group, NewDocument, NewResource, Resource
} from 'idai-field-core';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { FlatList, Keyboard, SafeAreaView, StyleSheet, TextStyle, TouchableOpacity, View } from 'react-native';
import { isUndefinedOrEmpty } from 'tsfun';
import { ConfigurationContext } from '../../contexts/configuration-context';
import LabelsContext from '../../contexts/labels/labels-context';
import useToast from '../../hooks/use-toast';
import { DocumentRepository } from '../../repositories/document-repository';
import { colors } from '../../utils/colors';
import Button from '../common/Button';
import CategoryIcon from '../common/CategoryIcon';
import EditFormField from '../common/forms/EditFormField';
import Heading from '../common/Heading';
import I18NLabel from '../common/I18NLabel';
import TitleBar from '../common/TitleBar';
import { ToastType } from '../common/Toast/ToastProvider';
import { DocumentsContainerDrawerParamList } from './DocumentsContainer';

type DocumentAddNav = DrawerNavigationProp<DocumentsContainerDrawerParamList, 'DocumentAdd'>;

interface DocumentAddProps {
    repository: DocumentRepository;
    navigation: DocumentAddNav;
    parentDoc: Document;
    categoryName: string;
}

const DocumentAdd: React.FC<DocumentAddProps> = ({ repository, navigation, parentDoc, categoryName }) => {
    
    const config = useContext(ConfigurationContext);
    const { labels } = useContext(LabelsContext);

    const [category, setCategory] = useState<Category>();
    const [activeGroup, setActiveGroup] = useState<Group>();
    const [newResource, setNewResource] = useState<NewResource>();
    const [saveBtnEnabled, setSaveBtnEnabled] = useState<boolean>(false);
    const { showToast } = useToast();

    const setResourceToDefault = useCallback(() =>
        setNewResource({
            identifier: '',
            relations: createRelations(parentDoc),
            category: categoryName
        }),[parentDoc, categoryName]);
   
    useEffect(() => setResourceToDefault,[setResourceToDefault, category]);

    useEffect(() => {

        if(newResource?.identifier) setSaveBtnEnabled(true);
        else setSaveBtnEnabled(false);
    },[newResource]);

    useEffect(() => {
        
        const category = config.getCategory(categoryName);
        setCategory(category);
        if(category) setActiveGroup(category?.groups[0]);
    },[config, categoryName]);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateResource = (key: string, value: any) =>
        setNewResource(oldResource => oldResource && { ...oldResource, [key]: value });

    const saveButtonHandler = () => {
        
        if(newResource){
            const newDocument: NewDocument = {
                resource: newResource
            };
            repository.create(newDocument)
                .then(doc => {
                    showToast(ToastType.Success,`Created ${doc.resource.identifier}`);
                    setResourceToDefault();
                    navigation.navigate('DocumentsMap',{ highlightedDocId: doc.resource.id });
                })
                .catch(_err => {
                    Keyboard.dismiss();
                    showToast(ToastType.Error,'Could not create resource!');
                    console.log(_err);
                });
        }
    };

    const onReturn = () => {
        setResourceToDefault();
        navigation.navigate('DocumentsMap',{});
    };
    
    if(!category || !activeGroup || !labels) return null;
    
    const renderItem = ({ item }: {item: Group}) => (
        <TouchableOpacity style={ styles.groupBtn } onPress={ () => setActiveGroup(item) }>
            <I18NLabel style={ styleGroupText(item, activeGroup) } label={ item } />
        </TouchableOpacity>);
    
    return (
        <SafeAreaView style={ styles.container }>
            <TitleBar
                title={
                    <>
                        <CategoryIcon category={ category } size={ 25 } />
                        <Heading style={ styles.heading }>
                            Add {labels.get(category)} to { parentDoc.resource.identifier }
                        </Heading>
                    </>
                }
                left={ <Button
                    variant="transparent"
                    onPress={ onReturn }
                    icon={ <Ionicons name="chevron-back" size={ 18 } /> }
                /> }
                right={ <Button
                    variant="success"
                    onPress={ saveButtonHandler }
                    title="Save"
                    isDisabled={ !saveBtnEnabled }
                    icon={ <MaterialIcons name="save" size={ 18 } color="white" /> }
                /> }
            />
            <View style={ styles.groupsContainer }>
                <FlatList
                    data={ category.groups }
                    keyExtractor={ group => group.name }
                    renderItem={ renderItem }
                    horizontal={ true }
                    showsHorizontalScrollIndicator={ false } />
            </View>
            <View style={ styles.groupForm }>
                {activeGroup.fields.map(fieldDef =>
                    (shouldShow(fieldDef) && newResource) &&
                        <EditFormField
                            key={ fieldDef.name }
                            setFunction={ updateResource }
                            field={ fieldDef }
                            currentValue={ newResource[fieldDef.name] } />)}
            </View>
        </SafeAreaView>
    );
};


const styleGroupText = (activeGroup: Group, group: Group): TextStyle =>
    group.name === activeGroup.name ? { ...styles.groupText, ...styles.groupTextActive } : styles.groupText;


const shouldShow = (field: Field)=> field !== undefined && field.editable === true;


const createRelations = (parentDoc: Document): Resource.Relations => {

    const parentDocIsOperation = () => isUndefinedOrEmpty(parentDoc.resource.relations.isRecordedIn);
    const relations: Resource.Relations = { isRecordedIn:[] };
    
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
        flex: 1,
    },
    heading: {
        marginLeft: 10,
    },
    groupsContainer: {
        margin: 5,
        padding: 5
    },
    groupForm: {
        width: '95%',
        padding: 10
    },
    groupBtn: {
        margin: 4,
    },
    groupText: {
        color: colors.primary,
        fontSize: 20,
        textTransform: 'capitalize',
        padding: 2,
    },
    groupTextActive: {
        color: colors.secondary,
        padding: 5,
        backgroundColor: colors.primary,
        borderRadius: 5,
    }
});


export default DocumentAdd;
