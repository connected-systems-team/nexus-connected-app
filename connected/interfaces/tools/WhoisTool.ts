import { NetworkHost } from '@nexus/connected/utilities/NetworkHost';
import { ConnectedTool } from '../ConnectedTool';
import { ConnectedToolType } from '../ConnectedToolType';
import { ProcessOutput } from '../ProcessOutput';

export namespace WhoisTool {
    export const Type = ConnectedToolType.Whois;

    export interface Input extends ConnectedTool.Brand<typeof Type> {
        host: string;
        timeoutMs?: number;
    }

    export type Output = ConnectedTool.WithBrand<ProcessOutput, typeof Type>;

    /**
     * The fully structured WHOIS result
     */
    export interface Result extends ConnectedTool.Brand<typeof Type> {
        matched: boolean;
        noMatchDomain?: string;
        lastUpdate?: string;
        error?: string;

        /** IANA/TLD registry data */
        tld?: {
            refer: string;
            tld: string;
            registryOrganization: string;
            registryAddresses: string[];
            administrativeContact: WhoisContact;
            technicalContact: WhoisContact;
            nameServers: WhoisNameServer[];
            dsRdata: string;
            whoisServer: string;
            status: string;
            remarks?: string;
            created: string;
            changed: string;
            source: string;
        };

        /** Registrar/domain data */
        domain?: {
            domainName: string;
            registryDomainId?: string;
            registrarWhoisServer?: string;
            registrarUrl?: string;
            updatedDate?: string;
            creationDate?: string;
            registryExpiryDate?: string;
            registrar: string;
            registrarIanaId?: string;
            abuseContactEmail?: string;
            abuseContactPhone?: string;
            statuses: string[];
            nameServers: string[];
            dnssec?: string;
            icannComplaintUrl?: string;
        };

        /** Registrar‑level contacts */
        contacts?: {
            registrant?: WhoisRegistrarContact;
            administrative?: WhoisRegistrarContact;
            technical?: WhoisRegistrarContact;
        };
    }

    export function validateInput(input: Input): void {
        NetworkHost.getHost(input.host); // Validate domain format
    }

    /**
     * Parses raw WHOIS stdout into a fully‑structured object.
     */
    export function parseOutput(output: Output): Result | undefined {
        if(!output || !output.stdout) {
            return;
        }

        const result: Result = {
            toolType: ConnectedToolType.Whois,
            matched: true,
        };
        const lines = output.stdout.split(/\r?\n/);

        // Split into two sections: TLD (section 0) and Registrar/domain (section 1)
        let section = 0;
        let seenDomainHeader = 0;
        const tldLines: string[] = [];
        const domainLines: string[] = [];

        for(const raw of lines) {
            const line = raw.trim();
            if(/^Domain Name:/i.test(line)) {
                seenDomainHeader++;
                // the **second** Domain Name: marks the start of the registrar block
                if(seenDomainHeader === 2) {
                    section = 1;
                    continue; // don’t include this header in tldLines
                }
            }
            if(section === 0) {
                tldLines.push(raw);
            }
            else if(section === 1) {
                domainLines.push(raw);
            }
        }

        // --- Detect no‑match and last‑update anywhere ---
        for(const raw of lines) {
            const line = raw.trim();
            if(!line) continue;

            // No match
            const nm = line.match(/^No match for domain\s+"([^"]+)"/i);
            if(nm) {
                result.matched = false;
                result.noMatchDomain = nm[1];
                break;
            }
        }
        // Last update
        for(const raw of lines) {
            const line = raw.trim();
            const lu = line.match(/^>>> Last update of whois.*?:\s*([0-9T:\-+.Z]+)/i);
            if(lu) {
                result.lastUpdate = lu[1];
                break;
            }
        }

        // --- Parse TLD section ---
        if(tldLines.some((l) => /refer:/i.test(l))) {
            // initialize
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const tldBlock: any = {
                registryAddresses: [] as string[],
                nameServers: [] as WhoisNameServer[],
            };
            let currentContactType: 'administrative' | 'technical' | null = null;
            const tldContacts: Partial<Record<'administrative' | 'technical', Partial<WhoisContact>>> = {};

            for(const raw of tldLines) {
                const line = raw.trim();
                if(!line || line.startsWith('%') || line.startsWith('>') || line.startsWith('#')) {
                    continue;
                }
                const [rawKey, ...rest] = line.split(':');
                if(!rest.length) continue;
                const key = rawKey?.trim().toLowerCase();
                const value = rest.join(':').trim();

                // TLD contacts
                if(key === 'contact') {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    currentContactType = value.toLowerCase() as any;
                    if(currentContactType) {
                        tldContacts[currentContactType] = { addresses: [] };
                    }
                    continue;
                }
                if(currentContactType) {
                    const contact = tldContacts[currentContactType]!;
                    switch(key) {
                        case 'name':
                            contact.name = value;
                            break;
                        case 'organisation':
                        case 'organization':
                            contact.organization = value;
                            break;
                        case 'address':
                            contact.addresses!.push(value);
                            break;
                        case 'phone':
                            contact.phone = value;
                            break;
                        case 'fax-no':
                            contact.faxNo = value;
                            break;
                        case 'e-mail':
                        case 'email':
                            contact.email = value;
                            break;
                    }
                    continue;
                }

                // General TLD fields
                switch(key) {
                    case 'refer':
                        tldBlock.refer = value;
                        break;
                    case 'domain':
                        tldBlock.tld = value;
                        break;
                    case 'organisation':
                    case 'organization':
                        tldBlock.registryOrganization = value;
                        break;
                    case 'address':
                        tldBlock.registryAddresses.push(value);
                        break;
                    case 'nserver':
                        {
                            const parts = value.split(/\s+/);
                            const host = parts[0];
                            let ipv4: string | undefined;
                            let ipv6: string | undefined;
                            for(const p of parts.slice(1)) {
                                if(p.includes(':')) ipv6 = p;
                                else ipv4 = p;
                            }
                            tldBlock.nameServers.push({ host, ipv4, ipv6 });
                        }
                        break;
                    case 'ds-rdata':
                        tldBlock.dsRdata = value;
                        break;
                    case 'whois':
                        tldBlock.whoisServer = value;
                        break;
                    case 'status':
                        tldBlock.status = value;
                        break;
                    case 'remarks':
                        tldBlock.remarks = value;
                        break;
                    case 'created':
                        tldBlock.created = value;
                        break;
                    case 'changed':
                        tldBlock.changed = value;
                        break;
                    case 'source':
                        tldBlock.source = value;
                        break;
                }
            }

            // Attach parsed contacts
            if(tldContacts.administrative) {
                tldBlock.administrativeContact = tldContacts.administrative as WhoisContact;
            }
            if(tldContacts.technical) {
                tldBlock.technicalContact = tldContacts.technical as WhoisContact;
            }

            result.tld = tldBlock;
        }

        // --- Parse Registrar/domain section ---
        if(domainLines.some((l) => /domain name/i.test(l))) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const dom: any = {
                statuses: [] as string[],
                nameServers: [] as string[],
            };
            result.contacts = {};

            for(const raw of domainLines) {
                const line = raw.trim();
                if(!line || line.startsWith('%') || line.startsWith('>') || line.startsWith('#')) {
                    continue;
                }
                const [rawKey, ...rest] = line.split(':');
                if(!rest.length) continue;
                const key = rawKey?.trim();
                const keyLower = key?.toLowerCase();
                const value = rest.join(':').trim();

                // Domain‑level contacts
                const contactMatch = keyLower?.match(/^(registrant|admin|tech)\s+(.+)$/i);
                if(contactMatch && contactMatch[1] && contactMatch[2]) {
                    const kindRaw = contactMatch[1].toLowerCase();
                    const fieldRaw = contactMatch[2].toLowerCase();
                    const kind =
                        kindRaw === 'registrant' ? 'registrant' : kindRaw === 'admin' ? 'administrative' : 'technical';
                    const contact: WhoisRegistrarContact = result.contacts![kind] || {};
                    if(fieldRaw === 'organization') contact.organization = value;
                    else if(fieldRaw === 'state/province') contact.stateProvince = value;
                    else if(fieldRaw === 'country') contact.country = value;
                    else if(fieldRaw === 'email') contact.email = value;
                    result.contacts![kind] = contact;
                    continue;
                }

                // Map domain fields
                switch(keyLower) {
                    case 'domain name':
                        dom.domainName = value;
                        break;
                    case 'registry domain id':
                        dom.registryDomainId = value;
                        break;
                    case 'registrar whois server':
                        dom.registrarWhoisServer = value;
                        break;
                    case 'registrar url':
                        dom.registrarUrl = value;
                        break;
                    case 'updated date':
                        dom.updatedDate = value;
                        break;
                    case 'creation date':
                        dom.creationDate = value;
                        break;
                    case 'registry expiry date':
                    case 'registrar registration expiration date':
                        dom.registryExpiryDate = value;
                        break;
                    case 'registrar':
                        dom.registrar = value;
                        break;
                    case 'registrar iana id':
                        dom.registrarIanaId = value;
                        break;
                    case 'registrar abuse contact email':
                        dom.abuseContactEmail = value;
                        break;
                    case 'registrar abuse contact phone':
                        dom.abuseContactPhone = value;
                        break;
                    case 'domain status':
                        dom.statuses.push(value);
                        break;
                    case 'name server':
                        dom.nameServers.push(value);
                        break;
                    case 'dnssec':
                        dom.dnssec = value;
                        break;
                    case 'url of the icann whois data problem reporting system':
                    case 'url of the icann whois inaccuracy complaint form':
                        dom.icannComplaintUrl = value;
                        break;
                }
            }

            result.domain = dom;
        }

        return result;
    }
}

/**
 * A generic contact block from the TLD section
 */
export interface WhoisContact {
    name: string;
    organization: string;
    addresses: string[];
    phone?: string;
    faxNo?: string;
    email?: string;
}

/**
 * A parsed nameserver entry
 */
export interface WhoisNameServer {
    host: string;
    ipv4?: string;
    ipv6?: string;
}

/**
 * A registrar‑block contact
 */
export interface WhoisRegistrarContact {
    organization?: string;
    stateProvince?: string;
    country?: string;
    email?: string;
}
