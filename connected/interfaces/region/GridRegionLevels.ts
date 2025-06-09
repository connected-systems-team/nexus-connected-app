/**
 * Represents the level of a grid region.
 * This is used to determine the granularity of the region.
 * The levels are ordered from the most general to the most specific.
 * - Region: The most general level, representing a large area.
 * - Country: A specific country within a region.
 * - Division: A division within a country, such as a state or province.
 * - Locality: A more specific area within a division, such as a city or town.
 * - Site: The most specific level, representing a specific site or location.
 */
export enum GridRegionLevel {
    Region = 'region', // lowercase to match column names
    Country = 'country',
    Division = 'division',
    Locality = 'locality',
    Site = 'site',
}

export interface GridRegionLevels {
    region?: string;
    country?: string;
    division?: string;
    locality?: string;
    site?: string;
}
