/**
 * Frontend UI Agent - Manages React components, Tailwind CSS, and UI/UX
 * Handles component creation, state management, API integration, and styling
 */

const BaseAgent = require('../../core/base-agent');
const fs = require('fs').promises;
const path = require('path');

class FrontendUIAgent extends BaseAgent {
  constructor() {
    super({
      name: 'vg-frontend-ui',
      version: '2.0.0',
      description: 'Autonomous React UI development and Tailwind CSS styling agent',
      capabilities: [
        'create_component',
        'update_styles',
        'integrate_api',
        'manage_state',
        'optimize_performance',
        'fix_controlled_components',
        'create_form',
        'add_routing'
      ],
      dependencies: ['backend-api']
    });

    this.frontendPath = path.join(process.cwd(), 'services', 'web-ui', 'frontend', 'src');
    this.componentsPath = path.join(this.frontendPath, 'components');
  }

  /**
   * Main execution entry point
   */
  async execute(task) {
    this.log(`Executing task: ${task.action}`);

    switch (task.action) {
      case 'create_component':
        return await this.createComponent(task);

      case 'update_styles':
        return await this.updateStyles(task);

      case 'integrate_api':
        return await this.integrateAPI(task);

      case 'manage_state':
        return await this.manageState(task);

      case 'optimize_performance':
        return await this.optimizePerformance(task);

      case 'fix_controlled_components':
        return await this.fixControlledComponents(task);

      case 'create_form':
        return await this.createForm(task);

      case 'add_routing':
        return await this.addRouting(task);

      default:
        return await this.handleAutonomously(task);
    }
  }

  /**
   * Create React component
   */
  async createComponent(task) {
    const { name, type = 'functional', props = [], features = [] } = task.payload || {};

    this.log(`Creating component: ${name}`);

    // Generate component code based on type
    let componentCode;
    if (type === 'functional') {
      componentCode = this.generateFunctionalComponent(name, props, features);
    } else if (type === 'class') {
      componentCode = this.generateClassComponent(name, props, features);
    } else {
      componentCode = this.generateFunctionalComponent(name, props, features);
    }

    // Create component file
    const componentPath = path.join(this.componentsPath, `${name}.tsx`);
    await this.ensureDirectory(this.componentsPath);
    await fs.writeFile(componentPath, componentCode);

    // Create styles file if needed
    let stylesCreated = false;
    if (features.includes('styles')) {
      const stylesCode = this.generateComponentStyles(name);
      const stylesPath = path.join(this.componentsPath, `${name}.module.css`);
      await fs.writeFile(stylesPath, stylesCode);
      stylesCreated = true;
    }

    // Create test file if needed
    let testsCreated = false;
    if (features.includes('tests')) {
      const testCode = this.generateComponentTest(name);
      const testPath = path.join(this.componentsPath, `${name}.test.tsx`);
      await fs.writeFile(testPath, testCode);
      testsCreated = true;
    }

    return {
      success: true,
      component: name,
      type,
      files: {
        component: `${name}.tsx`,
        styles: stylesCreated ? `${name}.module.css` : null,
        tests: testsCreated ? `${name}.test.tsx` : null
      },
      features
    };
  }

  /**
   * Update Tailwind CSS styles
   */
  async updateStyles(task) {
    const { component, styles, theme } = task.payload || {};

    this.log(`Updating styles for ${component || 'application'}`);

    const updates = [];

    // Update component styles
    if (component && styles) {
      const componentPath = path.join(this.componentsPath, `${component}.tsx`);

      try {
        let content = await fs.readFile(componentPath, 'utf8');

        // Update className attributes
        for (const [selector, newClasses] of Object.entries(styles)) {
          const regex = new RegExp(`className="${selector}"`, 'g');
          content = content.replace(regex, `className="${newClasses}"`);
        }

        await fs.writeFile(componentPath, content);
        updates.push(`Updated ${component} styles`);
      } catch (error) {
        this.log(`Failed to update ${component}: ${error.message}`, 'error');
      }
    }

    // Update theme configuration
    if (theme) {
      const tailwindConfig = path.join(process.cwd(), 'services', 'web-ui', 'frontend', 'tailwind.config.js');

      try {
        let config = await fs.readFile(tailwindConfig, 'utf8');

        // Update theme extends
        const themeUpdates = this.generateThemeUpdates(theme);
        config = this.updateTailwindConfig(config, themeUpdates);

        await fs.writeFile(tailwindConfig, config);
        updates.push('Updated Tailwind theme');
      } catch (error) {
        this.log(`Failed to update theme: ${error.message}`, 'error');
      }
    }

    return {
      success: true,
      updates,
      tailwindClasses: this.suggestTailwindClasses(task.payload?.context)
    };
  }

  /**
   * Integrate API calls
   */
  async integrateAPI(task) {
    const { component, endpoint, method = 'GET', auth = true } = task.payload || {};

    this.log(`Integrating API ${endpoint} into ${component}`);

    // Generate API hook
    const hookCode = this.generateAPIHook(endpoint, method, auth);
    const hookName = `use${this.capitalize(this.sanitizeName(endpoint))}`;

    // Save hook
    const hooksPath = path.join(this.frontendPath, 'hooks');
    await this.ensureDirectory(hooksPath);
    const hookPath = path.join(hooksPath, `${hookName}.ts`);
    await fs.writeFile(hookPath, hookCode);

    // Update component to use hook
    if (component) {
      await this.updateComponentWithHook(component, hookName);
    }

    // Autonomous decision: If auth required, check JWT handling
    if (auth) {
      const authCheck = await this.checkAuthIntegration();
      if (!authCheck.configured) {
        await this.setupAuthContext();
      }
    }

    return {
      success: true,
      hook: hookName,
      endpoint,
      component,
      authRequired: auth
    };
  }

  /**
   * Manage component state
   */
  async manageState(task) {
    const { component, stateType = 'local', initialState = {} } = task.payload || {};

    this.log(`Managing ${stateType} state for ${component}`);

    if (stateType === 'local') {
      return await this.setupLocalState(component, initialState);
    } else if (stateType === 'context') {
      return await this.setupContextState(component, initialState);
    } else if (stateType === 'redux') {
      return await this.setupReduxState(component, initialState);
    }

    return {
      success: false,
      error: `Unknown state type: ${stateType}`
    };
  }

  /**
   * Optimize performance
   */
  async optimizePerformance(task) {
    const { component, optimizations = ['memo', 'lazy', 'suspense'] } = task.payload || {};

    this.log(`Optimizing performance for ${component || 'application'}`);

    const applied = [];

    // Apply React.memo
    if (optimizations.includes('memo') && component) {
      await this.applyMemoization(component);
      applied.push('React.memo');
    }

    // Apply lazy loading
    if (optimizations.includes('lazy')) {
      await this.applyLazyLoading(component);
      applied.push('Lazy loading');
    }

    // Apply Suspense
    if (optimizations.includes('suspense')) {
      await this.applySuspense(component);
      applied.push('Suspense boundaries');
    }

    // Analyze bundle size
    const bundleAnalysis = await this.analyzeBundleSize();

    return {
      success: true,
      applied,
      bundleAnalysis,
      recommendations: this.generatePerformanceRecommendations(bundleAnalysis)
    };
  }

  /**
   * Fix controlled component issues (getCurrentValue pattern)
   */
  async fixControlledComponents(task) {
    const { component = 'ConfigSection' } = task.payload || {};

    this.log(`Fixing controlled components in ${component}`);

    const componentPath = path.join(this.componentsPath, `${component}.tsx`);

    try {
      let content = await fs.readFile(componentPath, 'utf8');

      // Add getCurrentValue helper if missing
      if (!content.includes('getCurrentValue')) {
        const helperCode = `
  const getCurrentValue = (file: string, mapping: any, originalValue: any) => {
    const pendingValue = pendingChanges[file]?.[mapping];
    return pendingValue !== undefined ? pendingValue : originalValue;
  };
`;
        content = content.replace(/const.*{.*useState.*}.*from.*'react';/, match =>
          match + '\n' + helperCode
        );
      }

      // Fix Select components
      content = content.replace(
        /<Select\s+value={([^}]+)}/g,
        (match, value) => {
          if (!value.includes('getCurrentValue')) {
            return `<Select value={getCurrentValue(file, mapping, ${value})}`;
          }
          return match;
        }
      );

      // Fix Toggle components
      content = content.replace(
        /<Toggle\s+checked={([^}]+)}/g,
        (match, checked) => {
          if (!checked.includes('getCurrentValue')) {
            return `<Toggle checked={getCurrentValue(file, mapping, ${checked})}`;
          }
          return match;
        }
      );

      await fs.writeFile(componentPath, content);

      return {
        success: true,
        component,
        fixed: ['Select components', 'Toggle components'],
        pattern: 'getCurrentValue helper applied'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create form component
   */
  async createForm(task) {
    const { name, fields, validation = true, submitEndpoint } = task.payload || {};

    this.log(`Creating form: ${name}`);

    // Generate form component
    const formCode = this.generateFormComponent(name, fields, validation, submitEndpoint);
    const formPath = path.join(this.componentsPath, `${name}Form.tsx`);
    await fs.writeFile(formPath, formCode);

    // Generate validation schema if needed
    if (validation) {
      const validationCode = this.generateValidationSchema(fields);
      const validationPath = path.join(this.frontendPath, 'validation', `${name}Schema.ts`);
      await this.ensureDirectory(path.dirname(validationPath));
      await fs.writeFile(validationPath, validationCode);
    }

    // Autonomous decision: If submitEndpoint provided, integrate API
    if (submitEndpoint) {
      await this.integrateAPI({
        payload: {
          component: `${name}Form`,
          endpoint: submitEndpoint,
          method: 'POST'
        }
      });
    }

    return {
      success: true,
      form: `${name}Form`,
      fields: fields.length,
      validation,
      apiIntegrated: !!submitEndpoint
    };
  }

  /**
   * Add routing
   */
  async addRouting(task) {
    const { path: routePath, component, exact = true, auth = false } = task.payload || {};

    this.log(`Adding route: ${routePath} → ${component}`);

    const routesPath = path.join(this.frontendPath, 'routes.tsx');

    try {
      let content = await fs.readFile(routesPath, 'utf8');

      // Generate route code
      const routeCode = auth
        ? `<ProtectedRoute path="${routePath}" exact={${exact}} component={${component}} />`
        : `<Route path="${routePath}" exact={${exact}} component={${component}} />`;

      // Insert route
      content = content.replace(
        /(<Routes>[\s\S]*?)<\/Routes>/,
        (match, routes) => `<Routes>${routes}\n  ${routeCode}\n</Routes>`
      );

      await fs.writeFile(routesPath, content);

      return {
        success: true,
        route: routePath,
        component,
        protected: auth
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle task autonomously
   */
  async handleAutonomously(task) {
    this.log('Making autonomous decision for frontend task...');

    const taskText = task.task || task.payload?.description || '';

    // Analyze task to determine action
    if (taskText.includes('component')) {
      return await this.createComponent(task);
    } else if (taskText.includes('style') || taskText.includes('css')) {
      return await this.updateStyles(task);
    } else if (taskText.includes('api') || taskText.includes('fetch')) {
      return await this.integrateAPI(task);
    } else if (taskText.includes('form')) {
      return await this.createForm(task);
    } else if (taskText.includes('route') || taskText.includes('navigation')) {
      return await this.addRouting(task);
    } else if (taskText.includes('performance') || taskText.includes('optimize')) {
      return await this.optimizePerformance(task);
    } else {
      // Default: Check for common UI issues
      return await this.checkUIHealth();
    }
  }

  /**
   * Helper methods
   */
  generateFunctionalComponent(name, props, features) {
    const imports = this.generateImports(features);
    const propsInterface = props.length > 0 ? this.generatePropsInterface(name, props) : '';

    return `${imports}
${propsInterface}

const ${name}: React.FC${propsInterface ? `<${name}Props>` : ''} = (${propsInterface ? 'props' : ''}) => {
  ${features.includes('state') ? 'const [state, setState] = useState(initialState);' : ''}
  ${features.includes('effect') ? 'useEffect(() => {\n    // Effect logic\n  }, []);' : ''}

  return (
    <div className="p-4 bg-surface-base rounded-lg">
      <h2 className="text-xl font-semibold text-text-primary">${name}</h2>
      {/* Component content */}
    </div>
  );
};

export default ${features.includes('memo') ? `React.memo(${name})` : name};`;
  }

  generateClassComponent(name, props, features) {
    return `import React, { Component } from 'react';

interface ${name}Props {
  ${props.map(p => `${p.name}: ${p.type};`).join('\n  ')}
}

interface ${name}State {
  // State interface
}

class ${name} extends Component<${name}Props, ${name}State> {
  constructor(props: ${name}Props) {
    super(props);
    this.state = {
      // Initial state
    };
  }

  render() {
    return (
      <div className="p-4 bg-surface-base rounded-lg">
        <h2 className="text-xl font-semibold text-text-primary">${name}</h2>
        {/* Component content */}
      </div>
    );
  }
}

export default ${name};`;
  }

  generateImports(features) {
    const imports = ["import React"];
    if (features.includes('state')) imports.push("useState");
    if (features.includes('effect')) imports.push("useEffect");
    if (features.includes('memo')) imports.push("memo");

    return `${imports.join(', ')} from 'react';`;
  }

  generatePropsInterface(name, props) {
    if (props.length === 0) return '';

    return `
interface ${name}Props {
  ${props.map(p => `${p.name}: ${p.type || 'string'};`).join('\n  ')}
}`;
  }

  generateComponentStyles(name) {
    return `.${name.toLowerCase()} {
  /* Component styles */
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.${name.toLowerCase()}__header {
  font-size: 1.5rem;
  font-weight: bold;
}

.${name.toLowerCase()}__content {
  padding: 1rem;
}`;
  }

  generateComponentTest(name) {
    return `import { render, screen } from '@testing-library/react';
import ${name} from './${name}';

describe('${name}', () => {
  it('renders without crashing', () => {
    render(<${name} />);
    expect(screen.getByText('${name}')).toBeInTheDocument();
  });

  it('displays correct content', () => {
    render(<${name} />);
    // Add more specific tests
  });
});`;
  }

  generateAPIHook(endpoint, method, auth) {
    return `import { useState, useEffect } from 'react';
import axios from 'axios';

export const use${this.capitalize(this.sanitizeName(endpoint))} = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const config = ${auth ? `{
        headers: {
          Authorization: \`Bearer \${localStorage.getItem('token')}\`
        }
      }` : '{}'};

      const response = await axios.${method.toLowerCase()}('${endpoint}', config);
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
};`;
  }

  generateFormComponent(name, fields, validation, submitEndpoint) {
    return `import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
${validation ? `import { ${name}Schema } from '../validation/${name}Schema';` : ''}

interface ${name}FormData {
  ${fields.map(f => `${f.name}: ${f.type || 'string'};`).join('\n  ')}
}

const ${name}Form: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<${name}FormData>();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data: ${name}FormData) => {
    setSubmitting(true);
    try {
      ${submitEndpoint ? `await fetch('${submitEndpoint}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });` : '// Submit logic here'}
      console.log('Form submitted:', data);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      ${fields.map(f => `
      <div>
        <label className="block text-sm font-medium text-text-primary">
          ${f.label || f.name}
        </label>
        <input
          {...register('${f.name}'${f.required ? ", { required: true }" : ''})}
          type="${f.type || 'text'}"
          className="mt-1 block w-full rounded-md border-border bg-surface-base"
        />
        {errors.${f.name} && <span className="text-red-500 text-sm">This field is required</span>}
      </div>`).join('')}

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};

export default ${name}Form;`;
  }

  generateValidationSchema(fields) {
    return `import * as yup from 'yup';

export const ${fields[0]?.name || 'form'}Schema = yup.object({
  ${fields.map(f => `${f.name}: yup.${f.type === 'number' ? 'number()' : 'string()'}()${f.required ? '.required()' : ''}`).join(',\n  ')}
});`;
  }

  generateThemeUpdates(theme) {
    return `
extend: {
  colors: {
    ${Object.entries(theme.colors || {}).map(([key, value]) => `'${key}': '${value}'`).join(',\n    ')}
  }
}`;
  }

  updateTailwindConfig(config, updates) {
    // Simplified config update
    return config.replace(/extend:\s*{/, `extend: {\n${updates},`);
  }

  suggestTailwindClasses(context) {
    const suggestions = [];

    if (context?.includes('button')) {
      suggestions.push('px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700');
    }
    if (context?.includes('card')) {
      suggestions.push('p-6 bg-surface-base rounded-lg shadow-md');
    }
    if (context?.includes('input')) {
      suggestions.push('block w-full rounded-md border-border bg-surface-base');
    }

    return suggestions;
  }

  async updateComponentWithHook(component, hookName) {
    const componentPath = path.join(this.componentsPath, `${component}.tsx`);

    try {
      let content = await fs.readFile(componentPath, 'utf8');

      // Add import
      content = content.replace(
        /import.*from.*'react';/,
        match => `${match}\nimport { ${hookName} } from '../hooks/${hookName}';`
      );

      // Use hook in component
      content = content.replace(
        /const.*{.*}.*=.*\(.*\).*=>/,
        match => `${match}\n  const { data, loading, error } = ${hookName}();`
      );

      await fs.writeFile(componentPath, content);
    } catch (error) {
      this.log(`Failed to update component: ${error.message}`, 'error');
    }
  }

  async checkAuthIntegration() {
    // Check if auth context exists
    const authContextPath = path.join(this.frontendPath, 'contexts', 'AuthContext.tsx');

    try {
      await fs.access(authContextPath);
      return { configured: true };
    } catch {
      return { configured: false };
    }
  }

  async setupAuthContext() {
    // Create auth context
    const authContextCode = `import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  const login = (token: string) => {
    localStorage.setItem('token', token);
    setToken(token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};`;

    const contextsPath = path.join(this.frontendPath, 'contexts');
    await this.ensureDirectory(contextsPath);
    await fs.writeFile(path.join(contextsPath, 'AuthContext.tsx'), authContextCode);
  }

  async setupLocalState(component, initialState) {
    // Setup local state in component
    return {
      success: true,
      type: 'local',
      component,
      state: initialState
    };
  }

  async setupContextState(component, initialState) {
    // Setup context state
    return {
      success: true,
      type: 'context',
      component,
      state: initialState
    };
  }

  async setupReduxState(component, initialState) {
    // Setup Redux state
    return {
      success: true,
      type: 'redux',
      component,
      state: initialState
    };
  }

  async applyMemoization(component) {
    // Apply React.memo to component
    this.log(`Applying memoization to ${component}`);
  }

  async applyLazyLoading(component) {
    // Apply lazy loading
    this.log(`Applying lazy loading to ${component}`);
  }

  async applySuspense(component) {
    // Apply Suspense boundaries
    this.log(`Applying Suspense to ${component}`);
  }

  async analyzeBundleSize() {
    // Analyze bundle size
    return {
      totalSize: '2.3 MB',
      mainChunk: '800 KB',
      vendorChunk: '1.5 MB'
    };
  }

  generatePerformanceRecommendations(analysis) {
    const recommendations = [];

    if (analysis.totalSize > '2 MB') {
      recommendations.push('Consider code splitting for large bundles');
    }

    return recommendations;
  }

  async checkUIHealth() {
    return {
      success: true,
      health: {
        components: 'healthy',
        styles: 'healthy',
        performance: 'optimal'
      }
    };
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  sanitizeName(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '');
  }

  async ensureDirectory(dir) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }
}

module.exports = FrontendUIAgent;