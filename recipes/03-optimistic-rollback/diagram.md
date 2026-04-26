# Optimistic updates with rollback

```mermaid
stateDiagram-v2
    [*] --> ServerFalse: server enabled=false
    ServerFalse --> PendingFirst: first optimistic enabled=true\nstack=[first:true]
    PendingFirst --> PendingSecond: second optimistic enabled=false\nstack=[first:true, second:false]
    PendingSecond --> FirstFails: first fails\nremove first
    FirstFails --> StillFalse: rebuild from server false + stack=[second:false]
    StillFalse --> ConfirmedFalse: second succeeds\nserver=false, stack=[]
    PendingSecond --> SecondFails: second fails\nremove second
    SecondFails --> StillTrue: rebuild from server false + stack=[first:true]
```

The important move is rebuilding the visible entity from `serverEntities[id]` plus the remaining pending stack after every success or failure. No action ever rolls back to a single global `previous` value.