import { Ionicons } from '@expo/vector-icons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Category, Document, ProjectConfiguration } from 'idai-field-core';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { DocumentRepository } from '../../repositories/document-repository';
import Button from '../common/Button';
import CategoryButton from '../common/CategoryButton';
import Heading from '../common/Heading';
import TitleBar from '../common/TitleBar';
import { DocumentsContainerDrawerParamList } from './DocumentsContainer';

const ICON_SIZE = 30;

type DocumentAddNav = DrawerNavigationProp<DocumentsContainerDrawerParamList, 'DocumentAdd'>;

interface DocumentAddProps {
    config: ProjectConfiguration;
    repository: DocumentRepository;
    navigation: DocumentAddNav;
    isInOverview: () => boolean;
    parentDoc: Document;
}

const DocumentAdd: React.FC<DocumentAddProps> = ({ config, repository, navigation, isInOverview ,parentDoc }) => {
    
    const [categories, setCategories] = useState<Category[]>([]);
    

    const isAllowedCategory = useCallback( (category: Category) => {

        if(category.name === 'Image') return false;
        if(isInOverview()){
            if (!config.isAllowedRelationDomainCategory(
                category.name, parentDoc.resource.category, 'isRecordedIn')) return false;
            return !category.mustLieWithin;
        } else {
            return config.isAllowedRelationDomainCategory(category.name, parentDoc.resource.category, 'liesWithin');
        }
        
    },[config, isInOverview, parentDoc]);

    
    useEffect(() => {
        const categories: Category[] = [];
        config.getCategoriesArray().forEach(category => {
            if(isAllowedCategory(category) && (!category.parentCategory || !isAllowedCategory(category.parentCategory)))
                categories.push(category);
        });
        setCategories(categories);
    },[isAllowedCategory, isInOverview, config]);


    return (
        <SafeAreaView style={ styles.container }>
            <TitleBar
                title={
                    <Heading style={ styles.heading }>
                        Add child to { parentDoc.resource.identifier }
                    </Heading>
                }
                left={ <Button
                    variant="transparent"
                    onPress={ () => navigation.navigate('DocumentsMap',{}) }
                    icon={ <Ionicons name="chevron-back" size={ 18 } /> }
                /> }
            />
            <View style={ styles.categories }>
                {categories.map(category => (
                    <View key={ category.name } >
                        <CategoryButton
                            config={ config } size={ ICON_SIZE }
                            style={ { margin: 5 } }
                            category={ category.name } />
                        {renderCategoryChilds(category, config)}
                    </View>
                ))}
            </View>
        </SafeAreaView>
    );
};

const renderCategoryChilds = (category: Category, config: ProjectConfiguration) => {
    return <View style={ categoryChildStyles.container }>
        {category.children.map(category => (
            <CategoryButton
                key={ category.name }
                config={ config } size={ ICON_SIZE }
                category={ category.name }
                style={ { margin: 2.5 } }
            />
        ))}
    </View>;
};

const categoryChildStyles = StyleSheet.create({
    container: {
        marginLeft:20
    }
});


const styles = StyleSheet.create({
    container: {
        padding: 10,
        flex: 1
    },
    heading: {
        marginLeft: 10,
    },
    categories: {
        margin: 10
    }
});

export default DocumentAdd;