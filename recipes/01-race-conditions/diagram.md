# Race conditions & flattening operators

```mermaid
sequenceDiagram
    participant A as Actions
    participant S as switchMap search
    participant C as concatMap save
    participant M as mergeMap upload
    participant E as exhaustMap submit
    participant API as Mock API

    A->>S: search("al")
    A->>S: search("alex")
    S--xAPI: cancel "al"
    S->>API: fetch "alex"
    API-->>S: latest result only

    A->>C: save v1
    A->>C: save v2
    C->>API: save v1
    API-->>C: v1 saved
    C->>API: save v2
    API-->>C: v2 saved

    A->>M: upload a
    A->>M: upload b
    M->>API: a and b in parallel
    API-->>M: whichever finishes first

    A->>E: submit
    A->>E: duplicate submit
    E--xA: duplicate ignored
    E->>API: one submit
```

| Operator | In-flight behavior | Good fit | Dangerous fit |
|---|---|---|---|
| `switchMap` | Cancels previous inner observable | Reads, typeahead | Writes that must finish |
| `concatMap` | Queues work | Ordered writes | High-volume search |
| `mergeMap` | Runs work in parallel | Independent writes | Last-write-wins updates |
| `exhaustMap` | Ignores new triggers | Submit/login buttons | Retry buttons |