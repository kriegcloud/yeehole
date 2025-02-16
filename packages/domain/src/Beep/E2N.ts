import { invariant } from "./invariant";
/**
 * E2N unambiguously names a resource like an MOSES object, schema definition, plugin, etc.
 * Each E2N starts with a dx prefix, followed by a resource kind.
 * Colon Symbol : is used a delimiter between parts.
 * E2Ns may contain slashes.
 * '@' in the place of the space id is used to denote that the E2N should be resolved in the local space.
 *
 * @example
 *
 * ```
 * e2n:moses:<space key>:<moses id>
 * e2n:moses:BA25QRC2FEWCSAMRP4RZL65LWJ7352CKE:01J00J9B45YHYSGZQTQMSKMGJ6
 * e2n:moses:@:01J00J9B45YHYSGZQTQMSKMGJ6
 * e2n:type:beep/type/Calendar
 * e2n:plugin:/agent/plugin/functions
 * ```
 */
// TODO make this default in the brand module
export class E2N {
  /**
   * Kind constants.
   */
  static kind = Object.freeze({
    MOSES: 'moses',
    TYPE: 'type',
  });

  static parse(e2n: string): E2N {
    // TODO use Chunk
    const [prefix, kind, ...parts] = e2n.split(':');
    if (!(prefix === 'e2n')) {
      throw new Error('Invalid E2N');
    }
    if (!(kind.length > 0)) {
      throw new Error('Invalid E2N');
    }
    if (!(parts.length > 0)) {
      throw new Error('Invalid E2N');
    }
    return new E2N(kind, parts);
  }

  readonly #kind: string;
  readonly #parts: string[];

  constructor(kind: string, parts: string[]) {
    invariant(parts.length > 0);
    invariant(parts.every((part) => part.length > 0 && part.indexOf(':') === -1));

    // Per-type validation.
    switch (kind) {
      case E2N.kind.MOSES:
        invariant(parts.length === 2);
        break;
      case E2N.kind.TYPE:
        invariant(parts.length === 1);
        break;
    }

    this.#kind = kind;
    this.#parts = parts;
  }

  get kind() {
    return this.#kind;
  }

  get parts() {
    return this.#parts;
  }

  isTypeE2NOf(typename: string) {
    return this.#kind === E2N.kind.TYPE && this.#parts.length === 1 && this.#parts[0] === typename;
  }

  toString() {
    return `e2n:${this.#kind}:${this.#parts.join(':')}`;
  }
}