function _(id: string) {

    return 'The filename of the missing image' +
    ' is \'' + id + '\' (note: no file extension!). ' +
    'It should be found in the project folder below the imagestore (see settings page).'
}


export function showMissingImageMessageOnConsole(id: string) {

    console.error('Neither original nor thumbnail found for image: ' + _(id));
}


export function showMissingThumbnailMessageOnConsole(id: string) {

    console.error('No thumbnail found for image: ' + _(id));
}


export function showMissingOriginalImageMessageOnConsole(id: string) {

    console.warn('No original found for image: ' + _(id));
}