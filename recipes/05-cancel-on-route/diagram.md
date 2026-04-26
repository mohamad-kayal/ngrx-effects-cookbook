# Cancellation on route change

```mermaid
sequenceDiagram
    participant User
    participant Router
    participant Effect
    participant API
    participant Store

    User->>Store: loadOrder(123)
    Store->>Effect: action
    Effect->>API: fetch order 123
    User->>Router: navigate to /orders/456
    Router-->>Effect: NavigationStart
    Effect--xAPI: unsubscribe via takeUntil
    API--xStore: stale success never dispatches
```

The explicit-action version replaces `NavigationStart` with `cancelLoadOrder`. The cancellation mechanism is the same: the cancel stream is inside the inner observable, next to the request it owns.