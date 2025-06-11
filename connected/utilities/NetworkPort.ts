export class NetworkPort {
    static getPort(port: string | number): number {
        // Ensure the port is a number and within valid port range
        if (typeof port === 'string') {
            if (/^\d+$/.test(port)) {
                port = Number(port);
            } else {
                throw new Error(`Invalid port format: ${port}`);
            }
        }

        if (port >= 1 && port <= 65535) {
            return port;
        }

        throw new Error(`Port number out of range: ${port}`);
    }
}
