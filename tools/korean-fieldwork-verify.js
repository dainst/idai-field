#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const args = new Set(process.argv.slice(2));
const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';
const npmCliPath = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');

const options = {
  desktopBuild: args.has('--desktop-build'),
  fullMobile: args.has('--full-mobile'),
  listTestPaths: args.has('--list-test-paths'),
  skipParity: args.has('--skip-parity'),
  skipTests: args.has('--skip-tests')
};

main();

function main() {
  if (options.listTestPaths) {
    console.log(JSON.stringify({
      desktop: getDesktopFieldworkTestPaths(),
      mobile: getMobileFieldworkTestPaths()
    }, null, 2));
    return;
  }

  const steps = [];

  if (!options.skipParity) {
    steps.push({
      label: 'Korean fieldwork desktop-tablet parity',
      command: process.execPath,
      args: ['tools/korean-fieldwork-parity-check.js'],
      cwd: rootDir
    });
  }

  if (!options.skipTests) {
    steps.push(makeNpmStep({
      label: 'Desktop Korean fieldwork unit tests',
      args: [
        '--prefix',
        'desktop',
        'test',
        '--',
        '--runTestsByPath',
        ...getDesktopFieldworkTestPaths()
      ]
    }));

    steps.push(getMobileTestStep());
  }

  if (options.desktopBuild) {
    steps.push(makeNpmStep({
      label: 'Desktop copy-core',
      args: ['--prefix', 'desktop', 'run', 'copy-core']
    }));
    steps.push({
      label: 'Desktop Korean Angular build',
      command: process.execPath,
      args: [
        '--max_old_space_size=12000',
        'node_modules/@angular/cli/bin/ng',
        'build',
        '--base-href',
        './',
        '--configuration',
        'ko'
      ],
      cwd: path.join(rootDir, 'desktop')
    });
  }

  steps.forEach(runStep);
  console.log('\nKorean fieldwork verification completed.');
}

function getMobileTestStep() {
  return options.fullMobile
    ? makeNpmStep({
        label: 'Mobile full test suite',
        args: ['--prefix', 'mobile', 'test', '--', '--watchAll=false', '--runInBand'],
      })
    : makeNpmStep({
        label: 'Mobile Korean fieldwork unit tests',
        args: [
          '--prefix',
          'mobile',
          'test',
          '--',
          '--runTestsByPath',
          ...getMobileFieldworkTestPaths(),
          '--watchAll=false',
          '--runInBand'
        ]
      });
}

function makeNpmStep({ label, args }) {
  return fs.existsSync(npmCliPath)
    ? {
        label,
        command: process.execPath,
        args: [npmCliPath, ...args],
        cwd: rootDir
      }
    : {
        label,
        command: npmCommand,
        args,
        cwd: rootDir
      };
}

function getDesktopFieldworkTestPaths() {
  const explicitSpecs = new Set([
    'edit-form.component.spec.ts',
    'create-project-modal.component.spec.ts',
    'project-information-modal.component.spec.ts',
    'settings.component.spec.ts'
  ]);

  return walkFiles(path.join(rootDir, 'desktop', 'test', 'unit'))
    .filter((filePath) => {
      const normalized = normalizePath(filePath);
      const fileName = path.basename(filePath);

      return normalized.includes('korean-fieldwork')
        || explicitSpecs.has(fileName);
    })
    .map((filePath) => normalizePath(path.relative(path.join(rootDir, 'desktop'), filePath)))
    .sort();
}

function getMobileFieldworkTestPaths() {
  const testRoots = [
    'components/Home',
    'components/Project',
    'components/common/forms',
    'constants',
    'hooks',
    'models',
    'test/screens',
    'utils'
  ];
  const patterns = [
    /KoreanFieldwork.*\.spec\.(ts|tsx)$/,
    /korean-fieldwork.*\.spec\.ts$/,
    /soil-color-photo-assist\.spec\.ts$/,
    /SoilProfileCameraButton\.spec\.ts$/,
    /Document(Add|Edit)\.spec\.tsx$/,
    /DocumentForm\.spec\.tsx$/,
    /CreateProjectModal\.spec\.tsx$/,
    /LoadProjectModal\.spec\.tsx$/,
    /project-name-validation\.spec\.ts$/,
    /project-settings\.spec\.ts$/,
    /sample-project\.spec\.ts$/,
    /SettingsScreen\.spec\.tsx$/,
    /sync-url-validation\.spec\.ts$/,
    /use-preferences\.spec\.ts$/,
    /use-korean-fieldwork-project-setup-defaults\.spec\.ts$/
  ];

  return testRoots
    .flatMap((testRoot) => walkFiles(path.join(rootDir, 'mobile', testRoot)))
    .filter((filePath) => {
      const normalized = normalizePath(path.relative(path.join(rootDir, 'mobile'), filePath));

      return patterns.some((pattern) => pattern.test(normalized));
    })
    .map((filePath) => normalizePath(path.relative(path.join(rootDir, 'mobile'), filePath)))
    .sort();
}

function runStep(step) {
  const startTime = Date.now();
  console.log(`\n== ${step.label} ==`);
  console.log([step.command, ...step.args].join(' '));

  const result = spawnSync(step.command, step.args, {
    cwd: step.cwd,
    env: process.env,
    stdio: 'inherit',
    shell: isWindows && step.command === npmCommand
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(result.status || 1);
  }

  if (result.status !== 0) {
    console.error(`${step.label} failed with exit code ${result.status}.`);
    process.exit(result.status);
  }

  console.log(`${step.label} passed in ${formatDuration(Date.now() - startTime)}.`);
}

function walkFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];

  const result = [];
  const stack = [dirPath];

  while (stack.length > 0) {
    const currentPath = stack.pop();
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    entries.forEach((entry) => {
      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) stack.push(entryPath);
      else if (entry.isFile()) result.push(entryPath);
    });
  }

  return result;
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function formatDuration(milliseconds) {
  const seconds = Math.round(milliseconds / 1000);
  if (seconds < 60) return `${seconds}s`;

  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
