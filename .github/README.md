# WebChess CI/CD Documentation

This directory contains GitHub Actions workflows for automated testing, building, and deployment of the WebChess application.

## Workflows

### 1. CI/CD Pipeline (`ci.yml`)
**Triggers:** Push to `main`/`develop`, Pull Requests to `main`

**Jobs:**
- **Test Suite**: Runs on Node.js 18.x and 20.x
  - Comprehensive unit tests
  - Jest tests with coverage
  - Coverage reporting to Codecov
- **Code Quality**: ESLint linting and security audit
- **Build**: Creates production build and artifacts
- **Deploy Staging**: Auto-deploys `develop` branch to staging
- **Deploy Production**: Auto-deploys `main` branch to production
- **Browser Tests**: Integration tests with server startup
- **Security Scan**: Trivy vulnerability scanning

### 2. Pull Request Validation (`pr-validation.yml`)
**Triggers:** Pull Requests to `main`/`develop`

**Validations:**
- Code linting with ESLint
- Test coverage requirements (70% minimum)
- Security vulnerability checks
- Commit message validation
- Large file detection
- Build verification
- Automated PR comments with results

### 3. Release Automation (`release.yml`)
**Triggers:** Git tags matching `v*`

**Features:**
- Automated changelog generation
- GitHub release creation
- Build artifacts (tar.gz and zip)
- Docker image building and publishing
- Production deployment for stable releases
- Support for pre-release tags (beta, alpha, rc)

### 4. Health Check & Performance (`health-check.yml`)
**Triggers:** Scheduled (every 6 hours), Manual, Deployment status

**Monitoring:**
- Application health checks
- Lighthouse performance audits
- Security headers validation
- Automated issue creation on failures

### 5. Dependabot Automation (`dependabot-auto.yml`)
**Triggers:** Dependabot Pull Requests

**Features:**
- Auto-merge patch and minor updates
- Test validation before merge
- Manual review flag for major updates

## Configuration Files

### ESLint (`.eslintrc.js`)
- Code quality and style enforcement
- Separate rules for browser/node environments
- Jest test file support
- Global variables for WebChess components

### Dependabot (`.github/dependabot.yml`)
- Weekly npm dependency updates
- GitHub Actions updates
- Automated labeling and assignment

### Lighthouse (`lighthouse.config.js`)
- Performance benchmarking
- Accessibility standards
- Best practices validation
- SEO optimization checks

## Docker Support

### Dockerfile
- Multi-stage build (development/production)
- Node.js 20 Alpine base
- Non-root user for security
- Health check integration
- Optimized layer caching

### Docker Compose (`docker-compose.yml`)
- Development environment setup
- Production deployment option
- Health check configuration
- Volume mounting for development

## Environment Setup

### Required Secrets
Add these to your GitHub repository secrets:

```bash
CODECOV_TOKEN=<your-codecov-token>
```

### Optional Secrets (for deployment)
```bash
DEPLOY_SSH_KEY=<ssh-private-key>
DEPLOY_HOST=<production-server>
DOCKER_REGISTRY_TOKEN=<docker-registry-token>
```

## Local Development

### Run with Docker
```bash
# Development mode
docker-compose up

# Production mode
docker-compose --profile production up webchess-production
```

### Manual Setup
```bash
# Install dependencies
npm ci

# Run tests
npm run test:comprehensive
npm run test:jest

# Lint code
npx eslint src/ public/ --ext .js

# Start development server
npm run dev
```

## Deployment

### Automatic Deployment
- **Staging**: Automatically deploys when pushing to `develop` branch
- **Production**: Automatically deploys when pushing to `main` branch
- **Releases**: Creates GitHub releases for version tags

### Manual Deployment
```bash
# Build production image
docker build -t webchess:latest .

# Run production container
docker run -p 3000:3000 webchess:latest

# Or use the deployment scripts
cd deployment/
chmod +x install.sh
sudo ./install.sh
```

## Monitoring

### Health Endpoints
- `/health` - Application health status
- `/ready` - Readiness check for load balancers

### Performance Monitoring
- Lighthouse CI runs on every deployment
- Performance budgets enforced
- Accessibility standards validated

### Security
- Dependabot updates
- npm audit on every build
- Trivy security scanning
- Security headers validation

## Troubleshooting

### Common Issues

1. **Test Failures**
   - Check test coverage requirements (70% minimum)
   - Ensure all tests pass in both Node.js 18.x and 20.x
   - Verify no security vulnerabilities

2. **Build Failures**
   - Check ESLint errors
   - Verify all dependencies are properly declared
   - Ensure no large files are committed

3. **Deployment Issues**
   - Verify health endpoints are responding
   - Check environment variables
   - Review server logs through GitHub Actions

### Getting Help
- Check the Actions tab for detailed logs
- Review the specific workflow file for configuration
- Ensure all required secrets are configured
- Verify branch protection rules are set up correctly

## Best Practices

1. **Commits**: Use clear, descriptive commit messages
2. **PRs**: Keep pull requests focused and small
3. **Testing**: Maintain high test coverage (70%+)
4. **Security**: Regularly update dependencies
5. **Performance**: Monitor Lighthouse scores
6. **Documentation**: Update this README when adding new workflows