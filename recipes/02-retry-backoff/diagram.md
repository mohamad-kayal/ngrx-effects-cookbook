# Retry with exponential backoff + jitter

```mermaid
sequenceDiagram
    participant UI as UI
    participant Store as Store
    participant Effect as Effect
    participant API as API

    UI->>Store: loadReport
    Store->>Effect: [Retry Backoff] Load Report
    Effect->>API: request #1
    API-->>Effect: 503
    Effect->>Store: loadReportRetrying(attempt: 1, delayMs)
    Effect->>Effect: timer(full jitter)
    Effect->>API: request #2
    API-->>Effect: 502
    Effect->>Store: loadReportRetrying(attempt: 2, delayMs)
    Effect->>Effect: timer(full jitter)
    Effect->>API: request #3
    API-->>Effect: 200
    Effect->>Store: loadReportSuccess
```

Non-retryable statuses (`400`, `401`, `403`, `404`, `422`) return `throwError` from the retry `delay` callback. That short-circuits the retry chain and lets the final `catchError` surface the error immediately.