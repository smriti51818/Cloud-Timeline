# Contributing to Cloud Timeline

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- Azure account (for testing cloud features)
- Code editor (VS Code recommended)

### Getting Started

1. **Fork and Clone**
   ```bash
   git fork https://github.com/YOUR-USERNAME/Cloud_Timeline
   cd Cloud_Timeline/Cloud-Timeline
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment**
   ```bash
   cp .env.local.example .env.local
   # Fill in your Azure credentials
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

---

## Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/`- Adding tests

Example: `feature/add-calendar-view`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting, missing semi-colons, etc.
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance tasks

**Examples:**
```
feat(timeline): add calendar view component
fix(upload): resolve file size validation issue
docs(readme): update installation instructions
```

---

## Code Standards

### TypeScript

- **Use TypeScript** for all new files
- **Define interfaces** for props and data structures
- **Avoid `any` type** - use proper types
- **Use type inference** where possible

### React

- **Use functional components** with hooks
- **Follow naming conventions:**
  - Components: PascalCase (`TimelineCard.tsx`)
  - Utilities: camelCase (`formatDate.ts`)
  - Constants: UPPER_SNAKE_CASE (`API_ROUTES`)
- **Component structure:**
  ```tsx
  // 1. Imports
  // 2. Types/Interfaces
  // 3. Component
  // 4. Helper functions
  // 5. Exports
  ```

### Styling

- **Use Tailwind CSS** for styling
- **Follow utility-first approach**
- **Use CSS variables** for themes (defined in `globals.css`)
- **Mobile-first** responsive design

### File Organization

```
components/
  ├── ui/           # Reusable UI components
  ├── timeline/     # Timeline-specific components
  └── ...

lib/
  ├── utils.ts      # General utilities
  ├── api-client.ts # API client
  └── ...

app/
  ├── api/          # API routes
  ├── (routes)/     # Page routes
  └── ...
```

---

## Testing

### Before Submitting PR

Run these commands:

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Build
npm run build
```

### Manual Testing Checklist

- [ ] Authentication flow works
- [ ] Can create timeline entries (text, image, audio)
- [ ] Media uploads successfully
- [ ] AI features work (tags, sentiment, transcription)
- [ ] Responsive on mobile, tablet, desktop
- [ ] No console errors

---

## Pull Request Process

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Write clean, documented code
- Follow code standards above
- Add comments for complex logic

### 3. Test Thoroughly

- Run all tests
- Test in browser
- Check responsive design

### 4. Commit Changes

```bash
git add .
git commit -m "feat(timeline): add your feature description"
```

### 5. Push to Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request

- Go to GitHub repository
- Click "New Pull Request"
- Fill in PR template:
  - **Description**: What does this PR do?
  - **Related Issue**: Link to issue if applicable
  - **Screenshots**: For UI changes
  - **Testing**: How you tested
  - **Checklist**: Complete all items

### 7. Code Review

- Address review comments
- Push updates to same branch
- PR will auto-update

### 8. Merge

- Maintainer will merge after approval
- Delete branch after merge

---

## Code Review Guidelines

### As a Reviewer

- **Be respectful** and constructive
- **Ask questions** rather than make demands
- **Suggest improvements** with examples
- **Approve** when ready to merge

### As an Author

- **Respond promptly** to feedback
- **Ask clarifying questions**
- **Don't take feedback personally**
- **Update based on feedback**

---

## Project Structure

```
Cloud-Timeline/
├── .github/
│   └── workflows/          # GitHub Actions
├── app/
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── timeline/          # Timeline page
│   └── ...
├── components/
│   ├── ui/                # Reusable UI components
│   ├── dashboard.tsx      # Feature components
│   └── ...
├── lib/
│   ├── api-client.ts      # API client
│   ├── env.ts             # Environment validation
│   ├── constants.ts       # App constants
│   └── ...
├── docs/                  # Documentation
├── public/                # Static files
├── scripts/               # Build scripts
├── .env.example           # Environment template
├── next.config.js         # Next.js config
├── package.json           # Dependencies
├── tailwind.config.js     # Tailwind config
└── tsconfig.json          # TypeScript config
```

---

## Common Tasks

### Adding a New Component

1. Create file in `components/`
2. Define TypeScript interface for props
3. Implement component
4. Export from component
5. Use in parent component

### Adding a New API Route

1. Create folder in `app/api/`
2. Create `route.ts` file
3. Implement GET/POST/etc handlers
4. Add error handling
5. Update API client in `lib/api-client.ts`

### Adding Environment Variable

1. Add to `.env.example` with comment
2. Add to `.env.d.ts` for TypeScript
3. Add to `lib/env.ts` validation
4. Update `docs/ENVIRONMENT_SETUP.md`
5. Add to GitHub Actions workflow

---

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: File a GitHub Issue
- **Security**: See SECURITY.md

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
