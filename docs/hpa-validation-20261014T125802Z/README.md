# Product Service HPA Validation

## Environment and configuration

- Validation date: 2026-10-14 (UTC)
- Namespace: shopsphere
- Deployment: product-service
- CPU utilization target: 70% of CPU requests
- Minimum replicas: 2
- Maximum replicas: 10
- Scale-down stabilization window: 300 seconds

## Validated scaling cycle

2 replicas -> 3 replicas under load -> 2 replicas after load stopped.

Captured HPA events confirm:
- New size: 3; CPU resource utilization above target
- New size: 2; all metrics below target

## Final state

- Deployment: 2/2 ready, 2 up-to-date, 2 available
- Both pods: 1/1 Running, zero restarts
- HPA CPU utilization: 1%
- CPU usage: 1m per pod
- Memory usage: 50Mi and 49Mi

## Load test scope

HTTP requests targeted the root endpoint (/), which serves storefront HTML.
This validates CPU-based autoscaling for this workload, not full application
capacity or end-to-end product API performance.

First test:
- Duration: 3 minutes
- Concurrent workers: 50
- Rate limit: 5 requests/second per worker
- Result: 45,000 HTTP 200 responses
- Latency: p50 5.5 ms, p95 7.7 ms, p99 13.1 ms

Second test:
- Duration: 3 minutes
- Concurrent workers: 50
- Rate limit: 10 requests/second per worker
- Request timeout: 10 seconds
- Scale-up to 3 replicas was observed.
- Final HTTP summary was not captured in this evidence set.

## Evidence files

- captured-at.txt: capture timestamp
- hpa-details.txt: HPA configuration, conditions, and scaling events
- hpa-status.txt: final HPA status
- deployment-status.txt: final deployment availability
- pod-status.txt: final pod readiness and restarts
- pod-resources.txt: final CPU and memory usage
