import { getHeaders } from './utils';


export type Token = string;


export const getReadableProjects = async (token: Token): Promise<string[]> => {

    const response = await fetch('/api/auth/info', { headers: getHeaders(token) });
    if (response.ok) return (await response.json())['readable_projects'];
    else throw(await response.json());
};
