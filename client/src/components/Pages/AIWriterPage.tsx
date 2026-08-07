import { useNavigate } from 'react-router-dom';
import PageLayout from '~/components/PageLayout';
import { PenTool, FileText, BookOpen } from 'lucide-react';

export default function AIWriterPage() {
  const navigate = useNavigate();

  const templates = [
    { title: 'Blog Post', desc: 'Write a structured blog article', icon: BookOpen },
    { title: 'Story', desc: 'Create a creative narrative', icon: PenTool },
    { title: 'Documentation', desc: 'Write technical documentation', icon: FileText },
  ];

  return (
    <PageLayout title="AI Writer" description="Write articles, stories, and more with AI assistance.">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-text-secondary">Choose a template or start from scratch.</p>
          <button
            onClick={() => navigate('/c/new')}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
          >
            New Writing Session
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <button
              key={tpl.title}
              onClick={() => navigate('/c/new')}
              className="flex flex-col items-start gap-2 rounded-lg border border-border-light p-4 text-left transition-colors hover:bg-surface-hover"
            >
              <tpl.icon className="h-5 w-5 text-text-secondary" aria-hidden="true" />
              <span className="text-sm font-medium text-text-primary">{tpl.title}</span>
              <span className="text-xs text-text-secondary">{tpl.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
