import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/shell/AppShell';
import { StubPage } from '@/components/shell/StubPage';
import { LandingPage } from '@/components/landing/LandingPage';
import { ExecutionsListPage } from '@/components/executions-list/ExecutionsListPage';
import { ExecutionDetailRoute } from '@/components/execution/ExecutionDetailRoute';
import { WorkflowsListPage } from '@/components/workflows/WorkflowsListPage';
import { EditorPage } from '@/components/editor/EditorPage';
import { WorkflowDetailRoute } from '@/components/workflows/WorkflowDetailRoute';
import { NamespacesListPage } from '@/components/namespaces/NamespacesListPage';
import { PluginsListPage } from '@/components/plugins/PluginsListPage';
import { PluginDetailRoute } from '@/components/plugins/PluginDetailRoute';
import { SecretsListPage } from '@/components/secrets/SecretsListPage';
export default function App() {
  return <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<AppShell />}>
          <Route path="/executions" element={<ExecutionsListPage />} />
          <Route path="/executions/:id" element={<ExecutionDetailRoute />} />

          <Route path="/workflows" element={<WorkflowsListPage />} />
          <Route path="/workflows/new" element={<EditorPage />} />
          <Route path="/workflows/:id" element={<WorkflowDetailRoute />} />
          <Route path="/workflows/:id/edit" element={<StubPage title="Editor" description="Visual workflow editor - palette, editable canvas, schema-driven config, YAML round-trip. Lands in roadmap phases 1.1-1.6; the read-only detail view ships first." />} />

          <Route path="/namespaces" element={<NamespacesListPage />} />

          <Route path="/plugins" element={<PluginsListPage />} />
          <Route path="/plugins/:id" element={<PluginDetailRoute />} />

          <Route path="/triggers" element={<StubPage title="Triggers" description="Per-workflow triggers: cron schedules and webhook endpoints with HMAC verification." />} />
          <Route path="/secrets" element={<SecretsListPage />} />
          <Route path="/secrets/:namespace" element={<SecretsListPage />} />

          <Route path="*" element={<Navigate to="/executions" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>;
}
