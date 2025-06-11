import ipaddr from 'ipaddr.js';

export class NetworkAddress {
    /**
     * Check if an IP address is public.
     *
     * @param ip The IP address to check
     * @returns Whether the IP is public
     */
    static isPublicIP(ip: string): boolean {
        try {
            const parsedIP = ipaddr.parse(ip);

            // Define IPv4 private and reserved ranges
            const ipv4PrivateRanges = [
                ipaddr.parseCIDR('10.0.0.0/8'),
                ipaddr.parseCIDR('172.16.0.0/12'),
                ipaddr.parseCIDR('192.168.0.0/16'),
                ipaddr.parseCIDR('127.0.0.0/8'),
                ipaddr.parseCIDR('224.0.0.0/4'), // Multicast
                ipaddr.parseCIDR('240.0.0.0/4'), // Reserved
            ];

            // Define IPv6 private and reserved ranges
            const ipv6PrivateRanges = [
                ipaddr.parseCIDR('::1/128'), // Loopback
                ipaddr.parseCIDR('fc00::/7'), // Unique Local Address
                ipaddr.parseCIDR('fe80::/10'), // Link-Local
                ipaddr.parseCIDR('ff00::/8'), // Multicast
            ];

            if (parsedIP.kind() === 'ipv4') {
                return !ipv4PrivateRanges.some((range) =>
                    parsedIP.match(range),
                );
            }

            if (parsedIP.kind() === 'ipv6') {
                return !ipv6PrivateRanges.some((range) =>
                    parsedIP.match(range),
                );
            }

            return false; // Unknown format (edge case)
        } catch (error) {
            console.error('Error parsing IP:', error);
            return false; // Invalid IPs are considered private (blocked)
        }
    }
}
