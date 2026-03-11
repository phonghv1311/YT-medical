import { registerAs } from '@nestjs/config';

export default registerAs('spaces', () => ({
  endpoint: process.env.SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
  region: process.env.SPACES_REGION || 'nyc3',
  bucket: process.env.SPACES_BUCKET || 'telemedicine',
  key: process.env.SPACES_KEY || '',
  secret: process.env.SPACES_SECRET || '',
}));
