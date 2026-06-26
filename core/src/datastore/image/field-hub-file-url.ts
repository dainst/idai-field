import { ImageVariant } from './image-store';


export function getFieldHubBaseUrl(syncUrl: string, project: string): string {

    let url = syncUrl.trim().replace(/\/+$/, '');
    const suffixes = [
        `/db/${project}`,
        `/db/${encodeURIComponent(project)}`,
        '/db'
    ];
    const matchedSuffix = suffixes.find(suffix => url.endsWith(suffix));

    if (matchedSuffix) url = url.slice(0, -matchedSuffix.length);

    return url.replace(/\/+$/, '');
}


export function buildFieldHubFileUrl(syncUrl: string, project: string, uuid?: string): string {

    const parts = [
        getFieldHubBaseUrl(syncUrl, project),
        'files',
        encodeURIComponent(project)
    ];
    if (uuid) parts.push(encodeURIComponent(uuid));

    return parts.join('/');
}


export function buildFieldHubFileUrlWithType(syncUrl: string, project: string, uuid: string,
                                             type: ImageVariant): string {

    return `${buildFieldHubFileUrl(syncUrl, project, uuid)}?type=${encodeURIComponent(type)}`;
}
