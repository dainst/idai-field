import { mdiLinkVariant } from '@mdi/js';
import Icon from '@mdi/react';
import { TFunction } from 'i18next';
import React, { CSSProperties, MutableRefObject, ReactElement, useRef } from 'react';
import { Button, OverlayTrigger, Popover } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';


export default function DocumentPermalinkButton({ url }: { url: string })
        : ReactElement {

    const inputElementRef: MutableRefObject<HTMLInputElement> = useRef();
    const { t } = useTranslation();

    return <OverlayTrigger trigger="click" placement="auto" rootClose
                           overlay={ getPopover(url, inputElementRef, t) }>
        <Button variant="link" style={ buttonStyle }
                onClick={ () => selectPermalink(inputElementRef) }>
            <div style={ iconStyle }>
              <Icon path={ mdiLinkVariant } />
            </div>
        </Button>
    </OverlayTrigger>;
}


const getPopover = (url: string, inputElementRef: MutableRefObject<HTMLInputElement>, t: TFunction): ReactElement =>
    <Popover id="document-link-popover" style={ popoverStyle }>
        <Popover.Title as="h3">{ t('permalinkButton.title') }</Popover.Title>
        <Popover.Content>
            <input ref={ inputElementRef } readOnly
                value={ url }
                style={ inputStyle } />
        </Popover.Content>
    </Popover>;


const selectPermalink = (inputElementRef: MutableRefObject<HTMLInputElement>) => {

    if (inputElementRef?.current) return;
    
    const observer = new MutationObserver(() => {
        if (inputElementRef?.current) {
            inputElementRef.current.select();
            observer.disconnect();
        }
    });

    observer.observe(document, { childList: true, subtree: true });
};


const buttonStyle: CSSProperties = {
    width: '45px',
    color: 'black',
    boxShadow: 'none'
};


const iconStyle: CSSProperties = {
    position: 'relative',
    bottom: '1px'
};


const popoverStyle: CSSProperties = {
    width: '550px',
    maxWidth: '550px'
};


const inputStyle: CSSProperties = {
    width: '100%'
};
