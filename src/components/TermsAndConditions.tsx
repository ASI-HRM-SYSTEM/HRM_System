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
          {/* Legal Ownership */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Legal Ownership & Commercial Rights</h3>
            <p className="text-gray-700 leading-relaxed">
              This software ("{APP_CONFIG.name}" v{APP_CONFIG.version}) is developed and maintained by{" "}
              <strong>ASI Solution</strong>. The owner of ASI Solution, <strong>{APP_CONFIG.developerName}</strong>,
              retains full rights to develop, distribute, license, sell, and commercially support this software.
            </p>
          </section>

          {/* Copyright */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Copyright & Intellectual Property</h3>
            <p className="text-gray-700 leading-relaxed mb-2">
              © {new Date().getFullYear()} ASI Solution. All rights reserved.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The software architecture, codebase, deployment model, update model, and related service design are owned by ASI Solution unless explicitly transferred by a separate written agreement signed by both parties.
            </p>
          </section>

          {/* Contract Context */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Current Contract Context</h3>
            <p className="text-gray-700 leading-relaxed mt-2">
              The current implementation is being delivered for <strong>New Lanka Clothing</strong> under a contract engagement.
              This contract engagement does not reduce ASI Solution's independent rights to operate as a software vendor and service provider unless a separate exclusive agreement is signed.
            </p>
            <p className="text-gray-700 leading-relaxed mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <strong>Important:</strong> Any future feature requests, maintenance, upgrades, integrations,
              bug fixes, infrastructure work, or support requests after resignation/exit of the developer from company employment must be handled as paid professional services under ASI Solution.
            </p>
          </section>

          {/* Distribution Data Policy */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Distribution & Client Data Separation</h3>
            <p className="text-gray-700 leading-relaxed">
              ASI Solution may distribute and sell software releases built from this platform. Such distributions are not intended to include private company datasets. Client personal/company operational data remains separate from distribution artifacts.
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Client-specific data is not to be bundled in public/commercial distributions.</li>
              <li>Each client deployment should use its own controlled environment and data boundaries.</li>
              <li>Unauthorized extraction or misuse of private employee data is prohibited.</li>
            </ul>
          </section>

          {/* Support & Maintenance Charges */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Hosting, Backend, Updates & Maintenance Fees</h3>
            <div className="p-4 rounded-lg border border-red-300 bg-red-50">
              <p className="text-red-700 font-semibold">
                IMPORTANT PAYMENT NOTICE: Hosting, backend infrastructure, security operations, software updates,
                support, and maintenance are chargeable services and require ongoing payments to ASI Solution.
              </p>
              <p className="text-red-700 mt-2">
                Service rates are market-dependent and variable (including inflation, exchange rates, infra/provider costs, and scope changes).
                Rates are not fixed for lifetime unless explicitly agreed in a separate written contract.
              </p>
            </div>
          </section>

          {/* Warranty Disclaimer */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Warranty Disclaimer</h3>
            <p className="text-gray-700 leading-relaxed">
              This software is provided "AS IS" without warranty of any kind, either express or implied, 
              including but not limited to warranties of merchantability, fitness for a particular purpose, 
              or non-infringement. ASI Solution and the developer shall not be liable for any 
              damages arising from the use or inability to use this software.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Limitation of Liability</h3>
            <p className="text-gray-700 leading-relaxed">
              In no event shall ASI Solution or the developer be liable for any indirect, 
              incidental, special, consequential, or punitive damages, including without limitation loss 
              of profits, data, or use, arising out of or in connection with the use of this software.
            </p>
          </section>

          {/* Modifications & Updates */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">8. Modifications & Updates</h3>
            <p className="text-gray-700 leading-relaxed">
              ASI Solution reserves the right to modify, update, or discontinue any feature 
              of this software at any time without prior notice. Users will be notified of major updates 
              through the in-app update checker.
            </p>
          </section>

          {/* Service Continuity */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">9. Service Continuity, Exit & Future Requests</h3>
            <p className="text-gray-700 leading-relaxed">
              If the developer resigns/leaves company employment, future enhancements, maintenance, updates,
              or other requests are to be handled as paid service engagements through ASI Solution.
              Service timelines, SLAs, and costs will be defined based on requested scope and active market conditions.
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
              For licensing, commercial deployment, maintenance contracts, hosting/backend plans, and support inquiries,
              contact <strong>ASI Solution</strong> or the developer through official business channels.
            </p>
          </section>

          {/* Acceptance */}
          <section className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-gray-800 font-medium">
              By using this software, you acknowledge that you have read, understood, and agree to be
              bound by these terms and conditions, including commercial service/payment provisions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default TermsAndConditions;
