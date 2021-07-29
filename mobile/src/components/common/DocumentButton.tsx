import { Document, ProjectConfiguration } from 'idai-field-core';
import React from 'react';
import { TouchableOpacityProps } from 'react-native';
import IconButton from './IconButton';

interface DocumentButtonProps extends TouchableOpacityProps {
    size: number;
    config: ProjectConfiguration;
    languages: string[];
    document: Document;
}


const DocumentButton: React.FC<DocumentButtonProps> = ({ config, document, ...btnProps }) => {

    const category = config.getCategory(document.resource.category);

    if(!category) return null;
    
    return <IconButton
        category={ category }
        config={ config }
        label={ document.resource.identifier }
        { ...btnProps }
    />;
};

export default DocumentButton;
