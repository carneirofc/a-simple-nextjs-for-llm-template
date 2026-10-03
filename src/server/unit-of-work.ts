import "server-only";
import type { Database } from "./db/client";
import { createDrizzleOutbox } from "./events/drizzle-outbox";
import type { MessageQueue } from "./events/outbox-ports";
import { createDrizzleNotesRepository } from "./notes/drizzle-notes-repository";
import type { NotesRepository } from "./notes/notes-ports";

/** Ports bound to one transaction: everything written through them commits or rolls back together. */
export type TransactionScope = {
  readonly notesRepo: NotesRepository;
  /** Enqueues commit or roll back with the writes above (transactional outbox). */
  readonly outbox: MessageQueue;
};

/** Port: runs `work` atomically. This is what makes "state change + outbox event" one write. */
export type UnitOfWork = <T>(work: (scope: TransactionScope) => Promise<T>) => Promise<T>;

export function createDrizzleUnitOfWork(db: Database): UnitOfWork {
  return (work) =>
    db.transaction((tx) =>
      work({ notesRepo: createDrizzleNotesRepository(tx), outbox: createDrizzleOutbox(tx) }),
    );
}
