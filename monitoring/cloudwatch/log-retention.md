# Container Insights log retention

Validated: 2026-10-15
Region: ap-south-1
Cluster: shopsphere-eks

The following existing CloudWatch log groups were updated
with put-retention-policy and verified using describe-log-groups:

| Log group | Retention days |
|---|---|
| /aws/containerinsights/shopsphere-eks/application | 30 |
| /aws/containerinsights/shopsphere-eks/dataplane | 30 |
| /aws/containerinsights/shopsphere-eks/host | 30 |
| /aws/containerinsights/shopsphere-eks/performance | 30 |

This records a manually applied configuration.
It does not automatically enforce retention on recreated or new groups.
Application Deployments and dashboard definitions were not changed.
