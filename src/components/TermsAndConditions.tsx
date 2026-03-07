import { APP_CONFIG, LEGAL_CONFIG } from "../config/appConfig";

function TermsAndConditions() {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Terms & Conditions</h2>
        <p className="text-sm text-gray-500 mb-6">
          Version {LEGAL_CONFIG.termsVersion} • Last Updated: March 7, 2026
        </p>

        <div className="prose prose-gray max-w-none space-y-6 text-sm md:text-base">
          {/* Software Usage Agreement */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Software Usage Agreement</h3>
            <p className="text-gray-700 leading-relaxed">
              This software ("{APP_CONFIG.name}" v{APP_CONFIG.version}) is developed specifically for{" "}
              <strong>{APP_CONFIG.companyName}</strong> to manage employee records, HR operations, and related administrative tasks.
            </p>
          </section>

          {/* Ownership & Copyright */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Ownership & Copyright</h3>
            <p className="text-gray-700 leading-relaxed mb-2">
              © {new Date().getFullYear()} {APP_CONFIG.companyName}. All rights reserved.
            </p>
            <p className="text-gray-700 leading-relaxed">
              This software and its source code are the property of {APP_CONFIG.companyName}. 
              The company retains all intellectual property rights to the application, its design, 
              features, and functionality.
            </p>
          </section>

          {/* Developer Rights */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Developer Rights</h3>
            <p className="text-gray-700 leading-relaxed">
              Developed by: <strong>{APP_CONFIG.developerName}</strong>
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              Unless a stricter written agreement is introduced, the developer ({APP_CONFIG.developerName}) 
              is permitted to use the source code for personal, educational, or portfolio purposes. 
              This includes the right to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Showcase the project as part of a professional portfolio</li>
              <li>Reference the codebase for learning and personal development</li>
              <li>Reuse architectural patterns and code snippets in other personal projects</li>
              <li>Modify and adapt the code for non-commercial personal use</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <strong>Important:</strong> The developer may NOT distribute, sell, or deploy this exact 
              application or its derivatives for commercial purposes without explicit written permission 
              from {APP_CONFIG.companyName}.
            </p>
          </section>

          {/* Permitted Use */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Permitted Use</h3>
            <p className="text-gray-700 leading-relaxed">
              This software is licensed for use exclusively by authorized personnel of{" "}
              {APP_CONFIG.companyName}. Users must:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Have proper authorization and valid credentials to access the system</li>
              <li>Use the software solely for legitimate business purposes</li>
              <li>Maintain the confidentiality of employee data and company information</li>
              <li>Not attempt to reverse engineer, decompile, or extract the source code</li>
              <li>Not redistribute, sublicense, or share the application without authorization</li>
            </ul>
          </section>

          {/* Data Privacy & Security */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Data Privacy & Security</h3>
            <p className="text-gray-700 leading-relaxed">
              All employee data processed by this system is confidential and must be handled in accordance 
              with applicable data protection laws and company policies. Users are responsible for:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Protecting login credentials and not sharing them with unauthorized individuals</li>
              <li>Logging out when leaving the workstation unattended</li>
              <li>Reporting any security incidents or data breaches immediately</li>
              <li>Using strong passwords and changing them periodically</li>
            </ul>
          </section>

          {/* Warranty Disclaimer */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Warranty Disclaimer</h3>
            <p className="text-gray-700 leading-relaxed">
              This software is provided "AS IS" without warranty of any kind, either express or implied, 
              including but not limited to warranties of merchantability, fitness for a particular purpose, 
              or non-infringement. The developer and {APP_CONFIG.companyName} shall not be liable for any 
              damages arising from the use or inability to use this software.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Limitation of Liability</h3>
            <p className="text-gray-700 leading-relaxed">
              In no event shall {APP_CONFIG.companyName} or the developer be liable for any indirect, 
              incidental, special, consequential, or punitive damages, including without limitation loss 
              of profits, data, or use, arising out of or in connection with the use of this software.
            </p>
          </section>

          {/* Modifications & Updates */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">8. Modifications & Updates</h3>
            <p className="text-gray-700 leading-relaxed">
              {APP_CONFIG.companyName} reserves the right to modify, update, or discontinue any feature 
              of this software at any time without prior notice. Users will be notified of major updates 
              through the in-app update checker.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">9. Termination</h3>
            <p className="text-gray-700 leading-relaxed">
              Access to this software may be terminated or suspended at any time by {APP_CONFIG.companyName} 
              for any reason, including but not limited to violations of these terms, termination of employment, 
              or security concerns.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">10. Governing Law</h3>
            <p className="text-gray-700 leading-relaxed">
              These terms and conditions shall be governed by and construed in accordance with the laws 
              of Sri Lanka. Any disputes arising from these terms shall be subject to the exclusive 
              jurisdiction of the courts of Sri Lanka.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">11. Contact Information</h3>
            <p className="text-gray-700 leading-relaxed">
              For questions regarding these terms or to request modifications to the usage agreement, 
              please contact {APP_CONFIG.companyName} management or the developer through official 
              company channels.
            </p>
          </section>

          {/* Acceptance */}
          <section className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-gray-800 font-medium">
              By using this software, you acknowledge that you have read, understood, and agree to be 
              bound by these terms and conditions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default TermsAndConditions;
