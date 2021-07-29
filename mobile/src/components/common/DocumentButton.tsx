import { Document, ProjectConfiguration } from 'idai-field-core';
import React from 'react';
import { TouchableOpacityProps } from 'react-native';
import CategoryIconButton from './CategoryIconButton';

interface DocumentButtonProps extends TouchableOpacityProps {
    size: number;
    config: ProjectConfiguration;
    languages: string[];
    document: Document;
}


const DocumentButton: React.FC<DocumentButtonProps> = ({ config, document, ...btnProps }) => {

    const category = config.getCategory(document.resource.category);

    if(!category) return null;
    
    return <CategoryIconButton
        category={ category }
        config={ config }
        label={ document.resource.identifier }
        { ...btnProps }
    />;
};

export default DocumentButton;
