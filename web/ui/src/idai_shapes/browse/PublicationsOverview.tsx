import { mdiMapSearch } from '@mdi/js';
import { mdiOpenInNew } from '@mdi/js';
import Icon from '@mdi/react';
import React, { ReactElement, useContext, useEffect, useState, ReactNode, CSSProperties, ReactNodeArray } from 'react';
import { Tooltip } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Document } from '../../api/document';
import BrowseContext from './Browse';
import LiteratureThumbnail from './LiteratureThumbnail';
import { search, searchAggLiterature } from '../../api/documents';
import { Query } from '../../api/query';
import { Result, ZenonResult, ResultFilter, FilterBucket, ResultDocument, ZenonRecord } from '../../api/result';
import CONFIGURATION from '../../configuration.json';
import DocumentGrid from '../../shared/documents/DocumentGrid';
import LinkButton from '../../shared/linkbutton/LinkButton';
import { LoginContext } from '../../shared/login';
import { useGetChunkOnScroll } from '../../shared/scroll';
import { Literature } from 'idai-field-core';


interface PublicationsOverviewProps {
    pubs: Result;
    tabKeyleft: string;
}

//const zenonlink_url = 'https://zenon.dainst.org/api/v1/record?id='
const listStyle: CSSProperties = {
    marginBottom: '0'
};


const linkIconContainerStyle: CSSProperties = {
    position: 'relative',
    bottom: '1px'
};
const zenonbase_url = 'https://zenon.dainst.org/api/v1/record';

const fetchGet = async (uri: string, pubs: Result): Promise<ZenonResult> => {
    //const headers = getHeaders(token);
    //headers['Content-Type'] = 'application/json';
    //record?id[]=000009465&id[]=000955317
    const form= new FormData()
    pubs.filters[0].values.map((buckets: FilterBucket)=> form.append("id[]",buckets.value.name));
    const response = await fetch(uri, { method: 'POST',body: form});
    console.log('Hier response',response)
    return response.json();
};

const renderLiteratures = (literatures: ZenonResult): ReactElement => 
    <div >
        { literatures.records.map((literature: ZenonRecord) => renderLiterature(literature)) }
    </div>;

const renderLiterature = (literature: ZenonRecord): ReactElement => {
    const lits =
        (<div>
            <LiteratureThumbnail
                literature={literature}
            />
        </div>);
    return lits
}

export default function PublicationsOverview({ pubs, tabKeyleft }: PublicationsOverviewProps): ReactElement {
    const [zenonresult, setZenonresult] = useState<ZenonResult>(null);
    const [divresult, setDivresult] = useState<ReactElement>(null);
    const loginData = useContext(LoginContext);
    const { t } = useTranslation();
    useEffect(() => {
        if (tabKeyleft == 'publications') {
            fetchGet(zenonbase_url, pubs )
                .then(result => renderLiteratures(result))
                .then(result => setDivresult(result))

        }
    
    }, [tabKeyleft]); 

    return <div>{divresult}</div>
}





