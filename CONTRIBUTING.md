# Contributing to MSP ERP Lite Frontend

Thank you for your interest in contributing to MSP ERP Lite! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or insulting comments
- Public or private harassment
- Publishing others' private information
- Other conduct that is unprofessional

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js v20.x or higher
- npm v10.x or higher
- Git
- Code editor (VS Code recommended)
- Basic knowledge of React and Next.js

### Setting Up Development Environment

1. **Fork the repository**
   ```bash
   # Fork via GitHub UI, then clone your fork
   git clone https://github.com/YOUR_USERNAME/msp-frontend.git
   cd msp-frontend
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/msp-frontend.git
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

---

## Development Workflow

### 1. Sync with Upstream

Before starting work, sync with the main repository:

```bash
git checkout main
git fetch upstream
git merge upstream/main
git push origin main
```

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
# or
git checkout -b docs/your-documentation-update
```

**Branch Naming Convention**:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or updates
- `chore/` - Maintenance tasks

### 3. Make Your Changes

- Write clean, readable code
- Follow the coding standards (see below)
- Test your changes thoroughly
- Update documentation if needed

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add new dashboard widget"
```

See [Commit Guidelines](#commit-guidelines) for commit message format.

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create a Pull Request

- Go to the original repository on GitHub
- Click "New Pull Request"
- Select your branch
- Fill in the PR template
- Submit for review

---

## Coding Standards

### JavaScript/React Style Guide

#### General Principles

- **ES6+ syntax**: Use modern JavaScript features
- **Functional components**: Prefer function components over class components
- **Hooks**: Use React hooks for state and side effects
- **DRY principle**: Don't Repeat Yourself
- **KISS principle**: Keep It Simple, Stupid

#### Naming Conventions

```javascript
// Components: PascalCase
ManufacturingOrderForm.js
DashboardStats.js

// Functions/Variables: camelCase
const fetchData = () => {};
const userData = {};

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'http://localhost:8000';
const MAX_RETRY_ATTEMPTS = 3;

// Private functions: prefix with underscore
const _helperFunction = () => {};

// Folders: kebab-case
packing-zone/
manufacturing-orders/
```

#### Component Structure

```javascript
// 1. Imports - grouped and ordered
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/components/API_Service/api-utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import './styles.css';

// 2. Constants (if any)
const DEFAULT_PAGE_SIZE = 10;

// 3. Component definition with destructured props
export default function MyComponent({ 
  id, 
  title, 
  onSave,
  className = '' 
}) {
  // 4. Hooks in order
  const router = useRouter();
  
  // 5. State declarations
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 6. Effects
  useEffect(() => {
    fetchData();
  }, [id]);
  
  // 7. Event handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Handler logic
  };
  
  const handleCancel = () => {
    router.back();
  };
  
  // 8. Helper functions
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    const response = await apiGet(`/endpoint/${id}/`);
    
    if (response.success) {
      setData(response.data);
    } else {
      setError(response.error);
    }
    
    setLoading(false);
  };
  
  // 9. Conditional early returns
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data found</div>;
  
  // 10. Main render
  return (
    <Card className={className}>
      <h2>{title}</h2>
      {/* Component JSX */}
    </Card>
  );
}
```

#### JSX Guidelines

```javascript
// Good: Self-closing tags for components without children
<Button />
<Input name="email" />

// Good: Proper indentation and line breaks
<div className="container">
  <Header title="Dashboard" />
  <Main>
    <Content />
  </Main>
</div>

// Good: Conditional rendering
{isLoggedIn && <UserProfile />}
{error ? <ErrorMessage /> : <SuccessMessage />}

// Good: List rendering with keys
{items.map(item => (
  <ListItem key={item.id} data={item} />
))}

// Good: Multiline JSX in parentheses
return (
  <div>
    <Component />
  </div>
);
```

#### API Integration

```javascript
// Good: Proper error handling and loading states
const handleSave = async (formData) => {
  setLoading(true);
  setError(null);
  
  const response = await apiPost('/endpoint/', formData);
  
  if (response.success) {
    toast.success('Saved successfully!');
    onSave(response.data);
  } else {
    toast.error(response.error || 'Failed to save');
    setError(response.error);
  }
  
  setLoading(false);
};
```

#### Comments

```javascript
// Good: Explain WHY, not WHAT
// Retry with exponential backoff to handle rate limiting
await retryWithBackoff(fetchData);

// Good: Document complex logic
/**
 * Calculates the optimal batch size based on machine capacity
 * and current workload. Uses a weighted algorithm to balance
 * throughput and quality.
 * 
 * @param {number} machineCapacity - Maximum units per hour
 * @param {number} currentWorkload - Current pending units
 * @returns {number} Optimal batch size
 */
function calculateBatchSize(machineCapacity, currentWorkload) {
  // Implementation
}
```

### File Organization

```
ComponentName/
├── ComponentName.js       # Main component
├── ComponentName.test.js  # Tests (if applicable)
├── styles.module.css      # Component styles (if using CSS modules)
└── index.js              # Barrel export (if needed)
```

### Import Order

```javascript
// 1. React and Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. External packages
import toast from 'react-hot-toast';
import clsx from 'clsx';

// 3. Internal API and utilities
import { apiGet, apiPost } from '@/components/API_Service/api-utils';
import { formatDate, calculateTotal } from '@/utils';

// 4. Components
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

// 5. Styles
import styles from './styles.module.css';
```

---

## Commit Guidelines

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring (no functional changes)
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Maintenance tasks
- `revert`: Revert a previous commit

#### Examples

```bash
# Feature
git commit -m "feat(manufacturing): add batch splitting functionality"

# Bug fix
git commit -m "fix(auth): resolve token refresh infinite loop"

# Documentation
git commit -m "docs(api): update authentication flow documentation"

# Refactoring
git commit -m "refactor(components): extract common form logic into hook"

# With body
git commit -m "feat(inventory): add low stock alerts

Implemented automatic alerts when stock falls below threshold.
- Added threshold configuration in settings
- Email notifications to store managers
- Dashboard widget showing critical items"

# Breaking change
git commit -m "feat(api)!: update authentication endpoint structure

BREAKING CHANGE: Authentication endpoints now use /auth/v2/
Previous /auth/login/ is now /auth/v2/login/"
```

### Commit Best Practices

1. **Atomic commits**: Each commit should represent one logical change
2. **Present tense**: Use "add feature" not "added feature"
3. **Imperative mood**: Use "fix bug" not "fixes bug"
4. **Be descriptive**: Explain what and why, not how
5. **Reference issues**: Include issue numbers when applicable

```bash
# Good
git commit -m "fix(auth): prevent duplicate login requests (#123)"

# Bad
git commit -m "fixed stuff"
git commit -m "WIP"
git commit -m "Update file.js"
```

---

## Pull Request Process

### PR Checklist

Before submitting a PR, ensure:

- [ ] Code follows the style guidelines
- [ ] Self-review of code completed
- [ ] Comments added for complex logic
- [ ] Documentation updated (if applicable)
- [ ] No console errors or warnings
- [ ] Tested on multiple screen sizes (responsive)
- [ ] API integration handles errors gracefully
- [ ] Loading states implemented
- [ ] Toast notifications for user feedback
- [ ] No linting errors (`npm run lint`)

### PR Template

When creating a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issue
Closes #(issue number)

## Changes Made
- Change 1
- Change 2
- Change 3

## Screenshots (if applicable)
[Add screenshots here]

## Testing
Describe how to test the changes

## Additional Notes
Any additional information
```

### Review Process

1. **Automated checks**: CI/CD pipeline must pass
2. **Code review**: At least one approval required
3. **Testing**: Reviewer tests functionality
4. **Feedback**: Address all review comments
5. **Merge**: Maintainer merges after approval

---

## Testing Guidelines

### Manual Testing

Test the following before submitting:

1. **Functionality**: Feature works as expected
2. **Edge cases**: Handle invalid inputs
3. **Responsive design**: Works on mobile/tablet/desktop
4. **Browser compatibility**: Test on Chrome, Firefox, Safari
5. **Loading states**: Show appropriate loading indicators
6. **Error handling**: Display user-friendly error messages
7. **Navigation**: All links and buttons work correctly

### Test Cases Example

```javascript
// Feature: Manufacturing Order Creation

// Test Case 1: Valid form submission
// Given: User fills all required fields
// When: User clicks submit
// Then: Order is created and success message shown

// Test Case 2: Invalid form submission
// Given: User leaves required fields empty
// When: User clicks submit
// Then: Validation errors are displayed

// Test Case 3: API error
// Given: Backend server is down
// When: User submits form
// Then: User-friendly error message is shown
```

---

## Documentation

### Code Documentation

```javascript
/**
 * Component description
 * 
 * @param {Object} props - Component props
 * @param {string} props.id - Unique identifier
 * @param {Function} props.onSave - Callback when saved
 * @returns {JSX.Element}
 */
export default function Component({ id, onSave }) {
  // Implementation
}
```

### README Updates

When adding new features:

1. Update main README.md with feature description
2. Add setup instructions if configuration needed
3. Update environment variables section if new vars added
4. Add to roadmap or changelog as appropriate

### API Documentation

When creating new API integrations:

```javascript
/**
 * Fetches manufacturing orders with optional filters
 * 
 * @async
 * @param {Object} filters - Filter parameters
 * @param {string} filters.status - Order status
 * @param {number} filters.page - Page number
 * @returns {Promise<ApiResponse>} List of orders
 * 
 * @example
 * const response = await fetchManufacturingOrders({ 
 *   status: 'pending', 
 *   page: 1 
 * });
 */
```

---

## Questions?

If you have questions or need help:

1. Check existing documentation
2. Search closed issues
3. Ask in discussion forum
4. Contact maintainers

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to MSP ERP Lite! 🎉

