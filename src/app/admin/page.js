export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Admin Portal</h1>
        <p className="text-gray-600">Admin login page is working!</p>
        <div className="mt-4">
          <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            Test Button
          </button>
        </div>
      </div>
    </div>
  );
}
