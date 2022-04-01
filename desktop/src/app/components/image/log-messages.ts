export function showMissingImageMessageOnConsole(id: string) {

    console.error('Neither original nor thumbnail found for image: ' + id);
}


export function showMissingThumbnailMessageOnConsole(id: string) {

    console.error('No thumbnail found for image: ' + id);
}


export function showMissingOriginalImageMessageOnConsole(id: string) {

    console.warn('No original found for image: ' + id);
}
