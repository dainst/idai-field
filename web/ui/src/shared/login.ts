import React from 'react';


const LOGIN_DATA = 'loginData';

export interface LoginData {
    user: string;
    token: string;
    isAdmin: boolean;
}


export const ANONYMOUS_USER: LoginData = {
    user: 'anonymous',
    token: '',
    isAdmin: false
};


export const postLogin = async (user: string, password: string): Promise<LoginData> => {

    try {
        const signInResponse = await fetch('/api/auth/sign_in', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: user, pass: password })
        });
        const json = (await signInResponse.json());

        return json.token === undefined
            ? null
            : {
                user,
                token: json.token,
                isAdmin: json.is_admin === true
            };
    } catch (_) {
        return null;
    }
};


export const persistLogin = (loginData: LoginData): void =>
    localStorage.setItem(LOGIN_DATA, JSON.stringify(loginData));


export const forgetLogin = (): void => localStorage.removeItem(LOGIN_DATA);


export const getLoginData = (): LoginData => {

    const loginDataValue = localStorage.getItem(LOGIN_DATA);
    if (!loginDataValue) return ANONYMOUS_USER;
    return JSON.parse(loginDataValue);
};

export const doLogout = (setLoginData: (_: LoginData) => void) => (): void => {
    forgetLogin();
    refreshAnonymousUserRights().then(setLoginData);
};


export const LoginContext = React.createContext(ANONYMOUS_USER);


export const refreshAnonymousUserRights = async (): Promise<LoginData> => {

    const loginDataValue = localStorage.getItem(LOGIN_DATA);
    if (loginDataValue) return;

    const response = await fetch('/api/auth/sign_in', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: 'anonymous' })
    });
    if (response.status !== 200) return ANONYMOUS_USER;

    const json = await response.json();

    const anonymous = JSON.parse(JSON.stringify(ANONYMOUS_USER));
    anonymous.isAdmin = json.is_admin;
    
    persistLogin(anonymous);
    return anonymous;
};
