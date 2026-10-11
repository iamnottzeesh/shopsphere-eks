terraform {
  backend "s3" {
    bucket       = "shopsphere-tfstate-121973526749"
    key          = "shopsphere/terraform.tfstate"
    region       = "ap-south-1"
    encrypt      = true
    use_lockfile = true
  }
}
