# Cursor Packages Deployment Guide

**Version**: 1.0.0  
**Date**: August 4, 2026

This guide provides information on deploying the Cursor packages to npm and setting up CI/CD pipelines.

---

## Prerequisites

- Node.js 18+ installed
- npm account with publishing access
- Git repository set up
- CI/CD platform (GitHub Actions, GitLab CI, etc.)

---

## Building Packages

### Build Individual Package

```bash
cd packages/[package-name]
npm run build
```

### Build All Packages

```bash
./build-all-packages.sh
```

### Validate All Packages

```bash
./validate-all-packages.sh
```

---

## Publishing to npm

### Preparation

1. **Update Package Versions**

Update version numbers in each `package.json`:

```bash
cd packages/types
npm version patch  # or minor, major
```

2. **Build Packages**

```bash
./build-all-packages.sh
```

3. **Test Locally**

```bash
cd packages/[package-name]
npm pack
npm install ./[package-name]-x.x.x.tgz
```

### Publishing Process

1. **Login to npm**

```bash
npm login
```

2. **Publish Individual Package**

```bash
cd packages/[package-name]
npm publish
```

3. **Publish All Packages**

```bash
for dir in packages/*/; do
    cd "$dir"
    npm publish
    cd ../..
done
```

### Publishing Scripts

#### Publish All Packages Script

```bash
#!/bin/bash
# publish-all.sh

PACKAGES=(
    "packages/types"
    "packages/utils"
    "packages/file-service"
    "packages/react-codemirror"
    "packages/ai-service"
    "packages/automations"
    "packages/rules-service"
    "packages/composer"
    "packages/agent-exec"
    "packages/semantic-indexer"
)

for package in "${PACKAGES[@]}"; do
    echo "Publishing: $package"
    cd "$package"
    npm publish
    cd ../..
done
```

---

## CI/CD Setup

### GitHub Actions

Create `.github/workflows/publish.yml`:

```yaml
name: Publish Packages

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build packages
        run: ./build-all-packages.sh
      
      - name: Validate packages
        run: ./validate-all-packages.sh
      
      - name: Publish packages
        run: ./publish-all.sh
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
publish:
  stage: deploy
  only:
    - tags
  script:
    - npm ci
    - ./build-all-packages.sh
    - ./validate-all-packages.sh
    - ./publish-all.sh
  variables:
    NPM_TOKEN: $NPM_TOKEN
```

---

## Version Management

### Semantic Versioning

Follow semantic versioning:
- **Major**: Breaking changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, backward compatible

### Version Bumping

```bash
# Bump all packages
for dir in packages/*/; do
    cd "$dir"
    npm version patch
    cd ../..
done
```

### Changelog

Maintain a `CHANGELOG.md` for each package:

```markdown
# Changelog

## [1.0.0] - 2026-08-04

### Added
- Initial release
- Core functionality
```

---

## Quality Gates

### Pre-Publish Checklist

- [ ] All packages build successfully
- [ ] All packages pass validation
- [ ] TypeScript compilation succeeds
- [ ] README documentation is complete
- [ ] API documentation is accurate
- [ ] Version numbers are updated
- [ ] Changelog is updated
- [ ] Tests pass (if available)

### Post-Publish Verification

- [ ] Packages are available on npm
- [ ] Installation works: `npm install @cursor/[package]`
- [ ] Imports work: `import { X } from '@cursor/[package]'`
- [ ] Documentation is accessible
- [ ] No breaking changes introduced

---

## Dependency Management

### Updating Dependencies

```bash
cd packages/[package-name]
npm update
npm audit fix
```

### Auditing Security

```bash
cd packages/[package-name]
npm audit
```

### Lock File Management

Commit `package-lock.json` files for reproducible builds.

---

## Monitoring

### Download Statistics

Monitor package downloads using npm:

```bash
npm view @cursor/[package-name]
```

### Error Tracking

Set up error tracking (Sentry, etc.) for production usage.

---

## Rollback Procedure

If a published package has issues:

1. **Deprecate the version**

```bash
npm deprecate @cursor/[package-name]@x.x.x "Critical bug found"
```

2. **Publish a fix**

```bash
npm version patch
npm publish
```

3. **Update documentation**

Update README and changelog with fix details.

---

## Best Practices

1. **Test before publishing**: Always test locally first
2. **Use semantic versioning**: Follow versioning conventions
3. **Document changes**: Update changelog with every release
4. **Monitor feedback**: Watch for issues and feedback
5. **Security first**: Audit dependencies regularly
6. **Backward compatibility**: Avoid breaking changes when possible

---

## Troubleshooting

### Issue: Publish Fails with 403

**Solution**: Check npm authentication

```bash
npm whoami
npm login
```

### Issue: Build Fails

**Solution**: Check TypeScript configuration

```bash
cd packages/[package-name]
npx tsc --noEmit
```

### Issue: Validation Fails

**Solution**: Check required files

```bash
./validate-all-packages.sh
```

---

## Support

For deployment issues:
- Check npm documentation
- Review CI/CD logs
- Check package.json configuration
- Verify authentication tokens