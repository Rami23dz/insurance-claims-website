const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Test runner for the insurance claims processing system
 * Runs all integration and API tests
 */
class TestRunner {
  constructor() {
    this.testsDir = path.join(__dirname);
    this.integrationTestsPath = path.join(this.testsDir, 'integration-tests.js');
    this.apiTestsPath = path.join(this.testsDir, 'api-tests.js');
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('Starting test runner...');
    
    try {
      // Run integration tests
      await this.runIntegrationTests();
      
      // Run API tests
      await this.runApiTests();
      
      console.log('\n✅ All tests completed!');
    } catch (error) {
      console.error('\n❌ Test runner failed:', error);
    }
  }

  /**
   * Run integration tests
   */
  async runIntegrationTests() {
    console.log('\n--- Running Integration Tests ---');
    
    return new Promise((resolve, reject) => {
      exec(`node ${this.integrationTestsPath}`, (error, stdout, stderr) => {
        console.log(stdout);
        
        if (stderr) {
          console.error(stderr);
        }
        
        if (error) {
          console.error(`Integration tests execution error: ${error}`);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Run API tests
   */
  async runApiTests() {
    console.log('\n--- Running API Tests ---');
    
    return new Promise((resolve, reject) => {
      exec(`node ${this.apiTestsPath}`, (error, stdout, stderr) => {
        console.log(stdout);
        
        if (stderr) {
          console.error(stderr);
        }
        
        if (error) {
          console.error(`API tests execution error: ${error}`);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests();
}

module.exports = TestRunner;
