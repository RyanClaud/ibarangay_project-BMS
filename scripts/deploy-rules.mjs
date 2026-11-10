import fs from 'fs';
import path from 'path';
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function deployRules() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) throw new Error('Missing private key');
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  console.log('Project ID:', projectId);
  console.log('Client Email:', clientEmail);

  const auth = new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase'],
  });

  const client = await auth.getClient();
  const rulesContent = fs.readFileSync('firestore.rules', 'utf8');

  console.log('Creating ruleset on project:', projectId);
  const createRulesetUrl = `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`;
  const createRes = await client.request({
    url: createRulesetUrl,
    method: 'POST',
    data: {
      source: {
        files: [
          {
            name: 'firestore.rules',
            content: rulesContent,
          },
        ],
      },
    },
  });

  const rulesetName = createRes.data.name;
  console.log('Created ruleset:', rulesetName);

  console.log('Releasing ruleset to cloud.firestore...');
  const releaseUrl = `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`;
  const releaseRes = await client.request({
    url: releaseUrl,
    method: 'PATCH',
    data: {
      release: {
        name: `projects/${projectId}/releases/cloud.firestore`,
        rulesetName: rulesetName,
      },
    },
  });

  console.log('Rules released successfully!', releaseRes.data);
}

deployRules().catch((err) => {
  console.error('Failed to deploy rules:', err?.response?.data || err.message);
  process.exit(1);
});

