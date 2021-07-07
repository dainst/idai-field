import React, { CSSProperties, ReactElement, useState } from 'react';
import { Button } from 'react-bootstrap';
import Modal from 'react-modal';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { mdiClose, mdiScaleBalance } from '@mdi/js';
import Icon from '@mdi/react';


export default function LicenseInformationButton({ license }: { license: string }): ReactElement {

    const [modalOpened, setModalOpened] = useState(false);
    const { t } = useTranslation();

    return <>
        { license &&
            <Button variant="link" style={ buttonStyle } onClick={ () => setModalOpened(true) }>
                <div style={ iconStyle }>
                <Icon path={ mdiScaleBalance } />
                </div>
            </Button>
        }
        { renderLicenseInformationModal(modalOpened, setModalOpened, license, t) }
    </>;
}


const renderLicenseInformationModal = (modalOpened: boolean, setModalOpened: (opened: boolean) => void,
                                       license: string, t: TFunction) => (

    <Modal isOpen={ modalOpened } onRequestClose={ () => setModalOpened(false) } style={ modalStyle }>
        <Button onClick={ () => setModalOpened(false) } style={ closeButtonStyle }>
            <Icon path={ mdiClose } size={ 0.8 } className="close-button-icon" />
        </Button>
        <h2 style={ titleStyle }>{ t('licenseInformation.modal.title') }</h2>
        <div style={ licenseTextStyle }>{ license } </div>
    </Modal>
);


const buttonStyle: CSSProperties = {
    width: '45px',
    color: 'black',
    boxShadow: 'none'
};


const iconStyle: CSSProperties = {
    position: 'relative',
    bottom: '1px'
};


const modalStyle = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        width: '700px',
        overflowY: 'auto'
    },
    overlay: {
        zIndex: 1000
    }
};


const titleStyle: CSSProperties = {
    marginBottom: '1rem'
};


const licenseTextStyle: CSSProperties = {
    maxHeight: 'calc(100vh - 200px)',
    overflowY: 'auto',
    whiteSpace: 'pre-line'
};


const closeButtonStyle: CSSProperties = {
    position: 'relative',
    top: '2px',
    height: '25px',
    width: '25px',
    float: 'right',
    padding: '0'
};
