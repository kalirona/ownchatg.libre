import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import {
  Login,
  VerifyEmail,
  Registration,
  ResetPassword,
  ApiErrorWatcher,
  TwoFactorScreen,
  RequestPasswordReset,
} from '~/components/Auth';
import { MarketplaceProvider } from '~/components/Agents/MarketplaceContext';
import AgentMarketplace from '~/components/Agents/Marketplace';
import { OAuthSuccess, OAuthError } from '~/components/OAuth';
import { AuthContextProvider } from '~/hooks/AuthContext';
import WithRum from '~/lib/rum/WithRum';
import RouteErrorBoundary from './RouteErrorBoundary';
import StartupLayout from './Layouts/Startup';
import LoginLayout from './Layouts/Login';
import dashboardRoutes from './Dashboard';
import ShareRoute from './ShareRoute';
import ChatRoute from './ChatRoute';
import Search from './Search';
import DashboardRoute from './DashboardRoute';
import BillingPage from '~/components/Billing/BillingPage';
import ProfilePage from '~/components/Profile/ProfilePage';
import ImageWorkspace from '~/components/ImageGen/ImageWorkspace';
import VideoWorkspace from '~/components/VideoGen/VideoWorkspace';
import KnowledgeWorkspace from '~/components/Knowledge/KnowledgeWorkspace';
import MarketplacePage from '~/components/Marketplace/MarketplacePage';
import AssistantBuilder from '~/components/AssistantBuilder/AssistantBuilder';
import AdminDashboard from '~/components/Admin/AdminDashboard';
import ProviderManagement from '~/components/Admin/ProviderManagement/ProviderManagement';
import IntegrationSettings from '~/components/Integrations/IntegrationSettings';
import NotificationPreferencePanel from '~/components/Notifications/NotificationPreferencePanel';
import OrganizationList from '~/components/Organizations/OrganizationList';
import OrganizationDetail from '~/components/Organizations/OrganizationDetail';
import WhiteLabelSettings from '~/components/Admin/branding/WhiteLabelSettings';
import WorkflowList from '~/components/Workflows/WorkflowList';
import WorkflowBuilder from '~/components/Workflows/WorkflowBuilder';
import WorkflowExecutionView from '~/components/Workflows/WorkflowExecutionView';
import WorkflowRunDetail from '~/components/Workflows/WorkflowRunDetail';
import Root from './Root';
/* Marketing pages */
import MarketingLayout from '~/components/Marketing/MarketingLayout';
import HomePage from '~/components/Marketing/pages/HomePage';
import FeaturesPage from '~/components/Marketing/pages/FeaturesPage';
import PricingPage from '~/components/Marketing/pages/PricingPage';
import EnterprisePage from '~/components/Marketing/pages/EnterprisePage';
import BlogPage from '~/components/Marketing/pages/BlogPage';
import BlogPostPage from '~/components/Marketing/pages/BlogPostPage';
import FAQPage from '~/components/Marketing/pages/FAQPage';
import ContactPage from '~/components/Marketing/pages/ContactPage';
import AboutPage from '~/components/Marketing/pages/AboutPage';
import LegalPage from '~/components/Marketing/pages/LegalPage';
import SitemapPage from '~/components/Marketing/pages/SitemapPage';
import InviteAcceptance from '~/components/Organizations/InviteAcceptance';

const AuthLayout = () => (
  <AuthContextProvider>
    <WithRum>
      <Outlet />
    </WithRum>
    <ApiErrorWatcher />
  </AuthContextProvider>
);

const loadInlinePromptsView = () =>
  import('~/components/Prompts/layouts/InlinePromptsView').then((m) => ({
    Component: m.default,
  }));

const loadSkillsView = () =>
  import('~/components/Skills/layouts/SkillsView').then((m) => ({
    Component: m.default,
  }));

const loadProjectsView = () =>
  import('~/components/Projects').then((m) => ({
    Component: m.ProjectsView,
  }));

const loadProjectWorkspace = () =>
  import('~/components/Projects').then((m) => ({
    Component: m.ProjectWorkspace,
  }));

const baseEl = document.querySelector('base');
const baseHref = baseEl?.getAttribute('href') || '/';

export const router = createBrowserRouter(
  [
    /* --- PUBLIC MARKETING SITE --- */
    {
      element: <MarketingLayout />,
      errorElement: <RouteErrorBoundary />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'features', element: <FeaturesPage /> },
        { path: 'pricing', element: <PricingPage /> },
        { path: 'enterprise', element: <EnterprisePage /> },
        { path: 'blog', element: <BlogPage /> },
        { path: 'blog/:slug', element: <BlogPostPage /> },
        { path: 'faq', element: <FAQPage /> },
        { path: 'contact', element: <ContactPage /> },
        { path: 'about', element: <AboutPage /> },
        { path: 'legal', element: <LegalPage /> },
        { path: 'legal/:section', element: <LegalPage /> },
        { path: 'sitemap', element: <SitemapPage /> },
      ],
    },
    {
      path: 'share/:shareId',
      element: <ShareRoute />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'invite/:token',
      element: <InviteAcceptance />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'oauth',
      errorElement: <RouteErrorBoundary />,
      children: [
        {
          path: 'success',
          element: <OAuthSuccess />,
        },
        {
          path: 'error',
          element: <OAuthError />,
        },
      ],
    },
    {
      path: '/',
      element: <StartupLayout />,
      errorElement: <RouteErrorBoundary />,
      children: [
        {
          path: 'register',
          element: <Registration />,
        },
        {
          path: 'forgot-password',
          element: <RequestPasswordReset />,
        },
        {
          path: 'reset-password',
          element: <ResetPassword />,
        },
      ],
    },
    {
      path: 'verify',
      element: <VerifyEmail />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      element: <AuthLayout />,
      errorElement: <RouteErrorBoundary />,
      children: [
        {
          path: '/',
          element: <LoginLayout />,
          children: [
            {
              path: 'login',
              element: <Login />,
            },
            {
              path: 'login/2fa',
              element: <TwoFactorScreen />,
            },
          ],
        },
        dashboardRoutes,
        {
          path: '/',
          element: <Root />,
          children: [
            {
              index: true,
              element: <Navigate to="/dashboard" replace={true} />,
            },
            {
              path: 'dashboard',
              element: <DashboardRoute />,
            },
            {
              path: 'profile',
              element: <ProfilePage />,
            },
            {
              path: 'billing',
              element: <BillingPage />,
            },
            {
              path: 'c/:conversationId?',
              element: <ChatRoute />,
            },
            {
              path: 'images',
              element: <ImageWorkspace />,
            },
            {
              path: 'video',
              element: <VideoWorkspace />,
            },
            {
              path: 'knowledge',
              element: <KnowledgeWorkspace />,
            },
            {
              path: 'marketplace',
              element: <MarketplacePage />,
            },
            {
              path: 'search',
              element: <Search />,
            },
            {
              path: 'prompts',
              element: <Navigate to="/prompts/new" replace={true} />,
            },
            {
              path: 'prompts/new',
              lazy: loadInlinePromptsView,
            },
            {
              path: 'prompts/:promptId',
              lazy: loadInlinePromptsView,
            },
            {
              path: 'skills',
              lazy: loadSkillsView,
            },
            {
              path: 'skills/new',
              lazy: loadSkillsView,
            },
            {
              path: 'skills/:skillId',
              lazy: loadSkillsView,
            },
            {
              path: 'skills/:skillId/edit',
              lazy: loadSkillsView,
            },
            {
              path: 'projects',
              lazy: loadProjectsView,
            },
            {
              path: 'projects/:projectId',
              lazy: loadProjectWorkspace,
            },
            {
              path: 'agents',
              element: (
                <MarketplaceProvider>
                  <AgentMarketplace />
                </MarketplaceProvider>
              ),
            },
            {
              path: 'admin',
              element: <AdminDashboard />,
            },
            {
              path: 'admin/providers',
              element: <ProviderManagement />,
            },
            {
              path: 'integrations',
              element: <IntegrationSettings />,
            },
            {
              path: 'notifications/preferences',
              element: <NotificationPreferencePanel />,
            },
            {
              path: 'organizations',
              element: <OrganizationList />,
            },
            {
              path: 'organizations/:id',
              element: <OrganizationDetail />,
            },
            {
              path: 'agents/new',
              element: <AssistantBuilder />,
            },
            {
              path: 'agents/:category',
              element: (
                <MarketplaceProvider>
                  <AgentMarketplace />
                </MarketplaceProvider>
              ),
            },
            {
              path: 'agents/:agentId/edit',
              element: <AssistantBuilder />,
            },
            {
              path: 'admin/branding',
              element: <AdminDashboard />,
            },
            {
              path: 'workflows',
              element: <WorkflowList />,
            },
            {
              path: 'workflows/new',
              element: <WorkflowBuilder />,
            },
            {
              path: 'workflows/:id/edit',
              element: <WorkflowBuilder />,
            },
            {
              path: 'workflows/:id/runs',
              element: <WorkflowExecutionView />,
            },
            {
              path: 'workflows/:id/runs/:runId',
              element: <WorkflowRunDetail />,
            },
          ],
        },
      ],
    },
  ],
  { basename: baseHref },
);
