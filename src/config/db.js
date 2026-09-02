const dns = require('dns');
const mongoose = require('mongoose');

// Configure reliable DNS servers for SRV record resolution on Windows/Node environments
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (dnsErr) {
  console.warn('[DNS Warning]: Could not set custom DNS servers:', dnsErr.message);
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://rahulshirol1017_db_user:XJibkkgrg2f3k8Cs@cluster0.getm1pv.mongodb.net/mplads_db?retryWrites=true&w=majority&appName=Cluster0';
  const replicaSetUri = process.env.MONGODB_REPLICA_SET_URI;
  const dbName = process.env.MONGODB_DB || 'mplads_db';

  const connectionOptions = {
    dbName,
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 20,
    retryWrites: true,
    w: 'majority',
    appName: 'Cluster0'
  };

  try {
    const conn = await mongoose.connect(uri, connectionOptions);
    console.log(`[MongoDB Connected]: ${conn.connection.host} (Database: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB Warning]: Primary connection failed: ${error.message}`);
    if (replicaSetUri) {
      try {
        console.log('[MongoDB]: Attempting fallback to direct replica set nodes...');
        const conn = await mongoose.connect(replicaSetUri, connectionOptions);
        console.log(`[MongoDB Connected via Replica Set]: ${conn.connection.host} (Database: ${conn.connection.name})`);
        return conn;
      } catch (replicaErr) {
        console.error(`[MongoDB Error]: Replica set fallback also failed: ${replicaErr.message}`);
      }
    }
    console.warn(`[Hackathon Tip]: Verify credentials, IP whitelist (0.0.0.0/0), and MONGODB_URI in your .env file.\n`);
    return null;
  }
};

module.exports = connectDB;

