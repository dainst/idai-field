import { mdiInboxArrowUp, mdiPencilOutline } from '@mdi/js';
import Icon from '@mdi/react';
import React, { ReactElement, useContext, useEffect, useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { search } from '../../api/documents';
import { Query } from '../../api/query';
import { Result, ResultDocument } from '../../api/result';
import DocumentGrid from '../../shared/documents/DocumentGrid';
import { LoginContext } from '../../shared/login';
import SearchBar from '../../shared/search/SearchBar';
import { SHAPES_PROJECT_ID } from '../constants';
import './home.css';
import Draw from '../draw/Draw';
import FileBrowser from '../filebrowser/FileBrowser';


const NUM_CATALOGS = 7;
enum searchComp {
    Text,
    Draw,
    Image
}

export default function Home(): ReactElement {

    const [documents, setDocuments] = useState<ResultDocument[]>(null);
    const [serachBarComp, setsearchBarComp] = useState<searchComp>(searchComp.Text);
    const loginData = useContext(LoginContext);
    const { t } = useTranslation();

    useEffect(() => {
        searchCatalogDocuments(loginData.token)
            .then(result => setDocuments(result.documents));
    }, [loginData]);

    const getDocumentLink = (document: ResultDocument): string => `document/${document.resource.id}`;
    const showFuncBarComp = (component: searchComp) => setsearchBarComp(component);

    return (
        <>
            <Container fluid className="shapes-home p-0">
                <div className="search-background">
                    <div className="search-container">
                        <h1>iDAI.<b>shapes</b></h1>
                        { renderSearchComponents(serachBarComp) }
                        { renderFunctionBar(t, showFuncBarComp) }
                    </div>
                </div>
            </Container>
            <Container>
                <Row className="catalog">
                    <Col>
                        <h1 className="my-5">{ t('shapes.home.catalogs') }</h1>
                        <DocumentGrid documents={ documents } getLinkUrl={ getDocumentLink } />
                    </Col>
                </Row>
                <Row>
                    <Col className="text-right">
                        <Link to="document/">{ t('shapes.home.showAllCatalogs') }</Link>
                    </Col>
                </Row>
            </Container>
        </>
    );
}


const searchCatalogDocuments = async (token: string): Promise<Result> => {
    
    const query: Query = {
        size: NUM_CATALOGS,
        filters: [
            { field: 'project', value: SHAPES_PROJECT_ID },
            { field: 'resource.category.name', value: 'TypeCatalog' }
        ],
        parent: 'root'
    };
    
    return search(query, token);
};


const renderFunctionBar = (t: TFunction, showComp: (searchComp) => void): ReactElement => (
    <div className="d-flex justify-content-around mt-2">
        <div className="p-1">
            <p>{ t('shapes.home.searchBy') }</p>
        </div>
        <div className="d-flex p-1 function-bar-link" onClick={ () => showComp(searchComp.Text) }>
            <p>{ t('shapes.home.textSearch') }</p>
        </div>
        <div className="d-flex p-1 function-bar-link" onClick={ () => showComp(searchComp.Draw) }>
            <Icon path={ mdiPencilOutline } size={ 0.9 } />
            <p>{ t('shapes.home.drawingShape') }</p>
        </div>
        <div className="d-flex p-1 function-bar-link" onClick={ () => showComp(searchComp.Image) }>
            <Icon path={ mdiInboxArrowUp } size={ 0.9 } />
            <p>{ t('shapes.home.uploadingImageFile') }</p>
        </div>
    </div>
);

const renderSearchComponents = (component: searchComp): ReactElement => {
    if (component === searchComp.Text)
        return <SearchBar basepath="document/" />;
    else if (component === searchComp.Draw)
        return <Draw />;
    else return <FileBrowser />;
};