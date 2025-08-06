import CreateProjectForm from '@/components/dashboard/create-project-form';

export default function NewProjectPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold">Create New Project</h1>
        <p className="text-muted-foreground">Fill out the details below to add a new project to the tracker.</p>
      </div>
      <CreateProjectForm />
    </div>
  );
}
