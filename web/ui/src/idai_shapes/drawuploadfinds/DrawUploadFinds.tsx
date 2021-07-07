import React, { ReactElement, useEffect, useRef, useState, useContext } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Result, ResultDocument } from '../../api/result';
import DocumentGrid from '../../shared/documents/DocumentGrid';
import { Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import './drawuploadfinds.css';
import { useParams } from 'react-router-dom';
import { Query } from '../../api/query';
import { search } from '../../api/documents';
import { LoginContext } from '../../shared/login';

const NUM_DOCUMENTS = 10;

export default function DrawUploadFinds (): ReactElement {

    const [documents, setDocuments] = useState<ResultDocument[]>(null);
    const [dataUrl, setDataUrl] = useState<string>(null);
    const { isDrawing, data } = useParams<{ isDrawing: string ,data: string }>();
    const { t } = useTranslation();
    const loginData = useContext(LoginContext);
    const image = useRef<HTMLImageElement>(null);

    useEffect(() => {

        setDataUrl(decodeURIComponent(data));
    },[data]);

    useEffect(() => {

        searchSimilarDocuments(loginData.token, image.current, isDrawing)
            .then(result => setDocuments(result.documents));
    }, [dataUrl, isDrawing, loginData.token]);
    
    
    return (
        <div className="m-2">
            <img src={ dataUrl } ref={ image } alt="no dataUrl" className="mx-auto d-block" />
            <h1 className="mt-3">{ t('shapes.browse.similarTypes') }</h1>
            {documents?
                <DocumentGrid documents={ documents }
                    getLinkUrl={ (doc: ResultDocument): string => `document/${doc.resource.id}` } /> :
                renderLoadingSpinner(t)
            }
        </div>
    );
}

const renderLoadingSpinner = (t: TFunction): ReactElement => (
    <div>
        <Spinner animation="border" className="spinner-blue" />
        {' '}{ t('shapes.drawfinds.searching') }...
    </div>
);

const searchSimilarDocuments = async (token: string, image:HTMLImageElement, isDrawing: string): Promise<Result> => {

    const query: Query = {
        size: NUM_DOCUMENTS,
        image_query:  {
            model: 'resnet',
            segment_image: isDrawing === 'false',
            image: tf.browser.fromPixels(image,3)

        },
        filters: [{ field: 'resource.category.name' ,value: 'Type' },]
    };

    return search(query, token);
};