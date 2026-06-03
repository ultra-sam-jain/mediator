import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { TestLeadPage } from './pages/TestLeadPage'

export default function App() {
  return (
    <Routes>
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
