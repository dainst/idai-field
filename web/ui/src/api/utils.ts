export const getHeaders = (token: string): HeadersInit => {
    
    if (token) return { 'Authorization': `Bearer ${token}` };
    else return { };
};
