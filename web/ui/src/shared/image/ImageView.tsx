import { mdiMenuLeft } from '@mdi/js';
import Icon from '@mdi/react';
import L from 'leaflet';
import React, { CSSProperties, ReactElement, ReactNode, useContext, useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';
import { Map, ZoomControl } from 'react-leaflet';
import { useParams } from 'react-router-dom';
import { Document } from '../../api/document';
import { get } from '../../api/documents';
import { makeUrl } from '../../api/image';
import { NAVBAR_HEIGHT, SIDEBAR_WIDTH } from '../../constants';
import { getDocumentPermalink } from '../document/document-utils';
import DocumentDetails from '../document/DocumentDetails';
import DocumentPermalinkButton from '../document/DocumentPermalinkButton';
import DocumentTeaser from '../document/DocumentTeaser';
import LicenseInformationButton from '../document/LicenseInformationButton';
import LinkButton from '../linkbutton/LinkButton';
import { useSearchParams } from '../location';
import { LoginContext } from '../login';
import IiifImageLayer from './IiifImageLayer';


export default function ImageView(): ReactElement {

    const { project, id } = useParams<{ project: string, id: string }>();
    const searchParams = useSearchParams();

    const [url, setUrl] = useState<string>(makeUrl(project, id));
    const [document, setDocument] = useState<Document>(null);
    const [comingFrom, setComingFrom] = useState<string>(null);
    const loginData = useContext(LoginContext);

    useEffect(() => {

        setUrl(makeUrl(project, id, loginData.token));
        get(id, loginData.token).then(doc => setDocument(doc));
    }, [id, project, loginData]);

    useEffect(() => {

        setComingFrom(searchParams.get('r'));
    }, [searchParams]);

    return (
        <>
            <div style={ leftSidebarStyle } className="sidebar">
                { document && renderDocumentDetails(document, comingFrom) }
            </div>
            <div style={ containerStyle }>
                <Map style={ mapStyle }
                        center={ [0, 0] }
                        crs={ L.CRS.Simple }
                        zoom={ 0 }
                        zoomControl={ false }
                        attributionControl={ false }>
                    <ZoomControl position="bottomright" />
                    <IiifImageLayer url={ url } />
                </Map>
            </div>
        </>
    );
}


const renderDocumentDetails = (document: Document, comingFrom: string): ReactNode =>
    <Card style={ cardStyle }>
        <Card.Header className="d-flex p-2">
            { comingFrom && <div>
                <LinkButton to={ comingFrom } style={ { height: '100%' } } variant={ 'link' }>
                    <Icon path={ mdiMenuLeft } size={ 1 }></Icon>
                </LinkButton>
            </div> }
            <div style={ teaserContainerStyle }>
                    <DocumentTeaser document={ document } />
                </div>
                <div style={ headerButtonsContainerStyle }>
                    <LicenseInformationButton license={ document.resource.license } />
                    <DocumentPermalinkButton url={ getDocumentPermalink(document) } />
                </div>
        </Card.Header>
        <Card.Body style={ cardBodyStyle }>
            <DocumentDetails document={ document } baseUrl="" />
        </Card.Body>
    </Card>;


const cardStyle: CSSProperties = {
    overflow: 'hidden',
    flexGrow: 1,
    flexShrink: 1
};


const cardBodyStyle: CSSProperties = {
    height: 'calc(100% - 94px)',
    overflow: 'auto'
};


const containerStyle: CSSProperties = {
    height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
    width: `calc(100vw - ${SIDEBAR_WIDTH + 20}px)`,
    display: 'flex',
    position: 'absolute',
    left: `${SIDEBAR_WIDTH + 20}px`,
    flexDirection: 'column',
    alignItems: 'center'
};


const mapStyle: CSSProperties = {
    height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
    width: '100%',
    backgroundColor: '#d3d3cf'
};


const leftSidebarStyle: CSSProperties = {
    height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
    width: `${SIDEBAR_WIDTH + 20}px`,
    position: 'absolute',
    top: NAVBAR_HEIGHT,
    padding: '0 10px 0 10px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#d3d3cf'
};

const teaserContainerStyle: CSSProperties = {
    flex: '1 1'
};


const headerButtonsContainerStyle: CSSProperties = {
    display: 'flex',
    flex: '0 0 45px',
    alignItems: 'center'
};
