import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from '@/app/layout/AppShell';
import { StubPage } from '@/app/layout/StubPage';
import { EditorPage } from '@/features/editor';
import { ExecutionDetailPage, ExecutionsListPage } from '@/features/executions';
import { LandingPage } from '@/features/landing';
import { NamespacesListPage } from '@/features/namespaces';
import { PluginDetailPage, PluginsListPage } from '@/features/plugins';
import { SecretsPage } from '@/features/secrets';
import { WorkflowDetailPage, WorkflowsListPage } from '@/features/workflows';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<AppShell />}>
        <Route path="/executions" element={<ExecutionsListPage />} />
        <Route path="/executions/:id" element={<ExecutionDetailPage />} />

        <Route path="/workflows" element={<WorkflowsListPage />} />
        <Route path="/workflows/new" element={<EditorPage />} />
        <Route path="/workflows/:id" element={<WorkflowDetailPage />} />
        <Route
          path="/workflows/:id/edit"
          element={
            <StubPage
              title="Editor"
              description="Visual workflow editor - palette, editable canvas, schema-driven config, YAML round-trip. Lands in roadmap phases 1.1-1.6; the read-only detail view ships first."
            />
          }
        />

        <Route path="/namespaces" element={<NamespacesListPage />} />

        <Route path="/plugins" element={<PluginsListPage />} />
        <Route path="/plugins/:id" element={<PluginDetailPage />} />

        <Route path="/secrets" element={<SecretsPage />} />
        <Route path="/secrets/:namespace" element={<SecretsPage />} />

        <Route path="*" element={<Navigate to="/executions" replace />} />
      </Route>
    </Routes>
  );
}
