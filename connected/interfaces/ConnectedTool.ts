import { GridRegionLevels } from './region/GridRegionLevels';
import { DnsTool } from './tools/DnsTool';
import { DnsTraceTool } from './tools/DnsTraceTool';
import { FetchTool } from './tools/FetchTool';
import { HttpTraceTool } from './tools/HttpTraceTool';
import { PingTool } from './tools/PingTool';
import { PortCheckTool } from './tools/PortCheckTool';
import { TlsCertificateTool } from './tools/TlsCertifcateTool';
import { TracerouteTool } from './tools/TracerouteTool';
import { WhoisTool } from './tools/WhoisTool';

export namespace ConnectedTool {
    export enum Type {
        Dns = 'Dns',
        DnsTrace = 'DnsTrace',
        Fetch = 'Fetch',
        HttpTrace = 'HttpTrace',
        Ping = 'Ping',
        PortCheck = 'PortCheck',
        Traceroute = 'Traceroute',
        TlsCertificate = 'TlsCertificate',
        Whois = 'Whois',
    }

    export type Input =
        | DnsTool.Input
        | DnsTraceTool.Input
        | FetchTool.Input
        | HttpTraceTool.Input
        | PingTool.Input
        | PortCheckTool.Input
        | TracerouteTool.Input
        | TlsCertificateTool.Input
        | WhoisTool.Input;

    export type Output =
        | DnsTool.Output
        | DnsTraceTool.Output
        | FetchTool.Output
        | HttpTraceTool.Output
        | PingTool.Output
        | PortCheckTool.Output
        | TracerouteTool.Output
        | TlsCertificateTool.Output
        | WhoisTool.Output;

    export const Timeout = {
        Default: 30000, // 30 seconds
        Minimum: 1000, // 1 second
        Maximum: 60000, // 60 seconds
    } as const;

    export interface Brand<Type extends ConnectedTool.Type> {
        toolType: Type;
    }

    export type WithBrand<T, Type extends ConnectedTool.Type> = T & Brand<Type>;

    export type WithRegion<T> = T & {
        regions?: ReadonlyArray<GridRegionLevels>;
    };

    // Extract a specific tool type by its toolType value
    export type ExtractByToolType<T extends ConnectedTool.Type, K> = Extract<
        K,
        { toolType: T }
    >;
}
