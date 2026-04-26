# 03 — Optimistic updates with rollback

> Apply the change in the reducer immediately, fire the effect, and on failure dispatch a rollback. The headline edge case is the one tutorials skip — what happens when a second optimistic update lands before the first resolves.

## The problem

Optimistic UI is the difference between "instant" and "snappy" in a Lighthouse review. Standard NGRX guidance says: dispatch the optimistic action, let the reducer apply it, fire an effect, on failure dispatch a rollback. That works for one update at a time.

It falls apart when:

- A user toggles a switch twice quickly before the first server round-trip completes.
- A list reorder is dragged through three positions while the backend is slow.
- A "like" button is double-tapped on a bad connection.

Naive rollback (`state.previous`) clobbers the second update with the rollback of the first. You end up with a UI that snaps backwards through history every time a network blip happens.

## The wrong way

```ts
on(updateOptimistic, (state, { newValue }) => ({
  ...state,
  value: newValue,
  previous: state.value,  // ❌ overwritten by every new optimistic update
})),
on(updateFailed, (state) => ({ ...state, value: state.previous })),
```

## The right way

Track each optimistic update as its own pending entry, keyed by a correlation ID and ordered by a local sequence number:

```ts
type Pending = Record<string, Array<{ correlationId: string; enabled: boolean; sequence: number }>>;

on(toggleFlagOptimistic, (state, { id, enabled, correlationId }) => {
  const sequence = state.nextSequence;
  const pending = {
    ...state.pending,
    [id]: [...(state.pending[id] ?? []), { correlationId, enabled, sequence }],
  };

  return {
    ...state,
    nextSequence: sequence + 1,
    pending,
    entities: { ...state.entities, [id]: rebuildEntity(id, state.serverEntities, pending) },
  };
});

on(toggleFlagSuccess, (state, { id, enabled, correlationId }) => {
  const confirmed = findPendingChange(state.pending, id, correlationId);
  if (!confirmed) return state;

  const serverEntities = {
    ...state.serverEntities,
    [id]: { ...state.serverEntities[id], enabled },
  };
  const pending = withoutSupersededChanges(state.pending, id, confirmed.sequence);

  return {
    ...state,
    serverEntities,
    pending,
    entities: { ...state.entities, [id]: rebuildEntity(id, serverEntities, pending) },
  };
});

on(toggleFlagFailure, (state, { id, correlationId }) => {
  const pending = withoutCorrelation(state.pending, id, correlationId);

  return {
    ...state,
    pending,
    entities: { ...state.entities, [id]: rebuildEntity(id, state.serverEntities, pending) },
  };
});
```

The effect attaches the correlation ID to the request and echoes it back in success/failure actions. A newer successful absolute update supersedes older unresolved entries for that entity, so stale responses cannot pull the UI behind the user's latest confirmed intent.

## Edge cases this recipe handles

| Scenario | Behaviour |
|---|---|
| Single update succeeds | Pending entry dropped, no visible change |
| Single update fails | Visible value reverts to last-known-server |
| Two updates in flight, both succeed | Pending stack drained in order, no visual flicker |
| Two updates in flight, first fails | Second update remains visible (unaffected) |
| Two updates in flight, second fails | First update remains visible |
| Two updates in flight, second succeeds first | Older unresolved update is superseded; later stale responses are ignored |
| Two updates in flight, both fail | Visible value reverts cleanly to last-known-server |

## Diagram

See [diagram.md](diagram.md) — state-transition diagram showing the pending stack across concurrent updates.

## Tests

See [effects.spec.ts](effects.spec.ts) — jest-marbles tests for each row of the edge-case table above.

## When NOT to use this

If your domain doesn't tolerate apparent inconsistency (financial transactions, inventory commits), don't optimistically update. Show a spinner and wait for the server. Optimistic UI is for low-stakes, high-frequency interactions (likes, toggles, reorders, drafts).
