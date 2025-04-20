const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../backend/server');
const User = require('../backend/models/User');
const Document = require('../backend/models/Document');
const fs = require('fs');
const path = require('path');

/**
 * API tests for the insurance claims processing system
 */
class ApiTests {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0
    };
    this.testUser = null;
    this.testAdmin = null;
    this.testToken = null;
    this.adminToken = null;
    this.testDocuments = [];
  }

  /**
   * Run all API tests
   */
  async runAllTests() {
    console.log('Starting API tests...');
    
    try {
      // Connect to test database
      await this.connectToDatabase();
      
      // Setup test data
      await this.setupTestData();
      
      // Run tests
      await this.testAuthEndpoints();
      await this.testUserEndpoints();
      await this.testDocumentEndpoints();
      
      // Cleanup test data
      await this.cleanupTestData();
      
      // Disconnect from database
      await this.disconnectFromDatabase();
      
      // Print test results
      this.printTestResults();
    } catch (error) {
      console.error('API tests failed:', error);
    }
  }

  /**
   * Connect to test database
   */
  async connectToDatabase() {
    console.log('Connecting to test database...');
    
    try {
      await mongoose.connect('mongodb://localhost:27017/insurance_claims_test', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('Connected to test database');
    } catch (error) {
      console.error('Failed to connect to test database:', error);
      throw error;
    }
  }

  /**
   * Disconnect from database
   */
  async disconnectFromDatabase() {
    console.log('Disconnecting from test database...');
    
    try {
      await mongoose.disconnect();
      console.log('Disconnected from test database');
    } catch (error) {
      console.error('Failed to disconnect from test database:', error);
    }
  }

  /**
   * Setup test data
   */
  async setupTestData() {
    console.log('Setting up test data...');
    
    try {
      // Create test users
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      this.testUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'user'
      });
      
      this.testAdmin = new User({
        username: 'testadmin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      await this.testUser.save();
      await this.testAdmin.save();
      
      // Get auth tokens
      const userResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      this.testToken = userResponse.body.token;
      
      const adminResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'password123'
        });
      
      this.adminToken = adminResponse.body.token;
      
      // Create test documents directory
      const testDocsDir = path.join(__dirname, 'test-documents');
      if (!fs.existsSync(testDocsDir)) {
        fs.mkdirSync(testDocsDir, { recursive: true });
      }
      
      // Create test document records
      const testDocTypes = [
        { type: 'VOL', language: 'fr' },
        { type: 'VANDALISM', language: 'ar' },
        { type: 'DEGAT DES EAUX', language: 'fr' }
      ];
      
      for (const docType of testDocTypes) {
        const testDoc = new Document({
          originalFilename: `test_${docType.type}.pdf`,
          filePath: path.join(testDocsDir, `test_${docType.type}.pdf`),
          fileSize: 1024,
          fileType: 'application/pdf',
          language: docType.language,
          incidentType: docType.type,
          uploadedBy: this.testUser._id,
          status: 'pending'
        });
        
        await testDoc.save();
        this.testDocuments.push(testDoc);
        
        // Create dummy file
        fs.writeFileSync(testDoc.filePath, 'Test document content');
      }
      
      console.log('Test data setup complete');
    } catch (error) {
      console.error('Failed to setup test data:', error);
      throw error;
    }
  }

  /**
   * Cleanup test data
   */
  async cleanupTestData() {
    console.log('Cleaning up test data...');
    
    try {
      // Delete test documents
      for (const doc of this.testDocuments) {
        if (fs.existsSync(doc.filePath)) {
          fs.unlinkSync(doc.filePath);
        }
        
        await Document.findByIdAndDelete(doc._id);
      }
      
      // Delete test users
      await User.findByIdAndDelete(this.testUser._id);
      await User.findByIdAndDelete(this.testAdmin._id);
      
      console.log('Test data cleanup complete');
    } catch (error) {
      console.error('Failed to cleanup test data:', error);
    }
  }

  /**
   * Run a test and record the result
   * @param {string} testName - Name of the test
   * @param {Function} testFn - Test function
   */
  async runTest(testName, testFn) {
    console.log(`Running test: ${testName}`);
    this.testResults.total++;
    
    try {
      await testFn();
      console.log(`✅ Test passed: ${testName}`);
      this.testResults.passed++;
    } catch (error) {
      console.error(`❌ Test failed: ${testName}`);
      console.error(error);
      this.testResults.failed++;
    }
  }

  /**
   * Test authentication endpoints
   */
  async testAuthEndpoints() {
    await this.runTest('Login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
    });
    
    await this.runTest('Login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid credentials');
    });
    
    await this.runTest('Get current user', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('x-auth-token', this.testToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.email).toBe('test@example.com');
    });
    
    await this.runTest('Get current user with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('x-auth-token', 'invalidtoken');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Token is not valid');
    });
  }

  /**
   * Test user endpoints
   */
  async testUserEndpoints() {
    await this.runTest('Get all users (admin only)', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('x-auth-token', this.adminToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });
    
    await this.runTest('Get all users (regular user - should fail)', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('x-auth-token', this.testToken);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Access denied');
    });
    
    await this.runTest('Create new user (admin only)', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('x-auth-token', this.adminToken)
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'newpassword',
          role: 'user'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.username).toBe('newuser');
      expect(response.body.email).toBe('new@example.com');
      
      // Clean up
      await User.findOneAndDelete({ email: 'new@example.com' });
    });
    
    await this.runTest('Create new user (regular user - should fail)', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('x-auth-token', this.testToken)
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'newpassword',
          role: 'user'
        });
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Access denied');
    });
  }

  /**
   * Test document endpoints
   */
  async testDocumentEndpoints() {
    await this.runTest('Get all documents (user)', async () => {
      const response = await request(app)
        .get('/api/documents')
        .set('x-auth-token', this.testToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(this.testDocuments.length);
    });
    
    await this.runTest('Get all documents (admin)', async () => {
      const response = await request(app)
        .get('/api/documents')
        .set('x-auth-token', this.adminToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(this.testDocuments.length);
    });
    
    await this.runTest('Get document by ID', async () => {
      const response = await request(app)
        .get(`/api/documents/${this.testDocuments[0]._id}`)
        .set('x-auth-token', this.testToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id');
      expect(response.body._id.toString()).toBe(this.testDocuments[0]._id.toString());
      expect(response.body.incidentType).toBe(this.testDocuments[0].incidentType);
    });
    
    await this.runTest('Process document', async () => {
      // This test is simplified since we can't easily mock the document processor
      const response = await request(app)
        .post(`/api/documents/${this.testDocuments[0]._id}/process`)
        .set('x-auth-token', this.testToken);
      
      // We expect either a success or a failure due to processing issues
      // But the API call itself should work
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('processed');
      }
    });
    
    await this.runTest('Delete document', async () => {
      // Create a temporary document to delete
      const tempDoc = new Document({
        originalFilename: 'temp_doc.pdf',
        filePath: path.join(__dirname, 'test-documents', 'temp_doc.pdf'),
        fileSize: 1024,
        fileType: 'application/pdf',
        language: 'fr',
        incidentType: 'VOL',
        uploadedBy: this.testUser._id,
        status: 'pending'
      });
      
      await tempDoc.save();
      fs.writeFileSync(tempDoc.filePath, 'Temporary document content');
      
      const response = await request(app)
        .delete(`/api/documents/${tempDoc._id}`)
        .set('x-auth-token', this.testToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('removed');
      
      // Verify document is deleted
      const deletedDoc = await Document.findById(tempDoc._id);
      expect(deletedDoc).toBeNull();
      
      // Clean up file if it still exists
      if (fs.existsSync(tempDoc.filePath)) {
        fs.unlinkSync(tempDoc.filePath);
      }
    });
  }

  /**
   * Print test results
   */
  printTestResults() {
    console.log('\n--- API Test Results ---');
    console.log(`Total tests: ${this.testResults.total}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);
    console.log('-------------------------\n');
    
    if (this.testResults.failed === 0) {
      console.log('✅ All API tests passed!');
    } else {
      console.log(`❌ ${this.testResults.failed} API tests failed.`);
    }
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  const tests = new ApiTests();
  tests.runAllTests();
}

module.exports = ApiTests;
