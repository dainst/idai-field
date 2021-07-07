import React, { CSSProperties, ReactElement, useContext, useEffect, useState } from 'react';
import { fetchDescendantsImages } from '../../api/image';
import { LoginContext } from '../login';
import NotFoundImage from './NotFoundImage';
import './multi-image.css';
import { ImageProps } from './Image';


const NUMBER_OF_IMAGES = 5;


export default React.memo(function MultiImage({ project, id, maxWidth, maxHeight }: ImageProps): ReactElement {

    const [imgUrls, setImgUrls] = useState<string[]>();
    const [error, setError] = useState<string>();
    const loginData = useContext(LoginContext);

    useEffect(() => {

        let didCancel = false;
        let urls: string[];

        const fetchAndSetImages = async () => {
            try {
                urls = await fetchDescendantsImages(
                    project, id, maxWidth - 50, maxHeight - 50, NUMBER_OF_IMAGES, loginData.token
                );
                if (!didCancel) setImgUrls(urls);
            } catch (e) {
                setError(e.error);
            }
        };

        fetchAndSetImages();
        return () => {
            didCancel = true; // necessary to avoid setting imgUrl after the component is removed
            if (urls) {
                urls.forEach(URL.revokeObjectURL); // necessary to allow garbage collection of image objects
            }
        };
    }, [project, id, loginData, maxWidth, maxHeight]);

    return imgUrls
        ? <div style={ multiImageStyle }>
            { imgUrls.map((imgUrl, index) =>
                <div key={ imgUrl }
                className={
                    `image-container image-container-${index} d-flex align-items-center justify-content-center`
                }><img src={ imgUrl } alt={ id } />
                </div>)
            }
        </div>
        : error && <NotFoundImage />;
});


const multiImageStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden'
};
