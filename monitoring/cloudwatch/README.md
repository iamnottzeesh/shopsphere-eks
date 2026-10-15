# Product-service CloudWatch dashboard

Name: shopsphere-product-service-overview
Region: ap-south-1
Cluster: shopsphere-eks
Namespace: shopsphere

## Widgets
- Memory over pod limit: Maximum, 60-second periods, reference line 80%.
- Running pods: Minimum, 60-second periods, reference line 2.
- Existing high-memory and low-running-pods alarm statuses.

## Validation
On 2026-10-15, put-dashboard returned no validation messages.
Console inspection showed both graphs and both alarms in OK state.

## Limitations
Running pod count does not guarantee readiness or HTTP availability.
Brief pod-count increases alone do not prove HPA scaling.
Reference lines do not represent the full alarm evaluation logic.
This JSON creates the dashboard, not the alarms.
Account and workload identifiers are environment-specific.
Applying the JSON replaces the complete dashboard with the same name.
