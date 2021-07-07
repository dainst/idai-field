import React, { CSSProperties, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { NAVBAR_HEIGHT } from '../../constants';

const MAILING_LIST: string = 'idaifield2-user@dainst.de';
const ERROR_REPORTS_MAIL: string = 'idai.field@dainst.de';


export default function Contact(): ReactElement {

    const { t } = useTranslation();

    return (
        <div style={ pageStyle }>
            <h3 style={ headingStyle }>{ t('contact.mailingList.heading') }</h3>
            <p style={ paragraphStyle }>{ t('contact.mailingList.info')}</p>
            <p style={ linkStyle }><a href={ 'mailto:' + MAILING_LIST }>{ MAILING_LIST }</a></p>
            <p style={ linkStyle }>
                <a href="https://lists.fu-berlin.de/listinfo/idaifield2-user" target="_blank" rel="noopener noreferrer">
                    { t('contact.mailingList.subscription') }
                </a>
            </p>
            <hr className="m-5" />
            <h3 style={ headingStyle }>{ t('contact.errorReports.heading') }</h3>
            <p style={ paragraphStyle }>{ t('contact.errorReports.info')}</p>
            <p style={ linkStyle }><a href={ 'mailto:' + ERROR_REPORTS_MAIL }>{ ERROR_REPORTS_MAIL }</a></p>
        </div>
    );
}


const pageStyle: CSSProperties = {
    height: 'calc(100vh - ' + NAVBAR_HEIGHT + 'px)',
    overflowY: 'scroll',
    padding: '15px'
};


const headingStyle: CSSProperties = {
    textAlign: 'center',
    marginBottom: '15px'
};


const linkStyle: CSSProperties = {
    textAlign: 'center'
};


const paragraphStyle: CSSProperties = {
    width: '1000px',
    marginRight: 'auto',
    marginLeft: 'auto'
};
