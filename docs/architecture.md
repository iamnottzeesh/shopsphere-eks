# ShopSphere Architecture

```mermaid
flowchart TB
    User[User / Browser]

    subgraph AWS["AWS Account - ap-south-1 (Mumbai)"]
        subgraph VPC["Amazon VPC"]
            NLB[AWS Network Load Balancer<br/>Public endpoint]

            subgraph EKS["Amazon EKS: shopsphere-eks"]
                SVC[Kubernetes Service<br/>product-service<br/>Port 80]
                DEPLOY[Deployment: product-service<br/>Replicas: 2]

                subgraph AZA["Availability Zone: ap-south-1a"]
                    POD1[Product Service Pod 1<br/>Node.js + Express<br/>Port 3000]
                end

                subgraph AZB["Availability Zone: ap-south-1b"]
                    POD2[Product Service Pod 2<br/>Node.js + Express<br/>Port 3000]
                end
            end

            ECR[Amazon ECR<br/>shopsphere-product-service:1.0.0]
        end

        EC2[EC2 Development Workstation<br/>Docker, AWS CLI, kubectl, eksctl]
    end

    GITHUB[GitHub Repository<br/>iamnottzeesh/shopsphere-eks]

    User -->|HTTP :80| NLB
    NLB --> SVC
    SVC --> DEPLOY
    DEPLOY --> POD1
    DEPLOY --> POD2
    ECR -. Pull image .-> POD1
    ECR -. Pull image .-> POD2
    EC2 -->|Build and push image| ECR
    EC2 -->|kubectl deploy| EKS
    EC2 -->|git push| GITHUB

    classDef aws fill:#fff3e0,stroke:#ff9900,color:#232f3e,stroke-width:2px;
    classDef k8s fill:#e8f3ff,stroke:#326ce5,color:#102a43,stroke-width:2px;
    classDef app fill:#f1eaff,stroke:#7048e8,color:#2d1b69,stroke-width:2px;
    classDef external fill:#eafaf1,stroke:#2e8b57,color:#123524,stroke-width:2px;

    class NLB,ECR,EC2 aws;
    class SVC,DEPLOY k8s;
    class POD1,POD2 app;
    class User,GITHUB external;
```

## Request Flow

1. A user opens the public load balancer DNS in a browser.
2. The AWS Network Load Balancer receives the HTTP request on port 80.
3. The Kubernetes `product-service` Service routes the request to a healthy pod.
4. One of two Node.js/Express Product Service pods responds on port 3000.
5. Both pods pull the container image from the private Amazon ECR repository.
6. The EC2 development workstation builds images, pushes them to ECR, deploys Kubernetes manifests, and pushes source code to GitHub.
