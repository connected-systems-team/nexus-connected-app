import { NetworkUrl } from '@nexus/connected/utilities/NetworkUrl';
import { ConnectedTool } from '../ConnectedTool';
import { ConnectedToolType } from '../ConnectedToolType';

export namespace FetchTool {
    export const Type = ConnectedToolType.Fetch;

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

    export function validateInput(input: Input): void {
        NetworkUrl.getUrl(input.url); // Validate URL format
    }
}

export interface FetchToolRedirect {
    url: string;
    status: number;
}
