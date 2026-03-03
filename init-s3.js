const { S3Client, CreateBucketCommand, ListBucketsCommand, PutBucketCorsCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
  forcePathStyle: true,
});

const corsConfiguration = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      AllowedOrigins: ['*'],
      ExposeHeaders: ['ETag'],
      MaxAgeSeconds: 3000
    }
  ]
};

async function initS3() {
  console.log('Checking existing buckets...');
  
  try {
    const { Buckets } = await s3Client.send(new ListBucketsCommand({}));
    console.log('Existing buckets:', Buckets?.map(b => b.Name) || []);
    
    const bucketsToCreate = ['omniconvert-uploads', 'omniconvert-outputs'];
    
    for (const bucketName of bucketsToCreate) {
      const exists = Buckets?.some(b => b.Name === bucketName);
      
      if (!exists) {
        console.log(`Creating bucket: ${bucketName}...`);
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log(`✓ Created bucket: ${bucketName}`);
      } else {
        console.log(`✓ Bucket already exists: ${bucketName}`);
      }
      
      // Configure CORS
      console.log(`Configuring CORS for ${bucketName}...`);
      await s3Client.send(new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: corsConfiguration
      }));
      console.log(`✓ CORS configured for ${bucketName}`);
    }
    
    console.log('\n✅ S3 initialization complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

initS3();
