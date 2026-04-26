# Debouncing user input to an API

```mermaid
sequenceDiagram
    participant UI
    participant Effect
    participant API
    participant Store

    UI->>Store: searchInput("n")
    Store->>Effect: action
    Effect->>Store: searchTyping("n")
    UI->>Store: searchInput("ng")
    Effect--xEffect: cancel previous debounce/request
    Effect->>Store: searchTyping("ng")
    UI->>Store: searchInput("ngrx")
    Effect--xEffect: cancel previous debounce/request
    Effect->>Store: searchTyping("ngrx")
    Effect->>Effect: 300ms quiet
    Effect->>Store: searchLoading("ngrx")
    Effect->>API: search("ngrx")
    API-->>Effect: results
    Effect->>Store: searchSuccess
```

The effect uses `switchMap` around the whole debounce-plus-request unit. That means the next keystroke cancels not only the timer, but also a request that has already started.