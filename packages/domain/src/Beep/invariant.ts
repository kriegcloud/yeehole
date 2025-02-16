
export type InvariantFn = (condition: unknown, message?: string) => asserts condition;
/**
 * Asserts that the condition is true.
 *
 * @param condition
 * @param message Optional message. If it starts with "BUG" then the program will break if this invariant fails if the debugger is attached.
 */
export const invariant: InvariantFn = (
  condition: unknown,
  message?: string,
): asserts condition => {
  if (condition) {
    return;
  }

  // Any other invariants are fucked errors

  if (message?.startsWith('BUG')) {
    // This invariant is a debug bug-check: break if the debugger is attached.
    debugger;
  }

  let errorMessage = 'invariant violation';

  if (message) {
    errorMessage += `: ${message}`;
  }

  throw new InvariantViolation(errorMessage);
};

export class InvariantViolation extends Error {
  constructor(message: string) {
    super(message);
    // NOTE: Restores prototype chain (https://stackoverflow.com/a/48342359).
    Object.setPrototypeOf(this, new.target.prototype);
  }
}