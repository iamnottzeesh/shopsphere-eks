# ShopSphere Architecture

Current application scope: product-service catalog API and static storefront.
Region: ap-south-1. Cluster: shopsphere-eks. Namespace: shopsphere.

This is a logical diagram, not an exact Availability Zone placement map.
The AWS load balancer subtype is not asserted here.

```mermaid
flowchart TB
    Client[Browser or API client] --> LB[Public AWS load balancer - HTTP]
    LB --> Service[Kubernetes LoadBalancer Service - port 80]
    Service --> Pods[Product-service pods - port 3000]
    Config[ConfigMap] --> Pods
    Metrics[Kubernetes resource metrics] --> HPA[HPA - CPU target 70%]
    HPA --> Deployment[Deployment - replicas 2 to 10]
    Deployment --> Pods
    GitHub[GitHub main] --> Actions[Manual GitHub Actions release]
    Actions --> OIDC[AWS IAM role via OIDC]
    Actions --> ECR[ECR - unique tags and image digests]
    Actions -->|deploy=true| Deployment
    ECR -. Image pull .-> Pods
    Actions -->|After rollout and external checks| PR[Release-recording PR]
    PR -->|Review and merge| GitHub
    Pods --> FluentBit[Fluent Bit - application stdout]
    FluentBit --> Logs[CloudWatch Logs]
    Agent[CloudWatch agent] --> Insights[Container Insights metrics]
    Insights --> Alarms[CloudWatch alarms]
    Alarms --> SNS[SNS notifications]
    Insights --> Dashboard[Product-service dashboard]
    Alarms --> Dashboard
```

## Request and logging flow

The public Service routes requests to ready backend pods.
Completed responses include X-Request-ID and emit structured JSON logs.
Fluent Bit forwards application logs to CloudWatch.
A public GET /products request was correlated with its CloudWatch event.

## Release flow

The manual workflow builds, smoke-tests, and publishes an image to ECR.
With deploy=true, it deploys by digest and verifies public endpoints.
A separate job opens a PR recording the verified image digest.
Compare the PR with the live Deployment before merging.
Push alone does not trigger the workflow.
Recovery handles rollout failure, not external endpoint-check failure.

## Scaling and limitations

HPA uses Kubernetes resource metrics, not CloudWatch, to scale pods.
The documented scaling cycle was 2 -> 3 -> 2.
Running-pod metrics do not guarantee HTTP availability.
The current public endpoint uses HTTP.
HTTPS, database integration, and additional services remain future scope.
See the validation documents linked from the main README.
