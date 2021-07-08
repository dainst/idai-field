import React, { CSSProperties, ReactElement, useContext, useEffect, useState } from 'react';
import { fetchImage } from '../../api/image';
import { LoginContext } from '../login';
import NotFoundImage from './NotFoundImage';

export interface ImageProps {
    project: string;
    id: string;
    maxWidth: number;
    maxHeight: number;
}


export default React.memo(function Image({ project, id, maxWidth, maxHeight }: ImageProps): ReactElement {

    const [imgUrl, setImgUrl] = useState<string>();
    const [error, setError] = useState<string>();
    const loginData = useContext(LoginContext);

    useEffect(() => {

        let didCancel = false;
        let url: string;

        const fetchAndSetImage = async () => {
            try {
                url = await fetchImage(project, id, maxWidth, maxHeight, loginData.token);
                if (!didCancel) {
                    setImgUrl(url);
                }
            } catch (e) {
                setError(e.error);
            }
        };

        fetchAndSetImage();
        return () => {
            didCancel = true; // necessary to avoid setting imgUrl after the component is removed
            if (url) URL.revokeObjectURL(url); // necessary to allow garbage collection of image objects
        };
    }, [project, id, loginData, maxWidth, maxHeight]);

    return imgUrl
        ? <img src={ imgUrl } style={ imageStyle } alt={ id } />
        : error && <NotFoundImage />;
});

const imageStyle: CSSProperties = {
    display: 'block',
    maxHeight: '100%',
    maxWidth: '100%',
    margin: 'auto',
    backgroundColor: '#ccc',
    color: '#fff'
};
