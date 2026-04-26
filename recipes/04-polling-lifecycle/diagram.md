# Polling lifecycles

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Running: startPolling
    Running --> Paused: document hidden
    Paused --> Running: document visible
    Running --> BackingOff: poll error
    BackingOff --> Running: retry succeeds
    BackingOff --> ErrorStopped: retry cap reached
    Running --> Stopped: stopPolling
    Running --> Stopped: logout
    Running --> Stopped: route exit
    Paused --> Stopped: logout / route exit
```

The effect switches the interval source on and off from the visibility stream. While hidden, it switches to `EMPTY`; it does not keep an interval ticking and merely skip fetches.