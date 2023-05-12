import { mdiCloseCircle, mdiMagnify } from '@mdi/js';
import Icon from '@mdi/react';
import React, { CSSProperties, FormEvent, ReactElement, useEffect, useRef, useState } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { parseFrontendGetParams } from '../../api/query';
import { useSearchParams } from '../location';


export default function SearchBar({ onSubmit, basepath }
        : { onSubmit?: () => void, basepath: string }): ReactElement {
    
    const history = useHistory();
    const searchParams = useSearchParams();
    const { t } = useTranslation();

    const [queryString, setQueryString] = useState(undefined);
    const input = useRef<HTMLInputElement>();

    useEffect(() => {
        setQueryString(parseQueryString(searchParams));
    }, [searchParams]);

    
    const submitSearch = (e: FormEvent): void => {
        e.preventDefault();
        history.push(`${basepath}?q=${queryString ?? '*'}`);
        if (onSubmit) onSubmit();
    };

    const resetQueryString = (): void => {
        // We deliberately set back everything here in order
        // to get rid of any category filters or specific field filters.
        // We could think about retaining a possible 'r=' param here.
        // See also comment in DocumentHierarchy.tsx.
        const params = new URLSearchParams();
        input.current.value = '';
        history.push(`${basepath}?${params}`);
    };

    return (
        <Form onSubmit={ submitSearch }>
            <InputGroup>
                <Form.Control
                    autoFocus={ true }
                    type="text"
                    placeholder={ t('searchBar.search') }
                    value={ queryString ?? '' }
                    onChange={ e => setQueryString(e.target.value) }
                    ref={ input }
                    style={ getInputStyle(isResetQueryButtonVisible(searchParams)) } />
                <InputGroup.Append>
                    { isResetQueryButtonVisible(searchParams) &&
                        <Button variant="link" onClick={ resetQueryString } style={ resetButtonStyle }>
                            <Icon path={ mdiCloseCircle } size={ 0.8 } />
                        </Button>
                    }
                    <Button variant="primary" type="submit" style={ searchButtonStyle }>
                        <Icon path={ mdiMagnify } size={ 0.8 } />
                    </Button>
                </InputGroup.Append>
            </InputGroup>
        </Form>
    );
}


const parseQueryString = (searchParams: URLSearchParams): string => {

    const queryString = parseFrontendGetParams(searchParams).q;
    return queryString === '*' ? '' : queryString;
};


const isResetQueryButtonVisible = (searchParams: URLSearchParams): boolean => {

    const q = searchParams.get('q');
    return q && q.length > 0 && q !== '*';
};


const getInputStyle = (resetButtonVisible: boolean): CSSProperties => ({
    border: 'none',
    paddingRight: resetButtonVisible ? 0 : '12px'
});


const resetButtonStyle: CSSProperties = {
    paddingTop: '4px',
    paddingLeft: '12px',
    paddingRight: '12px',
    backgroundColor: 'white',
    border: 'none'
};


const searchButtonStyle: CSSProperties = {
    zIndex: 3
};
