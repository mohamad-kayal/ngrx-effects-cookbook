# Long-running tasks with progress

```mermaid
sequenceDiagram
    participant UI
    participant Effect
    participant Stream as simulated progress stream
    participant Store

    UI->>Store: startJob(jobId)
    Store->>Effect: action
    Effect->>Stream: subscribe
    Stream-->>Effect: 0%, Queued
    Effect->>Store: jobProgress
    Stream-->>Effect: 50%, Formatting report
    Effect->>Store: jobProgress
    alt success
      Stream-->>Effect: 100%, Done
      Effect->>Store: jobProgress + jobSucceeded
      Effect->>Store: jobFinalized
    else failure
      Stream-->>Effect: error
      Effect->>Store: jobFailed
      Effect->>Store: jobFinalized
    else cancellation
      UI->>Store: cancelJob / logout / route exit
      Effect--xStream: unsubscribe
      Effect->>Store: jobFinalized
    end
```

The transport is an `Observable<JobProgressEvent>`. Replacing `simulateProgress` with `webSocket()` or an `EventSource` wrapper does not change the reducer or tests.