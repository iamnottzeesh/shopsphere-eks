# Product-service HPA validation evidence

## Capture
Historical snapshots captured on 2026-10-14 at 12:59:17 UTC.
See captured-at.txt for the original capture timestamp.

## Configuration
- Target: shopsphere/product-service Deployment
- CPU utilization target: 70% of CPU requests
- Minimum replicas: 2
- Maximum replicas: 10
- Scale-down stabilization window: 300 seconds

## Observed historical behavior
hpa-details.txt includes SuccessfulRescale events:
- New size: 3; CPU utilization above target.
- New size: 2; all metrics below target.

The final captured Deployment state was 2/2 ready and available.
Both captured pods were Running with zero restarts.
CPU and memory metrics were available.

## Evidence limitations
These files are snapshots, not a complete load-test time series.
They do not record the load-generator command, request rate,
peak CPU utilization, or three replicas simultaneously Ready.
Event ages are relative to the original capture time.
Do not infer exact scaling duration from aggregated event ages.

## Follow-up observation: 2026-10-15
A separate terminal inspection showed:
- Two product-service pods, each 1/1 Running with zero restarts.
- Each container using 1m CPU and 37Mi memory.
- v1beta1.metrics.k8s.io API availability: True.
- HPA conditions AbleToScale=True and ScalingActive=True.
- Recent metric-fetch warnings were present in HPA event history.

The follow-up terminal output is not included in the original
snapshot files. The cause of the earlier warnings was not confirmed.
