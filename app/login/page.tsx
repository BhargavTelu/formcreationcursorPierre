import AdminAuth from '@/components/AdminAuth';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-16">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in with your Finest Africa administrator credentials.
          </p>
        </div>
        <AdminAuth />
      </div>
    </div>
  );
}


