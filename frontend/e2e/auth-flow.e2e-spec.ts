import { browser, by, element, ExpectedConditions as EC } from 'protractor';

describe('Authentication Flow E2E Tests', () => {
  const baseUrl = 'http://localhost:8100';
  const testUser = {
    name: 'E2E Test User',
    email: `e2e.test.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'Blue'
  };

  beforeEach(async () => {
    await browser.get(baseUrl);
    await browser.waitForAngular();
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      // Open auth modal
      const loginButton = element(by.css('[data-testid="header-login-button"]'));
      await browser.wait(EC.elementToBeClickable(loginButton), 5000);
      await loginButton.click();

      // Switch to register mode
      const registerTab = element(by.css('[data-testid="register-tab"]'));
      await browser.wait(EC.elementToBeClickable(registerTab), 5000);
      await registerTab.click();

      // Fill registration form
      await element(by.css('[data-testid="register-name"]')).sendKeys(testUser.name);
      await element(by.css('[data-testid="register-email"]')).sendKeys(testUser.email);
      await element(by.css('[data-testid="register-password"]')).sendKeys(testUser.password);
      await element(by.css('[data-testid="register-confirm-password"]')).sendKeys(testUser.password);
      
      // Select security question
      const securityQuestionSelect = element(by.css('[data-testid="security-question-select"]'));
      await securityQuestionSelect.click();
      await element(by.css(`[data-testid="security-question-option-0"]`)).click();
      
      await element(by.css('[data-testid="security-answer"]')).sendKeys(testUser.securityAnswer);

      // Submit registration
      const registerButton = element(by.css('[data-testid="register-submit"]'));
      await browser.wait(EC.elementToBeClickable(registerButton), 5000);
      await registerButton.click();

      // Wait for success message
      const successMessage = element(by.css('[data-testid="auth-success-message"]'));
      await browser.wait(EC.visibilityOf(successMessage), 10000);
      
      expect(await successMessage.isDisplayed()).toBe(true);

      // Verify modal closes and user is logged in
      await browser.wait(EC.invisibilityOf(element(by.css('[data-testid="auth-modal"]'))), 5000);
      
      const userProfile = element(by.css('[data-testid="user-profile-dropdown"]'));
      await browser.wait(EC.visibilityOf(userProfile), 5000);
      expect(await userProfile.isDisplayed()).toBe(true);
    });

    it('should show validation errors for invalid registration data', async () => {
      // Open auth modal and switch to register
      await element(by.css('[data-testid="header-login-button"]')).click();
      await element(by.css('[data-testid="register-tab"]')).click();

      // Try to submit with empty fields
      const registerButton = element(by.css('[data-testid="register-submit"]'));
      await registerButton.click();

      // Check for validation errors
      const errorMessages = element.all(by.css('[data-testid="validation-error"]'));
      expect(await errorMessages.count()).toBeGreaterThan(0);
    });

    it('should prevent registration with existing email', async () => {
      // Open auth modal and switch to register
      await element(by.css('[data-testid="header-login-button"]')).click();
      await element(by.css('[data-testid="register-tab"]')).click();

      // Fill form with existing email
      await element(by.css('[data-testid="register-name"]')).sendKeys('Another User');
      await element(by.css('[data-testid="register-email"]')).sendKeys('admin@example.com'); // Existing email
      await element(by.css('[data-testid="register-password"]')).sendKeys(testUser.password);
      await element(by.css('[data-testid="register-confirm-password"]')).sendKeys(testUser.password);
      
      // Submit registration
      await element(by.css('[data-testid="register-submit"]')).click();

      // Check for error message
      const errorMessage = element(by.css('[data-testid="auth-error-message"]'));
      await browser.wait(EC.visibilityOf(errorMessage), 5000);
      expect(await errorMessage.getText()).toContain('email');
    });
  });

  describe('User Login', () => {
    beforeAll(async () => {
      // Ensure test user exists (register if needed)
      // This would typically be done through API setup
    });

    it('should login with valid credentials', async () => {
      // Open auth modal
      await element(by.css('[data-testid="header-login-button"]')).click();

      // Fill login form
      await element(by.css('[data-testid="login-email"]')).sendKeys(testUser.email);
      await element(by.css('[data-testid="login-password"]')).sendKeys(testUser.password);

      // Submit login
      const loginButton = element(by.css('[data-testid="login-submit"]'));
      await loginButton.click();

      // Wait for success and modal to close
      await browser.wait(EC.invisibilityOf(element(by.css('[data-testid="auth-modal"]'))), 5000);
      
      // Verify user is logged in
      const userProfile = element(by.css('[data-testid="user-profile-dropdown"]'));
      await browser.wait(EC.visibilityOf(userProfile), 5000);
      expect(await userProfile.isDisplayed()).toBe(true);
    });

    it('should show error for invalid credentials', async () => {
      // Open auth modal
      await element(by.css('[data-testid="header-login-button"]')).click();

      // Fill login form with wrong password
      await element(by.css('[data-testid="login-email"]')).sendKeys(testUser.email);
      await element(by.css('[data-testid="login-password"]')).sendKeys('wrongpassword');

      // Submit login
      await element(by.css('[data-testid="login-submit"]')).click();

      // Check for error message
      const errorMessage = element(by.css('[data-testid="auth-error-message"]'));
      await browser.wait(EC.visibilityOf(errorMessage), 5000);
      expect(await errorMessage.isDisplayed()).toBe(true);
    });

    it('should show loading state during login', async () => {
      // Open auth modal
      await element(by.css('[data-testid="header-login-button"]')).click();

      // Fill login form
      await element(by.css('[data-testid="login-email"]')).sendKeys(testUser.email);
      await element(by.css('[data-testid="login-password"]')).sendKeys(testUser.password);

      // Submit login and immediately check for loading state
      await element(by.css('[data-testid="login-submit"]')).click();
      
      const loadingSpinner = element(by.css('[data-testid="auth-loading-spinner"]'));
      expect(await loadingSpinner.isDisplayed()).toBe(true);
    });
  });

  describe('Password Reset', () => {
    it('should reset password using security question', async () => {
      // Open auth modal
      await element(by.css('[data-testid="header-login-button"]')).click();

      // Click forgot password link
      const forgotPasswordLink = element(by.css('[data-testid="forgot-password-link"]'));
      await forgotPasswordLink.click();

      // Enter email
      await element(by.css('[data-testid="reset-email"]')).sendKeys(testUser.email);
      await element(by.css('[data-testid="get-security-question"]')).click();

      // Wait for security question to appear
      const securityQuestion = element(by.css('[data-testid="security-question-text"]'));
      await browser.wait(EC.visibilityOf(securityQuestion), 5000);
      expect(await securityQuestion.isDisplayed()).toBe(true);

      // Answer security question
      await element(by.css('[data-testid="security-answer-input"]')).sendKeys(testUser.securityAnswer);

      // Enter new password
      const newPassword = 'NewTestPassword123!';
      await element(by.css('[data-testid="new-password"]')).sendKeys(newPassword);
      await element(by.css('[data-testid="confirm-new-password"]')).sendKeys(newPassword);

      // Submit password reset
      await element(by.css('[data-testid="reset-password-submit"]')).click();

      // Wait for success message
      const successMessage = element(by.css('[data-testid="reset-success-message"]'));
      await browser.wait(EC.visibilityOf(successMessage), 5000);
      expect(await successMessage.isDisplayed()).toBe(true);

      // Verify redirect to login
      const loginForm = element(by.css('[data-testid="login-form"]'));
      await browser.wait(EC.visibilityOf(loginForm), 5000);
      expect(await loginForm.isDisplayed()).toBe(true);
    });

    it('should handle wrong security answer', async () => {
      // Open auth modal and navigate to password reset
      await element(by.css('[data-testid="header-login-button"]')).click();
      await element(by.css('[data-testid="forgot-password-link"]')).click();

      // Enter email and get security question
      await element(by.css('[data-testid="reset-email"]')).sendKeys(testUser.email);
      await element(by.css('[data-testid="get-security-question"]')).click();

      // Enter wrong security answer
      await element(by.css('[data-testid="security-answer-input"]')).sendKeys('Wrong Answer');

      // Try to proceed
      await element(by.css('[data-testid="verify-security-answer"]')).click();

      // Check for error message
      const errorMessage = element(by.css('[data-testid="security-answer-error"]'));
      await browser.wait(EC.visibilityOf(errorMessage), 5000);
      expect(await errorMessage.isDisplayed()).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should maintain session across page refreshes', async () => {
      // Login first
      await element(by.css('[data-testid="header-login-button"]')).click();
      await element(by.css('[data-testid="login-email"]')).sendKeys(testUser.email);
      await element(by.css('[data-testid="login-password"]')).sendKeys(testUser.password);
      await element(by.css('[data-testid="login-submit"]')).click();

      // Wait for login to complete
      await browser.wait(EC.invisibilityOf(element(by.css('[data-testid="auth-modal"]'))), 5000);

      // Refresh page
      await browser.refresh();
      await browser.waitForAngular();

      // Verify user is still logged in
      const userProfile = element(by.css('[data-testid="user-profile-dropdown"]'));
      await browser.wait(EC.visibilityOf(userProfile), 5000);
      expect(await userProfile.isDisplayed()).toBe(true);
    });

    it('should logout successfully', async () => {
      // Ensure user is logged in first
      const userProfile = element(by.css('[data-testid="user-profile-dropdown"]'));
      if (!(await userProfile.isPresent())) {
        // Login if not already logged in
        await element(by.css('[data-testid="header-login-button"]')).click();
        await element(by.css('[data-testid="login-email"]')).sendKeys(testUser.email);
        await element(by.css('[data-testid="login-password"]')).sendKeys(testUser.password);
        await element(by.css('[data-testid="login-submit"]')).click();
        await browser.wait(EC.invisibilityOf(element(by.css('[data-testid="auth-modal"]'))), 5000);
      }

      // Click logout
      await userProfile.click();
      const logoutButton = element(by.css('[data-testid="logout-button"]'));
      await browser.wait(EC.elementToBeClickable(logoutButton), 5000);
      await logoutButton.click();

      // Verify user is logged out
      const loginButton = element(by.css('[data-testid="header-login-button"]'));
      await browser.wait(EC.visibilityOf(loginButton), 5000);
      expect(await loginButton.isDisplayed()).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should be navigable with keyboard only', async () => {
      // Open auth modal
      await element(by.css('[data-testid="header-login-button"]')).click();

      // Navigate through form using Tab key
      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      
      const emailInput = element(by.css('[data-testid="login-email"]:focus'));
      expect(await emailInput.isPresent()).toBe(true);

      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      
      const passwordInput = element(by.css('[data-testid="login-password"]:focus'));
      expect(await passwordInput.isPresent()).toBe(true);
    });

    it('should have proper ARIA labels and roles', async () => {
      await element(by.css('[data-testid="header-login-button"]')).click();

      const modal = element(by.css('[data-testid="auth-modal"]'));
      expect(await modal.getAttribute('role')).toBe('dialog');
      expect(await modal.getAttribute('aria-labelledby')).toBeTruthy();

      const emailInput = element(by.css('[data-testid="login-email"]'));
      expect(await emailInput.getAttribute('aria-label')).toBeTruthy();
    });
  });

  afterEach(async () => {
    // Clean up: logout if logged in
    const userProfile = element(by.css('[data-testid="user-profile-dropdown"]'));
    if (await userProfile.isPresent()) {
      await userProfile.click();
      const logoutButton = element(by.css('[data-testid="logout-button"]'));
      if (await logoutButton.isPresent()) {
        await logoutButton.click();
      }
    }
  });
});
