// src/pages/UnauthorizedPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-sm text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">
          Unauthorized
        </h1>
        <p className="text-gray-700 mb-6">
          You don’t have permission to view this page.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate('/signin')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
