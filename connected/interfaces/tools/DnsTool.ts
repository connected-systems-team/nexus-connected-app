import { NetworkHost } from '@nexus/connected/utilities/NetworkHost';
import { ConnectedTool } from '../ConnectedTool';

export namespace DnsTool {
    export const Type = ConnectedTool.Type.Dns;

    export interface Input extends ConnectedTool.Brand<typeof Type> {
        domain: string;
        types?: DnsRecordType[];
    }

    export interface Output extends ConnectedTool.Brand<typeof Type> {
        A?: string[];
        AAAA?: string[];
        CNAME?: string[];
        MX?: { exchange: string; priority: number }[];
        TXT?: string[][];
        NS?: string[];
        PTR?: string[];
        SRV?: {
            priority: number;
            weight: number;
            port: number;
            name: string;
        }[];
        SOA?: {
            nsname: string;
            hostmaster: string;
            serial: number;
            refresh: number;
            retry: number;
            expire: number;
            minttl: number;
        };
        errors?: Partial<Record<DnsRecordType, string>>;
    }

    export function validateInput(input: Input): void {
        NetworkHost.getHost(input.domain); // Validate domain format
    }
}

export enum DnsRecordType {
    A = 'A',
    AAAA = 'AAAA',
    CNAME = 'CNAME',
    MX = 'MX',
    TXT = 'TXT',
    NS = 'NS',
    PTR = 'PTR',
    SRV = 'SRV',
    SOA = 'SOA',

    // SPF = 'SPF', This is technically not a distinct record type anymore.
    // It used to be, but now SPF records are just stored in TXT records.
    // 👉 You should parse SPF out of TXT records, not do a separate DNS query for SPF.

    // ANY = 'ANY', Support for ANY is inconsistent and increasingly deprecated by DNS
    // providers (e.g., Cloudflare returns fake records). Only use ANY internally if you
    // control the nameserver, or skip it entirely.
}
