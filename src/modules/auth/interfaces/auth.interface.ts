export interface Tokens {
    access_token: string;
    refresh_token: string;
}

export interface TokenPayload {
    sub: string;
    phoneNumber?: string;
    username?: string;
}