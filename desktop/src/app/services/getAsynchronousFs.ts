const fsPromises = typeof window !== 'undefined' ? undefined : require('fs').promises;


// If called from Electron app: Return fs.promises instance from Electron main process via window['filesystem']
// If called from tests: Return required fs.promises instance
//
// (See: https://github.com/electron/electron/issues/19554#issuecomment-683383337)
export function getAsynchronousFs() {

    return fsPromises ?? window['filesystem'];
}
