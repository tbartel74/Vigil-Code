# Frontend UI Agent

## Overview

The Frontend UI Agent manages React-based user interface development for Vigil Guard's configuration panel, including component creation, Tailwind v4 styling, API integration, and form management with proper controlled component patterns.

**Version:** 1.0.0
**Based on:** react-tailwind-vigil-ui
**Status:** Active

## Core Responsibilities

### 1. Component Development
- Create React functional components
- Implement hooks and state management
- Build reusable UI elements
- Manage component lifecycle

### 2. Styling & Design System
- Tailwind CSS v4 implementation
- Semantic design tokens
- Responsive layouts
- Dark mode support

### 3. API Integration
- Fetch data from backend
- Handle JWT authentication
- Manage ETag concurrency
- Error handling and retries

### 4. Form Management
- Controlled component patterns
- Form validation
- File upload handling
- Configuration editing

### 5. Routing & Navigation
- Protected routes with RBAC
- Navigation components
- Breadcrumb management
- Deep linking support

## Tech Stack

- **React:** 18.2.0
- **Vite:** 5.4.11
- **Tailwind CSS:** v4 (alpha)
- **TypeScript:** 5.6.3
- **React Router:** 6.28.0
- **Axios:** for API calls
- **Monaco Editor:** for JSON editing

## Critical Patterns

### ⚠️ getCurrentValue() Pattern (CRITICAL)

**Problem:** Controlled components not updating visually
**Solution:** Merge original + pending changes

```typescript
// ❌ WRONG - Always shows original value
<Select value={resolveOut[i].value} onChange={handleChange} />

// ✅ CORRECT - Shows current state
<Select value={getCurrentValue(file, mapping, resolveOut[i].value)} onChange={handleChange} />

// Helper function
const getCurrentValue = (file, path, originalValue) => {
  const pendingValue = pendingChanges?.[file]?.[path];
  return pendingValue !== undefined ? pendingValue : originalValue;
};
```

## Supported Tasks

### Task Identifiers
- `create_component` - Create new React component
- `add_route` - Add new route
- `integrate_api` - Connect to backend endpoint
- `fix_styling` - Fix CSS/Tailwind issues
- `add_form_validation` - Implement validation
- `implement_auth_flow` - Add authentication
- `add_entity_checkbox` - Add PII entity UI
- `fix_controlled_component` - Fix state management

## Project Structure

```
services/web-ui/frontend/
├── src/
│   ├── components/
│   │   ├── Layout.tsx           # Main layout
│   │   ├── ConfigSection.tsx    # Config editor
│   │   ├── PIISettings.tsx      # PII configuration
│   │   └── common/              # Reusable components
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Configuration.tsx
│   │   └── Login.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useConfig.ts
│   ├── utils/
│   │   ├── api.ts              # API client
│   │   └── auth.ts             # Auth utilities
│   ├── App.tsx
│   └── main.tsx
├── tailwind.config.ts           # Tailwind v4 config
└── vite.config.ts
```

## Component Patterns

### Functional Component Template

```typescript
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ComponentProps {
  title: string;
  onSave?: (data: any) => void;
}

export const MyComponent: React.FC<ComponentProps> = ({ title, onSave }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/endpoint');
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="bg-surface-dark rounded-lg p-6">
      <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
      {/* Component content */}
    </div>
  );
};
```

### Form with Validation

```typescript
export const ConfigForm: React.FC = () => {
  const [formData, setFormData] = useState({
    threshold: '',
    enabled: false
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.threshold) {
      newErrors.threshold = 'Threshold is required';
    }
    if (formData.threshold < 0 || formData.threshold > 100) {
      newErrors.threshold = 'Must be between 0 and 100';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await api.post('/api/config', formData);
      toast.success('Configuration saved');
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        value={formData.threshold}
        onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
        className={`input ${errors.threshold ? 'border-red-500' : ''}`}
      />
      {errors.threshold && (
        <p className="text-red-500 text-sm">{errors.threshold}</p>
      )}
    </form>
  );
};
```

## Tailwind v4 Configuration

### Design System Tokens

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Semantic colors
        'surface-base': '#0F1419',
        'surface-dark': '#0A0E13',
        'surface-darker': '#0C1117',
        'text-primary': '#E1E8ED',
        'text-secondary': '#8899A6',
        'accent-blue': '#3B82F6',
        'success': '#10B981',
        'warning': '#F59E0B',
        'danger': '#EF4444'
      }
    }
  }
}
```

### Common Utility Classes

```css
/* Component styles */
.card {
  @apply bg-surface-dark rounded-lg p-6 border border-gray-800;
}

.btn-primary {
  @apply bg-accent-blue text-white px-4 py-2 rounded hover:bg-blue-600;
}

.input {
  @apply bg-surface-darker border border-gray-700 rounded px-3 py-2 text-text-primary;
}
```

## API Integration

### API Client Setup

```typescript
// utils/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### ETag Concurrency Control

```typescript
const updateConfig = async (file: string, content: any, etag: string) => {
  try {
    const response = await api.put(`/config/${file}`, content, {
      headers: {
        'If-Match': etag
      }
    });

    // Update local ETag
    setCurrentEtag(response.headers.etag);
    return response.data;
  } catch (error) {
    if (error.response?.status === 412) {
      // ETag mismatch - someone else updated
      alert('Configuration was modified by another user. Please refresh.');
    }
    throw error;
  }
};
```

## Routing & Protection

### Protected Route Component

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const ProtectedRoute = ({ children, permission }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  if (permission && !user.permissions.includes(permission)) {
    return <div>Access denied</div>;
  }

  return children;
};

// Usage
<Route path="/admin" element={
  <ProtectedRoute permission="can_manage_users">
    <AdminPanel />
  </ProtectedRoute>
} />
```

## State Management

### Context for Global State

```typescript
// contexts/ConfigContext.tsx
const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});

  const updateConfig = (file, path, value) => {
    setPendingChanges(prev => ({
      ...prev,
      [file]: {
        ...prev[file],
        [path]: value
      }
    }));
  };

  return (
    <ConfigContext.Provider value={{ config, pendingChanges, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};
```

## Performance Optimization

### Code Splitting

```typescript
// Lazy load heavy components
const MonacoEditor = lazy(() => import('@/components/MonacoEditor'));

// Use with Suspense
<Suspense fallback={<div>Loading editor...</div>}>
  <MonacoEditor />
</Suspense>
```

### Memoization

```typescript
// Memoize expensive computations
const processedData = useMemo(() => {
  return heavyProcessing(rawData);
}, [rawData]);

// Memoize components
const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* Complex rendering */}</div>;
});
```

## Testing

### Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('ConfigForm', () => {
  test('validates threshold input', () => {
    render(<ConfigForm />);

    const input = screen.getByLabelText('Threshold');
    const submit = screen.getByText('Save');

    // Test empty validation
    fireEvent.click(submit);
    expect(screen.getByText('Threshold is required')).toBeInTheDocument();

    // Test range validation
    fireEvent.change(input, { target: { value: '150' } });
    fireEvent.click(submit);
    expect(screen.getByText('Must be between 0 and 100')).toBeInTheDocument();
  });
});
```

## Common Issues & Solutions

### Issue: Controlled Component Not Updating
**Solution:** Use getCurrentValue() helper

### Issue: CORS Errors
**Solution:** Configure Vite proxy
```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:8787',
    changeOrigin: true
  }
}
```

### Issue: Build Path Issues
**Solution:** Set base in vite.config.ts
```typescript
base: '/ui/'  // For deployment under /ui path
```

## Best Practices

1. **Use TypeScript strictly** - Enable strict mode
2. **Implement error boundaries** - Graceful error handling
3. **Optimize bundle size** - Code splitting, tree shaking
4. **Follow React patterns** - Hooks, functional components
5. **Maintain design system** - Consistent styling
6. **Test user interactions** - Unit and integration tests
7. **Handle loading states** - Skeleton screens, spinners

## File Locations

```
services/web-ui/frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── utils/
├── public/
│   └── docs/          # Static documentation
└── dist/              # Build output
```

---

**Note:** This agent ensures high-quality, performant React applications with proper state management, styling, and user experience patterns.