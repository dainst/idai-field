import { mdiClose, mdiEarth } from '@mdi/js';
import Icon from '@mdi/react';
import { TFunction } from 'i18next';
import React, { CSSProperties, ReactElement, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import Modal from 'react-modal';
import { I18N } from 'idai-field-core';
import { getUserInterfaceLanguage, LANGUAGES, USER_INTERFACE_LANGUAGES } from '../languages';


export default function LanguageButton(): ReactElement {

    const [modalOpened, setModalOpened] = useState(false);
    const { t } = useTranslation();

    return <>
        <Button variant="link" style={ languageButtonStyle } onClick={ () => setModalOpened(true) }>
            <Icon path={ mdiEarth } size={ 1 } />
        </Button>
        { renderLanguageModal(modalOpened, setModalOpened, t) }
    </>;
}


const renderLanguageModal = (modalOpened: boolean, setModalOpened: (opened: boolean) => void,
                             t: TFunction) => (

    <Modal isOpen={ modalOpened } onRequestClose={ () => setModalOpened(false) } style={ modalStyle }>
        <Button onClick={ () => setModalOpened(false) } style={ closeButtonStyle }>
            <Icon path={ mdiClose } size={ 0.8 } className="close-button-icon" />
        </Button>
        <h2 style={ paragraphStyle }>{ t('navbar.languageModal.title') }</h2>
        <div style={ paragraphStyle }>{ t('navbar.languageModal.info') }</div>
        <div style={ paragraphStyle }>
            <div>
                { t('navbar.languageModal.userInterfaceLanguage') }
                <strong> { t('languages.' + getUserInterfaceLanguage()) }</strong>
            </div>
            <div style={ smallInfoStyle }>
                <span>{ t('navbar.languageModal.availableUserInterfaceLanguages') } </span>
                { USER_INTERFACE_LANGUAGES.map(language => t('languages.' + language)).join(', ') }
            </div>
        </div>
        <div style={ paragraphStyle }>
            <div>{ t('navbar.languageModal.configurationLanguages') }</div>
            <ol style={ languageListStyle }>
                { getDataLanguages().map(language => <li key={ language }>{ t('languages.' + language) }</li>) }
            </ol>
        </div>
    </Modal>
);


const getDataLanguages = () => {
    
    return LANGUAGES.filter(language => language !== I18N.UNSPECIFIED_LANGUAGE);
};


const languageButtonStyle: CSSProperties = {
    marginRight: '7px'
};


const modalStyle = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        minWidth: '500px',
    },
    overlay: {
        zIndex: 1000
    }
};


const paragraphStyle: CSSProperties = {
    marginBottom: '1rem'
};


const smallInfoStyle: CSSProperties = {
    fontSize: '14px'
};


const languageListStyle: CSSProperties = {
    maxHeight: '290px',
    overflow: 'auto'
};


const closeButtonStyle: CSSProperties = {
    position: 'relative',
    top: '2px',
    height: '25px',
    width: '25px',
    float: 'right',
    padding: '0'
};
