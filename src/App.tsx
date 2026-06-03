import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { TestLeadPage } from './pages/TestLeadPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route
            index
            element={<DashboardPage title="All Leads" showWebhookUrls />}
          />
          <Route
            path="housing"
            element={
              <DashboardPage
                title="Housing Leads"
                initialFilters={{ source: 'housing' }}
                showSourceFilter={false}
                showHousingPanel
              />
            }
          />
          <Route
            path="magicbricks"
            element={
              <DashboardPage
                title="MagicBricks Leads"
                initialFilters={{ source: 'magicbricks' }}
                showSourceFilter={false}
              />
            }
          />
          <Route
            path="failed"
            element={
              <DashboardPage
                title="Failed Forwards"
                initialFilters={{ status: 'FAILED' }}
                showFailedActions
              />
            }
          />
          <Route path="test" element={<TestLeadPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
