import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://Rahul:7mMiKpfzd3Zf15J5@ai-resume-genai.frdqh4n.mongodb.net/cloudSpire_Dev";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('cloudSpire_Dev');
    const collection = db.collection('cloudaccounts');
    const account = await collection.findOne({});
    if (account) {
      console.log('Account found:');
      console.log('credentials:', account.credentials);
    } else {
      console.log('No accounts found.');
    }
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
