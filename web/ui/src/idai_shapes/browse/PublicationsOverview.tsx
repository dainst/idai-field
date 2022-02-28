import { mdiMapSearch } from '@mdi/js';
import { mdiOpenInNew } from '@mdi/js';
import Icon from '@mdi/react';
import React, { ReactElement, useContext, useEffect, useState, ReactNode, CSSProperties } from 'react';
import { Tooltip } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Document } from '../../api/document';
import BrowseContext from './Browse';

import { search, searchAggLiterature } from '../../api/documents';
import { Query } from '../../api/query';
import { Result, ResultFilter, FilterBucket, ResultDocument } from '../../api/result';
import CONFIGURATION from '../../configuration.json';
import DocumentGrid from '../../shared/documents/DocumentGrid';
import LinkButton from '../../shared/linkbutton/LinkButton';
import { LoginContext } from '../../shared/login';
import { useGetChunkOnScroll } from '../../shared/scroll';



const CHUNK_SIZE = 50;


export default function PublicationsOverview({ pubs }: { pubs: Result }): ReactElement {

    const loginData = useContext(LoginContext);
    const { t } = useTranslation();

    return <>
            { pubs && pubs.filters[0].values && pubs.filters[0].values.length > 0 &&
                pubs.filters[0].values.map((buckets: FilterBucket) => renderLiterature(buckets.value.name)) }


        </>;
}



const renderLiterature = (zenonId): ReactNode => {

    const label: string = zenonId;

    return <>

        { zenonId &&
            <div>
                <a href={ `https://zenon.dainst.org/Record/${label}` }
                    target="_blank" rel="noopener noreferrer">
                    Zenon <span style={ linkIconContainerStyle }>
                        <Icon path={ mdiOpenInNew } size={ 0.8 } />
                    </span>
                </a>
            </div>
        }
    </>;
};



const listStyle: CSSProperties = {
    marginBottom: '0'
};


const linkIconContainerStyle: CSSProperties = {
    position: 'relative',
    bottom: '1px'
};