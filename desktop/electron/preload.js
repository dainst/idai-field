const ipcRenderer = window.require('electron').ipcRenderer;

window.filesystem = {};
window.filesystem.getFileInfos = function(paths) { return ipcRenderer.invoke('getFileInfos', paths); };
window.filesystem.isFile = function(path) { return ipcRenderer.invoke('isFile', path); };
window.filesystem.isDirectory = function(path) { return ipcRenderer.invoke('isDirectory', path); };
window.filesystem.writeFile = function(path, contents) { return ipcRenderer.invoke('writeFile', path, contents); };
window.filesystem.readFile = function(path, encoding) { return ipcRenderer.invoke('readFile', path, encoding); };
window.filesystem.readdir = function(path) { return ipcRenderer.invoke('readdir', path); };
window.filesystem.mkdir = function(path, options) { return ipcRenderer.invoke('mkdir', path, options); };
window.filesystem.rm = function(path, options) { return ipcRenderer.invoke('rm', path, options); };
window.filesystem.unlink = function(path) { return ipcRenderer.invoke('unlink', path); };
window.filesystem.extractZip = function(source, destination) {
    return ipcRenderer.invoke('extractZip', source, destination);
};
window.filesystem.createCatalogZip = function(outputFilePath, filePath, fileName, imageDirPath, imageDirName) {
    return ipcRenderer.invoke('createCatalogZip', outputFilePath, filePath, fileName, imageDirPath, imageDirName);
};

// ipcRenderer.on('SET_SOURCE', async (event, sourceId) => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         audio: false,
//         video: {
//           mandatory: {
//             chromeMediaSource: 'desktop',
//             chromeMediaSourceId: sourceId,
//             minWidth: 1280,
//             maxWidth: 1280,
//             minHeight: 720,
//             maxHeight: 720
//           }
//         }
//       })
//       handleStream(stream)
//     } catch (e) {
//       handleError(e)
//     }
//   })

  
// function handleStream (stream) {
//     const video = document.querySelector('video')
//     video.srcObject = stream
//     video.onloadedmetadata = (e) => video.play()
//   }
  
//   function handleError (e) {
//     console.log(e)
//   }