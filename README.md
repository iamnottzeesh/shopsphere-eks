# ShopSphere on Amazon EKS

A cloud-native Product Catalog microservice deployed on Amazon Elastic Kubernetes Service (EKS). The project demonstrates containerization, image management with Amazon ECR, Kubernetes deployment practices, health checks, resource management, and public access through an AWS load balancer.

## Live API

> The public load balancer endpoint is intended for demonstration and may be removed to control AWS costs.

```text
http://ae83699b242d44ed5a484343df05df03-794938345.ap-south-1.elb.amazonaws.com
```

| Endpoint | Description |
|---|---|
| `GET /health` | Service health status |
| `GET /products` | Return all products |
| `GET /products/:id` | Return a product by ID |
| `GET /products?category=electronics` | Filter products by category |

Example request:

```bash
curl http://ae83699b242d44ed5a484343df05df03-794938345.ap-south-1.elb.amazonaws.com/products
```

## Architecture

```text
Client -> Public AWS load balancer -> Kubernetes Service -> Product-service pods
```

Images are pulled from Amazon ECR and pinned by digest.
HPA manages 2-10 replicas using Kubernetes CPU resource metrics.
GitHub Actions handles manual releases; CloudWatch provides observability.
The AWS load balancer subtype is not asserted here.

## Architecture Diagram

See the detailed diagram in [docs/architecture.md](docs/architecture.md).

## Technology Stack

- Node.js 22
- Express 5
- Docker
- Amazon ECR
- Amazon EKS
- Kubernetes
- AWS Elastic Load Balancing
- Amazon EC2
- GitHub

## Kubernetes Configuration

The Product Service is deployed in the `shopsphere` namespace.

- **Replicas:** 2
- **Container port:** 3000
- **Service port:** 80
- **Readiness probe:** `GET /health`
- **Liveness probe:** `GET /health`
- **CPU request/limit:** 100m / 250m
- **Memory request/limit:** 128Mi / 256Mi
- **Image:** SHA-256 digest recorded in `kubernetes/product-service.yaml`.

## Project Structure

Application-focused excerpt; not the full repository tree.

```text
.
├── kubernetes/
│   └── product-service.yaml
└── services/
    └── product-service/
        ├── src/
        │   ├── products.js
        │   └── server.js
        ├── .dockerignore
        ├── Dockerfile
        ├── package.json
        └── package-lock.json
```

## Run Locally

### Prerequisites

- Node.js 22 or later
- npm
- Docker, optional for container testing

### Run with Node.js

```bash
cd services/product-service
npm install
npm start
```

Open:

```text
http://localhost:3000/products
```

### Run with Docker

```bash
cd services/product-service

docker build -t shopsphere-product-service:1.0.0 .

docker run --rm -p 3000:3000 \
  --name shopsphere-product-service \
  shopsphere-product-service:1.0.0
```

Test:

```bash
curl http://localhost:3000/health
```

## Deploy to Amazon EKS

### Normal release process

1. Push reviewed source changes to main.
2. Open Actions: ShopSphere Product Service Build and Deploy.
3. Manually run on main with deploy=true.
4. Wait for build, smoke test, rollout, and public endpoint checks.
5. Review the generated release-recording PR.
6. Compare its image digest with the live Deployment before merging.

Push alone does not trigger this workflow.
With deploy=false, the workflow builds, smoke-tests, and publishes only.

Recovery attempts restore the previous image after rollout failure.
External endpoint-check failures do not trigger that restoration step.

### Initial application setup on an existing cluster

Review environment-specific manifests before applying.
These commands are not needed after each normal release:

```bash
kubectl apply -f k8s/namespaces/shopsphere-namespace.yaml
kubectl apply -f kubernetes/product-service-configmap.yaml
kubectl apply -f kubernetes/product-service.yaml
kubectl apply -f kubernetes/product-service-hpa.yaml
```

Ensure the manifest image is the intended release before reapplying it.

## Validation Completed

- Local Node.js API tests passed
- Docker image built successfully
- Container runs as a non-root `appuser`
- Image pushed to Amazon ECR
- EKS Deployment rolled out successfully
- Two Product Service pods are running and ready
- Liveness and readiness probes are passing
- Public LoadBalancer endpoint successfully serves the API

## Implemented Platform Features

- Static product storefront and catalog API.
- Runtime configuration through a Kubernetes ConfigMap.
- CPU-based HPA: minimum 2, maximum 10, target 70%.
- Manual GitHub Actions releases with AWS OIDC.
- ECR image publication and deployment by SHA-256 digest.
- Rollout diagnostics and recovery after rollout failure.
- Public health/products verification before release-recording PR creation.
- CloudWatch metrics, alarms, dashboard, and centralized application logs.
- Structured HTTP logs with response X-Request-ID correlation.

## Validation Evidence

- [Architecture](docs/architecture.md)
- [HPA scaling validation](docs/hpa-validation-20261014T125802Z/README.md)
- [HPA evidence limitations](docs/hpa-validation-20261014T125917Z/README.md)
- [Alarm and notification validation](docs/cloudwatch-alarms/README.md)
- [CloudWatch dashboard](monitoring/cloudwatch/README.md)
- [HTTP request logging](docs/request-logging/README.md)

## Remaining Improvements

- HTTPS, custom domain, and Ingress.
- AWS Secrets Manager integration.
- Cart, order, and authentication services.
- Database integration.
- Finite CloudWatch log retention policy.
- Committed automated request-logging regression tests.
- GitHub Actions checkout runtime-warning maintenance.

Validation limitations are documented in the linked evidence.
Current implemented business-service scope is product-service.

## Cleanup

This project uses billable AWS resources, including EKS, worker nodes, EBS storage, Elastic Load Balancing, and ECR.

To delete the current application resources:

```bash
kubectl delete -f kubernetes/product-service.yaml
```

Delete the EKS cluster only when you no longer need it:

```bash
eksctl delete cluster --name shopsphere-eks --region ap-south-1
```
