import { mdiApple, mdiDownload, mdiGithub, mdiLinux, mdiMicrosoftWindows } from '@mdi/js';
import Icon from '@mdi/react';
import { TFunction } from 'i18next';
import React, { CSSProperties, ReactElement, ReactNode, useEffect, useState } from 'react';
import { Carousel } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { NAVBAR_HEIGHT } from '../../constants';
import { getLatestDesktopVersion } from '../getLatestDesktopVersion';
import './Download.css';


type Slide = { imageUrl: string, description: string };


export default function Download(): ReactElement {

    const [latestVersion, setLatestVersion] = useState('');
    const { t } = useTranslation();

    useEffect (() => {
        getLatestDesktopVersion().then(setLatestVersion);
    }, []);

    return (
        <div style={ pageStyle } className="download-view">
            { getCarousel(latestVersion, t) }
            { getDownloadSection(latestVersion, t) }
        </div>
    );
}


const getCarousel = (latestVersion: string, t: TFunction): ReactNode => {

    return (
        <div style={ carouselContainerStyle } className="mt-5">
            <Carousel>
                { getCarouselItems(latestVersion, t) }
            </Carousel>
        </div>
    );
};


const getCarouselItems = (latestVersion: string, t: TFunction): ReactNode => {

    const baseUrl: string = 'https://raw.githubusercontent.com/dainst/idai-field/v' + latestVersion + '/desktop/img/';

    const slides: Slide[] = [
        {
            imageUrl: baseUrl + 'README-FEATURES-1.png',
            description: t('download.slides.metadataEditor')
        },
        {
            imageUrl: baseUrl + 'README-FEATURES-2.png',
            description: t('download.slides.geodataEditor')
        },
        {
            imageUrl: baseUrl + 'README-FEATURES-8.png',
            description: t('download.slides.matrixView')
        },
        {
            imageUrl: baseUrl + 'README-FEATURES-6.png',
            description: t('download.slides.synchronization')
        },
        {
            imageUrl: baseUrl + 'README-FEATURES-3.png',
            description: t('download.slides.tableView')
        },
        {
            imageUrl: baseUrl + 'README-FEATURES-4.png',
            description: t('download.slides.nesting')
        }
    ];

    return slides.map(slide => {
       return (
           <Carousel.Item key={ slide.imageUrl }>
               <img src={ slide.imageUrl } alt="Screenshot" />
               <Carousel.Caption>
                   <h3>{ slide.description }</h3>
               </Carousel.Caption>
           </Carousel.Item>
       );
    });
};


const getDownloadSection = (latestVersion: string, t: TFunction): ReactNode => {

    if (latestVersion === '') return;

    return (
        <div style={ downloadContainerStyle }>
            <hr className="m-5" />
            <h3>{ t('download.download') }</h3>
            <p>{ t('download.currentVersion') } <strong>{ latestVersion }</strong></p>
            <p>{ t('download.packageInfo') }</p>
            <div style={ osInfoStyle }>
                <div>{ t('download.windowsInfo') }</div>
                <div>{ t('download.macInfo') }</div>
                <div>{ t('download.linuxInfo') }</div>
            </div>
            <p>
                <a href={ 'https://github.com/dainst/idai-field/releases/download/v' + latestVersion + '/Field-Desktop-'
                + latestVersion + '-Windows.exe' } className="btn btn-primary my-2 mr-1">
                    <Icon path={ mdiMicrosoftWindows } size={ 0.8 } className="windows-icon" />
                    { t('download.windows') }
                    <Icon path={ mdiDownload } size={ 0.8 } className="download-icon" />
                </a>
                <a href={ 'https://github.com/dainst/idai-field/releases/download/v' + latestVersion + '/Field-Desktop-'
                + latestVersion + '-MacOS.dmg' } className="btn btn-primary my-2 mr-1">
                    <Icon path={ mdiApple } size={ 0.8 } className="apple-icon" />
                    { t('download.macOS') }
                    <Icon path={ mdiDownload } size={ 0.8 } className="download-icon" />
                </a>
                <a href={ 'https://github.com/dainst/idai-field/releases/download/v' + latestVersion + '/Field-Desktop-'
                + latestVersion + '-Linux.AppImage' } className="btn btn-primary my-2">
                    <Icon path={ mdiLinux } size={ 0.8 } className="linux-icon" />
                    { t('download.linux') }
                    <Icon path={ mdiDownload } size={ 0.8 } className="download-icon" />
                </a>
            </p>
            <p>
                <a href="https://github.com/dainst/idai-field/releases" target="_blank" rel="noopener noreferrer">
                    { t('download.allVersions') }
                </a>
            </p>
            <hr className="m-5" />
            <h3>{ t('download.installation.header') }</h3>
            <h4>{ t('download.installation.update.header') }</h4>
            <p className="mb-5" style={ installationInfoStyle }>{ t('download.installation.update.body') }</p>
            <h4>{ t('download.installation.linux.header') }</h4>
            <h5>{ t('download.installation.linux.appImage.header') }</h5>
            <p className="mb-3" style={ installationInfoStyle }>
                { t('download.installation.linux.appImage.body1') }
                <a href="https://docs.appimage.org/user-guide/troubleshooting"
                   target="_blank" rel="noopener noreferrer">
                    { t('download.installation.linux.appImage.link') }
                </a>
                { t('download.installation.linux.appImage.body2') }
            </p>
            <h5>{ t('download.installation.linux.imageProcessing.header') }</h5>
            <p className="mb-5" style={ installationInfoStyle }>
                { t('download.installation.linux.imageProcessing.body1') }
                <code>{ t('download.installation.linux.imageProcessing.flag') }</code>
                { t('download.installation.linux.imageProcessing.body2') }
            </p>
            <hr className="m-5" />
            <p className="mb-5">
                <a className="btn btn-secondary" href="https://github.com/dainst/idai-field"
                   target="_blank" rel="noopener noreferrer">
                    <Icon path={ mdiGithub } size={ 0.8 } className="github-icon" />
                    { t('download.sourceCode') }
                </a>
            </p>
        </div>
    );
};


const pageStyle: CSSProperties = {
    height: 'calc(100vh - ' + NAVBAR_HEIGHT + 'px)',
    overflowY: 'scroll'
};


const carouselContainerStyle: CSSProperties = {
    width: '1030px',
    paddingRight: '15px',
    paddingLeft: '15px',
    marginRight: 'auto',
    marginLeft: 'auto'
};


const downloadContainerStyle: CSSProperties = {
    textAlign: 'center'
};


const osInfoStyle: CSSProperties = {
    marginBottom: '1rem'
};

const installationInfoStyle: CSSProperties = {
    textAlign: 'left',
    width: '1000px',
    margin: 'auto'
};
