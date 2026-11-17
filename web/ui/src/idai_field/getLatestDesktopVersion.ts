export const getLatestDesktopVersion = (): Promise<string> => {

    const url = 'https://api.github.com/repos/dainst/idai-field/releases/latest';

    return new Promise<string>(resolve => {
        const request = new XMLHttpRequest();
        request.addEventListener('load', () => {
            resolve(JSON.parse(request.response).tag_name.substr(1));
        });

        request.open('GET', url);
        request.setRequestHeader('Accept', 'application/vnd.github.v3+json');
        request.send();
    });
};
