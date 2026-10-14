# CloudWatch Alarm Validation

Date: 2026-10-14 (UTC)
Cluster: shopsphere-eks
Namespace: shopsphere
Region: ap-south-1

## Alarms

| Alarm | Condition | Evaluation |
|---|---|---|
| shopsphere-product-service-low-running-pods | Minimum running pod count < 2 | 3 of 3 one-minute periods |
| shopsphere-product-service-high-memory | Maximum memory utilization over pod limit >= 80% | 3 of 5 one-minute periods |

Both alarms use ContainerInsights metrics, treat missing data as missing,
and have ALARM and OK notifications enabled through shopsphere-alerts.

## Validation

- Both alarms reached OK through actual metric evaluation.
- Low-pod alarm was temporarily set to ALARM using set-alarm-state.
- CloudWatch then automatically returned it to OK.
- Alarm history recorded successful SNS actions for both transitions.
- OK email receipt was confirmed by the user.
- ALARM email receipt was not separately confirmed.

## Limitations

No actual pod-count outage or high-memory breach was induced.
Running pod count does not guarantee readiness or HTTP availability.
Missing telemetry is not automatically classified as an outage.
Snapshots are evidence, not directly reusable deployment templates.

## Files

- alarm-snapshot.json: alarm configuration and state
- notification-test-history.json: low-pod alarm history
- captured-at.txt: evidence capture timestamp
