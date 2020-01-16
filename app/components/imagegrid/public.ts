export function showMissingImageMessageOnConsole(id: string) {

    console.error('Neither original nor thumbnail found for image. ' +
        'The filename of the missing image' +
        ' is \’' + id + '\' (note: no file extension!). ' +
        'It should be found in the project folder below the imagestore (see settings page).');
}