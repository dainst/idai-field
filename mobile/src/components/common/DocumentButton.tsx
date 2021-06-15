import { Document } from 'idai-field-core';
import React from 'react';
import IconButton, { IconButtonBaseProps } from './IconButton';

interface DocumentButtonProps extends IconButtonBaseProps{
    document: Document;
}


const DocumentButton: React.FC<DocumentButtonProps> = ({ document, ...btnProps }) => {

    return <IconButton
                text={ document.resource.identifier }
                category={ document.resource.category }
                { ...btnProps } />;
};

export default DocumentButton;