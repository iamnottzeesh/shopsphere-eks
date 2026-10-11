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
Internet
  |
  v
AWS Network Load Balancer
  |
  v
Kubernetes Service (LoadBalancer)
  |
  v
Product Service Deployment (2 replicas)
  |
  +-----------------------------+
  |                             |
  v                             v
Product Service Pod        Product Service Pod
  |                             |
  +-------------+---------------+
                |
                v
Amazon ECR: shopsphere-product-service:1.0.0
```

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
- **Image:** `121973526749.dkr.ecr.ap-south-1.amazonaws.com/shopsphere-product-service:1.0.0`

## Project Structure

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

### Build and Push Image

```bash
docker build -t shopsphere-product-service:1.0.0 services/product-service

docker tag shopsphere-product-service:1.0.0 \
  121973526749.dkr.ecr.ap-south-1.amazonaws.com/shopsphere-product-service:1.0.0

docker push \
  121973526749.dkr.ecr.ap-south-1.amazonaws.com/shopsphere-product-service:1.0.0
```

### Apply Kubernetes Manifest

```bash
aws eks update-kubeconfig \
  --region ap-south-1 \
  --name shopsphere-eks

kubectl apply -f kubernetes/product-service.yaml

kubectl get all -n shopsphere
```

### Verify Public Endpoint

```bash
kubectl get service product-service -n shopsphere
```

Use the `EXTERNAL-IP`/DNS value:

```bash
curl http://<load-balancer-dns>/health
```

## Validation Completed

- Local Node.js API tests passed
- Docker image built successfully
- Container runs as a non-root `appuser`
- Image pushed to Amazon ECR
- EKS Deployment rolled out successfully
- Two Product Service pods are running and ready
- Liveness and readiness probes are passing
- Public LoadBalancer endpoint successfully serves the API

## Future Improvements

- Frontend web application
- ConfigMaps and AWS Secrets Manager integration
- Horizontal Pod Autoscaler
- CloudWatch Container Insights and centralized logging
- CI/CD using GitHub Actions with AWS OIDC
- AWS Load Balancer Controller, Ingress, HTTPS, and custom domain
- Cart, order, and authentication microservices
- Database integration

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
