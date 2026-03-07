import { APP_CONFIG, LEGAL_CONFIG } from "../config/appConfig";

interface AboutProps {
  onOpenTerms: () => void;
}

function About({ onOpenTerms }: AboutProps) {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">About</h2>
        <p className="text-gray-600 mb-6">
          {APP_CONFIG.name} is developed for {APP_CONFIG.companyName} to manage employee records, reports, audits, and HR operations.
        </p>

        <div className="space-y-4 text-sm md:text-base">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 py-3 border-b border-gray-100">
            <span className="text-gray-500">Application</span>
            <span className="md:col-span-2 font-medium text-gray-900">{APP_CONFIG.name}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 py-3 border-b border-gray-100">
            <span className="text-gray-500">Version</span>
            <span className="md:col-span-2 font-medium text-gray-900">{APP_CONFIG.version}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 py-3 border-b border-gray-100">
            <span className="text-gray-500">Copyright</span>
            <span className="md:col-span-2 font-medium text-gray-900">© {new Date().getFullYear()} {APP_CONFIG.companyName}. All rights reserved.</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 py-3 border-b border-gray-100">
            <span className="text-gray-500">Developer</span>
            <span className="md:col-span-2 font-medium text-gray-900">{APP_CONFIG.developerName}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 py-3">
            <span className="text-gray-500">Usage Notice</span>
            <span className="md:col-span-2 text-gray-800">{LEGAL_CONFIG.licenseSummary}</span>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700 mb-3">
            Please review the Terms & Conditions before distributing or reusing this software.
          </p>
          <button
            onClick={onOpenTerms}
            className="btn-primary"
          >
            Open Terms & Conditions
          </button>
        </div>
      </div>
    </div>
  );
}

export default About;
