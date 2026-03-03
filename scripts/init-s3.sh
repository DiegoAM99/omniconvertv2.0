#!/bin/bash

echo "Initializing S3 buckets..."

awslocal s3 mb s3://omniconvert-uploads
awslocal s3 mb s3://omniconvert-outputs

# Set lifecycle policy for auto-deletion after 24 hours
awslocal s3api put-bucket-lifecycle-configuration \
  --bucket omniconvert-uploads \
  --lifecycle-configuration '{
    "Rules": [
      {
        "Id": "DeleteAfter24Hours",
        "Status": "Enabled",
        "Expiration": {
          "Days": 1
        }
      }
    ]
  }'

awslocal s3api put-bucket-lifecycle-configuration \
  --bucket omniconvert-outputs \
  --lifecycle-configuration '{
    "Rules": [
      {
        "Id": "DeleteAfter24Hours",
        "Status": "Enabled",
        "Expiration": {
          "Days": 1
        }
      }
    ]
  }'

echo "✅ S3 buckets created successfully"
