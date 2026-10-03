import type { TransactionScope, UnitOfWork } from "./unit-of-work";

/** Test adapter: runs the work against the given fakes (no rollback). */
export function createFakeUnitOfWork(scope: TransactionScope): UnitOfWork {
  return (work) => work(scope);
}
