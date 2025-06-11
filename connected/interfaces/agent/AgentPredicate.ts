/**
 *
 */
export namespace AgentPredicate {
    export type PredicateChain = AgentPredicate.PredicateType[];

    /**
     * Represents a predicate that can be evaluated against a set of data.
     */
    export type PredicateType =
        | ComparePredicate
        | StringPredicate
        | LengthPredicate
        | IncludesPredicate
        | LogicalPredicate;

    export interface ComparePredicate {
        type: 'compare';
        key: string;
        op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';
        value: PredicateValue;
    }

    export interface StringPredicate {
        type: 'string';
        key: string;
        op: 'contains' | 'startsWith' | 'endsWith' | 'matches';
        value: PredicateValue;
        regex?: string; // JS RegExp flags for 'matches'
    }

    export interface LengthPredicate {
        type: 'length';
        key: string;
        op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';
        value: PredicateValue;
    }

    export interface IncludesPredicate {
        type: 'includes';
        key: string;
        value: PredicateValue;
    }

    export interface LogicalPredicate {
        type: 'and' | 'or' | 'not';
        conditions: PredicateType[];
    }

    export type PredicateValue =
        | {
              type: 'literal';
              value: JsonValue;
          }
        | {
              type: 'reference';
              key: string;
          };
}

/**
 * Represents any possible JSON value.
 */
type JsonValue = string | number | boolean | null | JsonObject | JsonArray;

/**
 * Represents a JSON object.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface JsonObject extends Record<string, JsonValue | undefined> {}

/**
 * Represents an array of JsonValues.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface JsonArray extends Array<JsonValue> {}
