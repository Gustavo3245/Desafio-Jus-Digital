terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "aws_region" {
  description = "Região AWS onde o bucket S3 de documentos será provisionado"
  type        = string
  default     = "sa-east-1"
}

variable "bucket_name" {
  description = "Nome simples do bucket S3 privado para documentos do JusDigital"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", var.bucket_name))
    error_message = "bucket_name deve conter apenas o nome simples do bucket S3 (3 a 63 caracteres minúsculos), sem ARN ou prefixo s3://."
  }
}

variable "environment" {
  description = "Ambiente de implantação (development, staging, production)"
  type        = string
  default     = "production"
}

provider "aws" {
  region = var.aws_region
}

resource "aws_s3_bucket" "documents" {
  bucket = var.bucket_name

  tags = {
    Application = "JusDigital"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_s3_bucket_ownership_controls" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

data "aws_iam_policy_document" "documents_storage" {
  statement {
    sid    = "AllowScopedDocumentObjectOperations"
    effect = "Allow"

    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject",
    ]

    resources = [
      "${aws_s3_bucket.documents.arn}/users/*",
    ]
  }
}

resource "aws_iam_policy" "documents_storage" {
  name        = "${var.bucket_name}-storage-policy"
  description = "Política de privilégio mínimo para upload, leitura e exclusão de documentos privados do JusDigital"
  policy      = data.aws_iam_policy_document.documents_storage.json
}

output "s3_bucket_name" {
  description = "Nome do bucket privado para configurar em AWS_S3_BUCKET"
  value       = aws_s3_bucket.documents.bucket
}

output "s3_bucket_arn" {
  description = "ARN do bucket privado de documentos"
  value       = aws_s3_bucket.documents.arn
}

output "iam_policy_arn" {
  description = "ARN da política IAM de privilégio mínimo para anexar à role ou usuário da API"
  value       = aws_iam_policy.documents_storage.arn
}
