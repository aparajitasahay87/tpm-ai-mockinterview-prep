// mongo-connection-test.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');
const net = require('net');

// Load environment variables
const envPath = path.resolve(__dirname, '../shared-lib/.env');
console.log(`Loading environment variables from: ${envPath}`);
dotenv.config({ path: envPath });

// Get MongoDB URI
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI environment variable is not set');
  process.exit(1);
}

// Parse connection string
function parseMongoUri(uri) {
  try {
    // Basic regex to extract components
    const matches = uri.match(/mongodb:\/\/(?:([^:]+):([^@]+)@)?([^:\/]+)(?::(\d+))?(?:\/([^?]+))?(?:\?(.+))?/);
    
    if (!matches) {
      return { valid: false, error: 'Invalid URI format' };
    }
    
    const [, user, pass, host, port = '27017', dbName = 'test', queryString = ''] = matches;
    
    const options = {};
    if (queryString) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        options[key] = value;
      });
    }
    
    return { 
      valid: true,
      user: user || null,
      host,
      port: parseInt(port, 10),
      database: dbName,
      options,
      hasAuth: !!user
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Sanitize URI for logging
function sanitizeUri(uri) {
  return uri.replace(/mongodb:\/\/([^:]+):([^@]+)@/, 'mongodb://[username]:[password]@');
}

// Test DNS resolution for the hostname
async function testDnsResolution(hostname) {
  return new Promise((resolve) => {
    dns.lookup(hostname, (err, address) => {
      if (err) {
        resolve({ success: false, error: err.message });
      } else {
        resolve({ success: true, address });
      }
    });
  });
}

// Test TCP connection to the server
async function testTcpConnection(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port, timeout: 5000 });
    let status = 'pending';
    
    socket.on('connect', () => {
      status = 'connected';
      socket.end();
    });
    
    socket.on('timeout', () => {
      status = 'timeout';
      socket.destroy();
    });
    
    socket.on('error', (err) => {
      status = 'error';
      resolve({ success: false, error: err.message });
    });
    
    socket.on('close', () => {
      if (status === 'connected') {
        resolve({ success: true });
      } else if (status === 'timeout') {
        resolve({ success: false, error: 'Connection timed out' });
      }
    });
  });
}

// Test MongoDB connection
async function testMongoConnection(uri) {
  try {
    console.log('Attempting MongoDB connection...');
    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    });
    
    console.log('MongoDB connection successful!');
    console.log('Database name:', connection.connection.db.databaseName);
    
    // Test basic database operation
    const collections = await connection.connection.db.listCollections().toArray();
    console.log(`Found ${collections.length} collections:`);
    collections.forEach((collection, i) => {
      console.log(`  ${i+1}. ${collection.name}`);
    });
    
    // Test a collection count
    if (collections.length > 0) {
      const collection = collections[0].name;
      const count = await connection.connection.db.collection(collection).countDocuments();
      console.log(`Collection ${collection} has ${count} documents`);
    }
    
    await mongoose.disconnect();
    console.log('Connection closed successfully');
    
    return { success: true };
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    return { success: false, error: error.message };
  }
}

// Main test function
async function runTests() {
  console.log('==== MongoDB Connection Diagnostic ====');
  console.log('Connection string:', sanitizeUri(uri));
  
  // Parse the connection string
  const parsedUri = parseMongoUri(uri);
  console.log('\n--- Connection String Analysis ---');
  if (parsedUri.valid) {
    console.log('URI format: Valid');
    console.log('Host:', parsedUri.host);
    console.log('Port:', parsedUri.port);
    console.log('Database:', parsedUri.database);
    console.log('Authentication:', parsedUri.hasAuth ? 'Yes' : 'No');
    console.log('Options:', Object.keys(parsedUri.options).length ? Object.keys(parsedUri.options).join(', ') : 'None');
  } else {
    console.log('URI format: Invalid');
    console.log('Error:', parsedUri.error);
    return;
  }
  
  // Test DNS resolution
  console.log('\n--- DNS Resolution Test ---');
  const dnsResult = await testDnsResolution(parsedUri.host);
  if (dnsResult.success) {
    console.log('DNS Resolution: Successful');
    console.log('Resolved IP:', dnsResult.address);
  } else {
    console.log('DNS Resolution: Failed');
    console.log('Error:', dnsResult.error);
  }
  
  // Test TCP connection
  console.log('\n--- TCP Connection Test ---');
  const tcpResult = await testTcpConnection(parsedUri.host, parsedUri.port);
  if (tcpResult.success) {
    console.log('TCP Connection: Successful');
  } else {
    console.log('TCP Connection: Failed');
    console.log('Error:', tcpResult.error);
  }
  
  // Test MongoDB connection
  console.log('\n--- MongoDB Connection Test ---');
  const mongoResult = await testMongoConnection(uri);
  if (mongoResult.success) {
    console.log('MongoDB Connection: Successful');
  } else {
    console.log('MongoDB Connection: Failed');
    console.log('Error:', mongoResult.error);
  }
  
  console.log('\n==== Test Summary ====');
  console.log('DNS Resolution:', dnsResult.success ? '✅ PASS' : '❌ FAIL');
  console.log('TCP Connection:', tcpResult.success ? '✅ PASS' : '❌ FAIL');
  console.log('MongoDB Auth & Connect:', mongoResult.success ? '✅ PASS' : '❌ FAIL');
}

// Run the tests
runTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Unexpected error during testing:', err);
    process.exit(1);
  });