import { getHeaders } from './utils';


export const fetchImage = async (project: string,
                                 id: string,
                                 maxWidth: number,
                                 maxHeight: number,
                                 token: string): Promise<string> => {

    const imageUrl = getImageUrl(project, `${id}.jp2`, maxWidth, maxHeight, token);
    const response = await fetch(imageUrl);
    if (response.ok) return URL.createObjectURL(await response.blob());
    else throw (await response.json());
};


export const fetchDescendantsImages = async (project: string,
                                            resourceId: string,
                                            maxWidth: number,
                                            maxHeight: number,
                                            numberOfImages: number,
                                            token: string): Promise<string[]> => {
    
    const imageIds: string[] = await getDescendantsImagesIds(resourceId, numberOfImages, token);
    const promises = imageIds.map(imageId => fetchImage(project, imageId, maxWidth, maxHeight, token));
    return Promise.all(promises);
};


export const getImageUrl = (project: string, path: string, maxWidth: number,
        maxHeight: number, token: string, format = 'jpg'): string => {

    const token_ = token === undefined || token === '' ? 'anonymous' : token;
    return `/api/images/${project}/${encodeURIComponent(path)}/`
        + `${token_}/full/!${maxWidth},${maxHeight}/0/default.${format}`;
};


export const makeUrl = (project: string, id: string, token?: string): string => {

    const token_ = token === undefined || token === '' ? 'anonymous' : token;
    return `/api/images/${project}/${id}.jp2/${token_}/info.json`;
};


const getDescendantsImagesIds = async (resourceId: string, numberOfImages: number,
                                       token: string): Promise<string[]> => {

    const token_ = token === undefined || token === '' ? 'anonymous' : token;
    const response = await fetch(
        `/api/documents/descendantsImages/${resourceId}/${numberOfImages}`,
        { headers: getHeaders(token_) }
    );
    if (response.ok) {
        return (await response.json()).results;
    } else {
        throw await response.json();
    }
};