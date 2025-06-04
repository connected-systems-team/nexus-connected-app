import { ConnectedTool } from '../ConnectedTool';

export namespace FetchTool {
    export const Type = ConnectedTool.Type.Fetch;

    export interface Input extends ConnectedTool.Brand<typeof Type> {
        url: string;
        method?:
            | 'GET'
            | 'HEAD'
            | 'POST'
            | 'PUT'
            | 'PATCH'
            | 'DELETE'
            | 'OPTIONS';
        headers?: Record<string, string>;
        body?: string;
        timeoutMs?: number;
    }

    export interface Output extends ConnectedTool.Brand<typeof Type> {
        status: number;
        statusText?: string;
        headers: Record<string, string>;
        body?: string;
        redirects?: FetchToolRedirect[];
        durationMs: number;
        error?: string;
    }
}

export interface FetchToolRedirect {
    url: string;
    status: number;
}
