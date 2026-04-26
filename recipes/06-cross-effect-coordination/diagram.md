# Cross-effect coordination

```mermaid
sequenceDiagram
    participant A as loadCurrentUser effect
    participant B as dashboard effect
    participant Store
    participant Router
    participant API

    rect rgb(238, 244, 252)
      A->>API: load current user
      API-->>A: user with tenantId
      A->>Store: loadCurrentUserSuccess
      Store-->>B: coordination action fan-out
      B->>API: load dashboard
    end

    rect rgb(241, 247, 240)
      Router->>Store: dashboard route entered
      B->>Store: concatLatestFrom(selectCurrentUser)
      Store-->>B: ready user
      B->>API: load dashboard
    end

    rect rgb(250, 244, 236)
      Store->>B: dashboardRequested
      B->>Store: wait for selectCurrentUser truthy
      Store-->>B: ready user
      B->>API: load dashboard
    end
```

Pattern A is best for fan-out. Pattern B is best when navigation owns the dependency. Pattern C is useful when the user action arrives before readiness and should wait instead of being dropped.