export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 sm:bg-gray-50">
      <div className="w-full h-screen sm:h-auto sm:w-auto flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

