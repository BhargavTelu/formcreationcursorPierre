export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-16">
      <div className="w-full max-w-lg rounded-lg border border-red-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-red-700">Access Denied</h1>
        <p className="mt-4 text-sm text-gray-600">
          Your account does not have administrator privileges. If you believe this is an error,
          please contact the Finest Africa operations team to request an invite.
        </p>
      </div>
    </div>
  );
}


