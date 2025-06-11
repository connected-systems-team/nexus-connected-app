import ipaddr from 'ipaddr.js';
import { NetworkAddress } from './NetworkAddress';

export class NetworkHost {
    readonly host: string;
    readonly type: 'ipv4' | 'ipv6' | 'domain';

    /**
     * Retrieve and validate host information.
     * This function only returns if the host is a valid public IP address or domain
     * otherwise throws an error.
     *
     * @param host
     * @returns
     */
    static async getHost(host: string): Promise<NetworkHost> {
        let cleanHost = host;

        // Handle IPv6 with brackets and optional port
        if (host.startsWith('[')) {
            const closingBracketIndex = host.indexOf(']');
            if (closingBracketIndex !== -1) {
                cleanHost = host.substring(1, closingBracketIndex);
            }
        } else {
            // Handle IPv4 or domain with optional port
            const parts = host.split(':');
            if (parts.length > 1) {
                if (parts.length > 2 && host.includes('::')) {
                    // Likely an unbracketed IPv6 address, keep intact
                    cleanHost = host;
                } else {
                    // Likely IPv4 or domain with port
                    cleanHost = parts[0];
                }
            }
        }

        if (cleanHost.toLowerCase() === 'localhost') {
            throw new Error(`localhost not allowed: ${host}`);
        }

        const parts = cleanHost.split('.');
        if (parts.length > 1 && blockedTLDs.has(parts[parts.length - 1])) {
            throw new Error(`Blocked top-level domain: ${host}`);
        }

        // Check if it's an IP address
        try {
            const parsed = ipaddr.parse(cleanHost);
            if (!NetworkAddress.isPublicIP(cleanHost)) {
                throw new Error(
                    `Invalid IP Address is private or not publicly routable: ${cleanHost}`,
                );
            }

            return {
                host: cleanHost,
                type: parsed.kind() === 'ipv4' ? 'ipv4' : 'ipv6',
            };
        } catch {
            // Not an IP — move to domain validation
        }

        if (cleanHost.length > 253) {
            throw new Error(
                `Exceeded the maximum domain length (253 characters): ${cleanHost}`,
            );
        }
        if (parts.some((p) => p.length > 63)) {
            throw new Error(
                `One or more labels exceed the 63-character limit: ${cleanHost}`,
            );
        }

        const domainPattern =
            /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*$/;
        if (!domainPattern.test(cleanHost)) {
            throw new Error(`Invalid domain: ${cleanHost}`);
        }

        return {
            host: cleanHost,
            type: 'domain',
        };
    }
}

// Blocked internal-use domains
const blockedTLDs = new Set([
    'localhost',
    'internal',
    'test',
    'onion',
    'local',
    'home',
    'corp',
    'lan',
    'private',
    'intranet',
]);
