import { Counter } from "../models/Counter";

/**
 * Atomically reserves the next number in a named sequence, formatted as `${prefix}-000n`.
 * The counter is lazily seeded from `seedCount` (e.g. an existing document count) the first
 * time it's used, so it won't collide with records that existed before the counter did.
 */
export async function getNextSequence(name: string, prefix: string, padLength: number, seedCount = 0): Promise<string> {
  let counter = await Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { new: true });
  if (!counter) {
    await Counter.findOneAndUpdate({ _id: name }, { $setOnInsert: { seq: seedCount } }, { upsert: true, new: true });
    counter = await Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { new: true });
  }
  return `${prefix}-${String(counter!.seq).padStart(padLength, "0")}`;
}
