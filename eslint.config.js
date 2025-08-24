import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import perfectionist from 'eslint-plugin-perfectionist';
import vitest from '@vitest/eslint-plugin';

export default tseslint.config(
  {
    ignores: ['**/*.js'],
  },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // Keep perfectionist but override sorting behavior
  {
    plugins: {
      perfectionist,
    },
    rules: {
      // Disable alphabetical sorting for imports, objects, and types
      'perfectionist/sort-imports': 'off',
      'perfectionist/sort-objects': 'off',
      'perfectionist/sort-named-exports': 'off',
      'perfectionist/sort-named-imports': 'off',
      'perfectionist/sort-enums': 'off',
      'perfectionist/sort-intersection-types': 'off',
      'perfectionist/sort-union-types': 'off',
      'perfectionist/sort-modules': 'off',
    },
  },
  {
    // Global rules
    rules: {
      // Disable base rule and configure TS rule
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_', // Ignore unused function parameters starting with "_"
          varsIgnorePattern: '^_', // Ignore unused variables starting with "_"
          caughtErrorsIgnorePattern: '^_', // Ignore unused caught errors like `catch (_err)`
        },
      ],
    },
  },
  {
    // Vitest overrides for test files only
    files: ['**/*.test.ts', '**/*.spec.ts'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      '@typescript-eslint/unbound-method': 'off',
    },
  }
);
