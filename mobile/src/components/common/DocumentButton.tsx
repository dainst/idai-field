import { Document, ProjectConfiguration } from 'idai-field-core';
import React from 'react';
import IconButton, { IconButtonBaseProps } from './IconButton';

interface DocumentButtonProps extends IconButtonBaseProps{
    config: ProjectConfiguration;
    document: Document;
}


const DocumentButton: React.FC<DocumentButtonProps> = ({ config, document, ...btnProps }) => {

    const category = config.getCategory(document.resource.category);

    if(!category) return null;
    
    return <IconButton
                category={ category }
                config={ config }
                { ...btnProps } />;
};

export default DocumentButton;