import { Ionicons } from '@expo/vector-icons';
import { Category, Document, ProjectConfiguration } from 'idai-field-core';
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import Button from '../common/Button';
import Card from '../common/Card';
import CategoryButton from '../common/CategoryButton';
import Heading from '../common/Heading';
import TitleBar from '../common/TitleBar';

const ICON_SIZE = 30;

interface AddModalProps {
    onAddCategory: (categoryName: string, parentDoc: Document | undefined) => void;
    onClose: () => void;
    config: ProjectConfiguration;
    isInOverview: () => boolean;
    parentDoc?: Document;
}

const AddModal: React.FC<AddModalProps> = (props) => {

    const [categories, setCategories] = useState<Category[]>([]);

    const isAllowedCategory = useCallback( (category: Category) => {

        if(category.name === 'Image' || !props.parentDoc) return false;
        if(props.isInOverview()){
            if (!props.config.isAllowedRelationDomainCategory(
                category.name, props.parentDoc.resource.category, 'isRecordedIn')) return false;
            return !category.mustLieWithin;
        } else {
            return props.config.isAllowedRelationDomainCategory(
                category.name,
                props.parentDoc.resource.category, 'liesWithin');
        }
        
    },[props]);

    
    useEffect(() => {
        const categories: Category[] = [];
        props.config.getCategoriesArray().forEach(category => {
            if(isAllowedCategory(category) && (!category.parentCategory || !isAllowedCategory(category.parentCategory)))
                categories.push(category);
        });
        setCategories(categories);
    },[isAllowedCategory, props]);

    
    const renderButton = (category: Category, style: ViewStyle, key?: string) => (
        <CategoryButton
            config={ props.config } size={ ICON_SIZE }
            category={ category.name }
            style={ style }
            key={ key }
            onPress={ () => props.onAddCategory(category.name, props.parentDoc) } />);


    const renderCategoryChilds = (category: Category) => (
        <View style={ categoryChildStyles.container }>
            {category.children.map(category => renderButton(category,{ margin: 2.5 }, category.name))}
        </View>);
        

    if(!props.parentDoc) return null;

    return (
        <Modal onRequestClose={ props.onClose } animationType="fade"
            transparent visible={ true }>
            <View style={ styles.container }>
                <Card style={ styles.card }>
                    <TitleBar
                        title={
                            <Heading style={ styles.heading }>
                                Add child to { props.parentDoc?.resource.identifier }
                            </Heading>
                        }
                        left={ <Button
                            title="Cancel"
                            variant="transparent"
                            icon={ <Ionicons name="close-outline" size={ 16 } /> }
                            onPress={ props.onClose }
                        /> }
                    />
                    <ScrollView style={ styles.categories }>
                        {categories.map(category => (
                            <View key={ category.name } >
                                {renderButton(category,{ margin: 5 })}
                                {renderCategoryChilds(category)}
                            </View>
                        ))}
                    </ScrollView>
                </Card>
            </View>
            
        </Modal>
    );
};

    
const categoryChildStyles = StyleSheet.create({
    container: {
        marginLeft:20
    }
});


const styles = StyleSheet.create({
    container: {
        flex:1,
        flexDirection: 'column',
        marginTop: 200,
        alignItems: 'center'
    },
    card: {
        padding: 10,
        height: '60%',
        width: '50%',
        opacity: 0.9
    },
    heading: {
        marginLeft: 10,
    },
    categories: {
        margin: 10
    },
    categoryChildContainer: {
        marginLeft: 20
    }
});

export default AddModal;