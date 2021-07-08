import React, { CSSProperties, ReactElement } from 'react';
import { Card } from 'react-bootstrap';
import { Document } from '../../api/document';
import { getDocumentPermalink } from './document-utils';
import DocumentDetails from './DocumentDetails';
import DocumentPermalinkButton from './DocumentPermalinkButton';
import DocumentTeaser from './DocumentTeaser';
import LicenseInformationButton from './LicenseInformationButton';


interface DocumentCardProps {
    document: Document;
    baseUrl: string;
    cardStyle?: CSSProperties;
    headerStyle?: CSSProperties;
    bodyStyle?: CSSProperties;
}


export default function DocumentCard({ document, baseUrl, cardStyle = {}, headerStyle = {}, bodyStyle = {} }
        : DocumentCardProps): ReactElement {
    
    return (
        <Card style={ cardStyle }>
            <Card.Header className="p-2" style={ { ...headerStyle, ...headerBaseStyle } }>
                <div style={ teaserContainerStyle }>
                    <DocumentTeaser document={ document } showShortDescription="none" />
                </div>
                <div style={ permalinkButtonContainerStyle }>
                    <LicenseInformationButton license={ document.resource.license } />
                    <DocumentPermalinkButton url={ getDocumentPermalink(document) } />
                </div>
            </Card.Header>
            <Card.Body style={ { ...bodyStyle, ...bodyBaseStyle } }>
                <DocumentDetails document={ document } baseUrl={ baseUrl } />
            </Card.Body>
        </Card>
    );
}


const headerBaseStyle: CSSProperties = {
    display: 'flex',
    flex: '0 0 auto'
};


const bodyBaseStyle: CSSProperties = {
    overflow: 'auto'
};


const teaserContainerStyle: CSSProperties = {
    flex: '1 1'
};


const permalinkButtonContainerStyle: CSSProperties = {
    display: 'flex',
    flex: '0 0 45px',
    alignItems: 'center'
};
