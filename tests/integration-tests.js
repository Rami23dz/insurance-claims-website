const assert = require('assert');
const mongoose = require('mongoose');
const User = require('../backend/models/User');
const Document = require('../backend/models/Document');
const textExtractionService = require('../backend/services/textExtractionService');
const documentGenerationService = require('../backend/services/documentGenerationService');
const documentProcessorService = require('../backend/services/documentProcessorService');
const fs = require('fs');
const path = require('path');

/**
 * Integration tests for the insurance claims processing system
 */
class IntegrationTests {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0
    };
    this.testUser = null;
    this.testDocuments = [];
  }

  /**
   * Run all integration tests
   */
  async runAllTests() {
    console.log('Starting integration tests...');
    
    try {
      // Connect to test database
      await this.connectToDatabase();
      
      // Setup test data
      await this.setupTestData();
      
      // Run tests
      await this.testAuthenticationSystem();
      await this.testDocumentUpload();
      await this.testTextExtraction();
      await this.testDocumentGeneration();
      await this.testEndToEndWorkflow();
      
      // Cleanup test data
      await this.cleanupTestData();
      
      // Disconnect from database
      await this.disconnectFromDatabase();
      
      // Print test results
      this.printTestResults();
    } catch (error) {
      console.error('Integration tests failed:', error);
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
      // Create test user
      this.testUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'admin'
      });
      
      await this.testUser.save();
      
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
          uploadedBy: this.testUser._id
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
      
      // Delete test user
      await User.findByIdAndDelete(this.testUser._id);
      
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
   * Test authentication system
   */
  async testAuthenticationSystem() {
    await this.runTest('User authentication', async () => {
      // Test user creation
      const user = await User.findOne({ email: 'test@example.com' });
      assert(user, 'User should exist');
      assert.strictEqual(user.username, 'testuser', 'Username should match');
      assert.strictEqual(user.role, 'admin', 'Role should match');
      
      // Test password validation
      const isMatch = await user.matchPassword('password123');
      assert(isMatch, 'Password should match');
    });
  }

  /**
   * Test document upload system
   */
  async testDocumentUpload() {
    await this.runTest('Document upload', async () => {
      // Test document creation
      for (const doc of this.testDocuments) {
        const document = await Document.findById(doc._id);
        assert(document, 'Document should exist');
        assert.strictEqual(document.incidentType, doc.incidentType, 'Incident type should match');
        assert.strictEqual(document.language, doc.language, 'Language should match');
        assert(fs.existsSync(document.filePath), 'Document file should exist');
      }
    });
  }

  /**
   * Test text extraction system
   */
  async testTextExtraction() {
    await this.runTest('Text extraction', async () => {
      // Mock the text extraction process
      const mockExtractText = async (filePath, fileType, language) => {
        // Return mock text based on language
        if (language === 'ar') {
          return 'نص عربي للاختبار. سرقة في المبنى.';
        } else {
          return 'Texte français pour test. Vol dans le bâtiment.';
        }
      };
      
      // Save original method
      const originalExtractText = textExtractionService.extractText;
      
      // Replace with mock
      textExtractionService.extractText = mockExtractText;
      
      // Test extraction for each document
      for (const doc of this.testDocuments) {
        const result = await textExtractionService.processDocument(doc);
        
        assert(result.extractedText, 'Should have extracted text');
        assert(result.extractedData, 'Should have extracted data');
        
        // Verify language-specific extraction
        if (doc.language === 'ar') {
          assert(result.extractedText.includes('عربي'), 'Should contain Arabic text');
        } else {
          assert(result.extractedText.includes('français'), 'Should contain French text');
        }
        
        // Verify incident type detection
        if (doc.incidentType === 'VOL') {
          assert(result.extractedData.description, 'Should have description');
        }
      }
      
      // Restore original method
      textExtractionService.extractText = originalExtractText;
    });
  }

  /**
   * Test document generation system
   */
  async testDocumentGeneration() {
    await this.runTest('Document generation', async () => {
      // Mock the PDF generation process
      const mockGeneratePdfFromHtml = async (html, outputPath) => {
        // Just write the HTML to the output file for testing
        fs.writeFileSync(outputPath, html);
        return outputPath;
      };
      
      // Save original method
      const originalGeneratePdfFromHtml = documentGenerationService.generatePdfFromHtml;
      
      // Replace with mock
      documentGenerationService.generatePdfFromHtml = mockGeneratePdfFromHtml;
      
      // Test document generation for each document
      for (const doc of this.testDocuments) {
        // Create mock extracted data
        const extractedData = {
          date: '01/01/2025',
          location: 'Test Location',
          description: 'Test description',
          stolenItems: 'Test items',
          perpetratorInfo: 'Unknown'
        };
        
        // Generate documents
        const generatedDocs = await documentGenerationService.generateDocuments(doc, extractedData);
        
        // Verify generated documents
        assert(generatedDocs.length > 0, 'Should have generated documents');
        
        // All documents should have a declaration
        const declaration = generatedDocs.find(d => d.type === 'declaration');
        assert(declaration, 'Should have generated a declaration');
        assert(fs.existsSync(declaration.filePath), 'Declaration file should exist');
        
        // VOL and VANDALISM should have a depot_de_plainte
        if (doc.incidentType === 'VOL' || doc.incidentType === 'VANDALISM') {
          const plainte = generatedDocs.find(d => d.type === 'depot_de_plainte');
          assert(plainte, 'Should have generated a depot_de_plainte');
          assert(fs.existsSync(plainte.filePath), 'Depot de plainte file should exist');
        }
        
        // Clean up generated files
        for (const genDoc of generatedDocs) {
          if (fs.existsSync(genDoc.filePath)) {
            fs.unlinkSync(genDoc.filePath);
          }
          
          // Also clean up HTML files
          const htmlPath = genDoc.filePath.replace('.pdf', '.html');
          if (fs.existsSync(htmlPath)) {
            fs.unlinkSync(htmlPath);
          }
        }
      }
      
      // Restore original method
      documentGenerationService.generatePdfFromHtml = originalGeneratePdfFromHtml;
    });
  }

  /**
   * Test end-to-end workflow
   */
  async testEndToEndWorkflow() {
    await this.runTest('End-to-end workflow', async () => {
      // Mock the text extraction and PDF generation processes
      const mockExtractText = async (filePath, fileType, language) => {
        // Return mock text based on language
        if (language === 'ar') {
          return 'نص عربي للاختبار. سرقة في المبنى.';
        } else {
          return 'Texte français pour test. Vol dans le bâtiment.';
        }
      };
      
      const mockGeneratePdfFromHtml = async (html, outputPath) => {
        // Just write the HTML to the output file for testing
        fs.writeFileSync(outputPath, html);
        return outputPath;
      };
      
      // Save original methods
      const originalExtractText = textExtractionService.extractText;
      const originalGeneratePdfFromHtml = documentGenerationService.generatePdfFromHtml;
      
      // Replace with mocks
      textExtractionService.extractText = mockExtractText;
      documentGenerationService.generatePdfFromHtml = mockGeneratePdfFromHtml;
      
      // Test the complete workflow for one document
      const testDoc = this.testDocuments[0];
      
      // Process the document
      const processedDoc = await documentProcessorService.processDocument(testDoc._id);
      
      // Verify the document was processed
      assert.strictEqual(processedDoc.status, 'completed', 'Document should be marked as completed');
      assert(processedDoc.extractedData, 'Document should have extracted data');
      assert(processedDoc.generatedDocuments.length > 0, 'Document should have generated documents');
      
      // Clean up generated files
      for (const genDoc of processedDoc.generatedDocuments) {
        if (fs.existsSync(genDoc.filePath)) {
          fs.unlinkSync(genDoc.filePath);
        }
        
        // Also clean up HTML files
        const htmlPath = genDoc.filePath.replace('.pdf', '.html');
        if (fs.existsSync(htmlPath)) {
          fs.unlinkSync(htmlPath);
        }
      }
      
      // Restore original methods
      textExtractionService.extractText = originalExtractText;
      documentGenerationService.generatePdfFromHtml = originalGeneratePdfFromHtml;
    });
  }

  /**
   * Print test results
   */
  printTestResults() {
    console.log('\n--- Integration Test Results ---');
    console.log(`Total tests: ${this.testResults.total}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);
    console.log('-------------------------------\n');
    
    if (this.testResults.failed === 0) {
      console.log('✅ All integration tests passed!');
    } else {
      console.log(`❌ ${this.testResults.failed} integration tests failed.`);
    }
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  const tests = new IntegrationTests();
  tests.runAllTests();
}

module.exports = IntegrationTests;
