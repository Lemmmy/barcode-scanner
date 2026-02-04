import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/Button";

interface ScriptDocumentationProps {
  onClose: () => void;
  isSidebar?: boolean;
}

export function ScriptDocumentation({ onClose, isSidebar = false }: ScriptDocumentationProps) {
  return (
    <div className={isSidebar ? "h-full bg-white" : "min-h-screen bg-gray-50 p-6"}>
      <div className={isSidebar ? "" : "mx-auto max-w-4xl"}>
        {!isSidebar && (
          <div className="mb-6 flex items-center gap-4">
            <Button variant="secondary" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Post-Scan Script Documentation</h1>
          </div>
        )}

        <div
          className={isSidebar ? "space-y-6 p-6" : "space-y-8 rounded-lg bg-white p-8 shadow-sm"}
        >
          {/* Overview */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">Overview</h2>
            <p className="text-gray-700">
              Post-scan scripts allow you to programmatically process barcode data before the data
              entry form appears. You can pre-populate fields, modify the scanned code, fetch data
              from external APIs, or implement custom validation logic.
            </p>
          </section>

          {/* API Reference */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">API Reference</h2>
            <p className="mb-4 text-gray-700">Your script receives three parameters:</p>

            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-2 font-mono text-lg font-semibold text-blue-600">code</h3>
                <p className="text-gray-700">
                  <strong>Type:</strong> <code className="rounded bg-gray-200 px-1">string</code>
                </p>
                <p className="text-gray-700">
                  The scanned barcode value (after tilde prefix removal if enabled).
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-2 font-mono text-lg font-semibold text-blue-600">info</h3>
                <p className="text-gray-700">
                  <strong>Type:</strong>{" "}
                  <code className="rounded bg-gray-200 px-1">
                    {"{ code: string, timestamp: number, format?: string }"}
                  </code>
                </p>
                <p className="text-gray-700">
                  Metadata about the scanned code including the original code, scan timestamp, and
                  optionally the barcode format.
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-2 font-mono text-lg font-semibold text-blue-600">formData</h3>
                <p className="text-gray-700">
                  <strong>Type:</strong>{" "}
                  <code className="rounded bg-gray-200 px-1">{"Record<string, unknown>"}</code>
                </p>
                <p className="text-gray-700">
                  An object containing all template fields with their default values. Modify this
                  object to pre-populate the form. <strong>Field names</strong> are the keys (e.g.,{" "}
                  <code className="rounded bg-gray-200 px-1">"Product ID"</code>), and values are
                  initialized based on field type (empty strings for text, false for checkboxes,
                  current date for date fields).
                </p>
              </div>
            </div>
          </section>

          {/* Examples */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">Examples</h2>

            <div className="space-y-6">
              {/* Example 1 */}
              <div>
                <h3 className="mb-2 text-lg font-semibold text-gray-800">
                  1. Parse Barcode and Pre-populate Fields
                </h3>
                <p className="mb-2 text-gray-700">
                  Extract information from a structured barcode (e.g., "PROD-12345-QTY-100"):
                </p>
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
                  {`// Split barcode by delimiter
const parts = code.split('-');

// Assuming template has fields: "Product ID", "Quantity"
if (parts.length >= 4) {
  formData["Product ID"] = parts[1];  // "12345"
  formData["Quantity"] = parseInt(parts[3]);  // 100
}`}
                </pre>
              </div>

              {/* Example 2 */}
              <div>
                <h3 className="mb-2 text-lg font-semibold text-gray-800">
                  2. Fetch Data from External API
                </h3>
                <p className="mb-2 text-gray-700">
                  Look up product information from an API using the scanned code:
                </p>
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
                  {`// Fetch product details
const response = await fetch(\`https://api.example.com/products/\${code}\`);
const product = await response.json();

// Pre-populate form fields
formData["Product Name"] = product.name;
formData["Price"] = product.price;
formData["Category"] = product.category;`}
                </pre>
              </div>

              {/* Example 3 */}
              <div>
                <h3 className="mb-2 text-lg font-semibold text-gray-800">
                  3. GS1 Digital Link Parsing
                </h3>
                <p className="mb-2 text-gray-700">
                  Parse GS1 Digital Link URLs and extract GTIN, batch, expiry:
                </p>
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
                  {`// Example: https://id.gs1.org/01/09506000134352/10/ABC123/17/250630
const url = new URL(code);
const pathParts = url.pathname.split('/');

// Extract GS1 Application Identifiers
const gtin = pathParts[2];  // GTIN (01)
const batch = pathParts[4];  // Batch/Lot (10)
const expiry = pathParts[6];  // Expiry date (17)

formData["GTIN"] = gtin;
formData["Batch Number"] = batch;
formData["Expiry Date"] = \`20\${expiry.slice(0,2)}-\${expiry.slice(2,4)}-\${expiry.slice(4,6)}\`;`}
                </pre>
              </div>

              {/* Example 4 */}
              <div>
                <h3 className="mb-2 text-lg font-semibold text-gray-800">
                  4. Set Current Date with Custom Format
                </h3>
                <p className="mb-2 text-gray-700">
                  Automatically set a date field to today's date:
                </p>
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
                  {`// Date fields are already initialized with current date
// But you can override with custom logic
const today = new Date();
formData["Scan Date"] = today.toISOString().split('T')[0];  // YYYY-MM-DD`}
                </pre>
              </div>

              {/* Example 5 */}
              <div>
                <h3 className="mb-2 text-lg font-semibold text-gray-800">
                  5. Conditional Logic Based on Barcode
                </h3>
                <p className="mb-2 text-gray-700">Apply different logic based on barcode prefix:</p>
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
                  {`if (code.startsWith('SHIP-')) {
  formData["Type"] = 'Shipment';
  formData["Tracking Number"] = code.substring(5);
} else if (code.startsWith('RET-')) {
  formData["Type"] = 'Return';
  formData["Return ID"] = code.substring(4);
} else {
  formData["Type"] = 'Standard';
  formData["Item Code"] = code;
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* Best Practices */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">Best Practices</h2>
            <ul className="list-disc space-y-2 pl-6 text-gray-700">
              <li>
                <strong>Use async/await:</strong> Your script is wrapped in an async function, so
                you can use await for API calls.
              </li>
              <li>
                <strong>Error handling:</strong> Wrap risky operations in try/catch blocks. If your
                script throws an error, the form will still appear with default values.
              </li>
              <li>
                <strong>Field names:</strong> Use the exact field names from your template (e.g.,{" "}
                <code className="rounded bg-gray-200 px-1">formData["Product ID"]</code>). Field
                names are case-sensitive and must match exactly.
              </li>
              <li>
                <strong>Type conversion:</strong> Convert values to the appropriate type (e.g.,
                parseInt for numbers, proper date formatting for date fields).
              </li>
              <li>
                <strong>Security:</strong> Be cautious when fetching data from external sources.
                Validate and sanitize data before using it.
              </li>
              <li>
                <strong>Performance:</strong> Keep scripts fast. Slow API calls will delay the form
                appearance.
              </li>
            </ul>
          </section>

          {/* Security Note */}
          <section className="rounded-lg border-2 border-yellow-400 bg-yellow-50 p-4">
            <h2 className="mb-2 text-xl font-semibold text-yellow-900">⚠️ Security Note</h2>
            <p className="text-yellow-800">
              Scripts execute in your browser with access to the same permissions as the
              application. Only use scripts from trusted sources. You can disable all JavaScript
              execution in Settings if needed.
            </p>
          </section>

          {/* Debugging */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">Debugging</h2>
            <p className="mb-2 text-gray-700">
              Use <code className="rounded bg-gray-200 px-1">console.log()</code> to debug your
              scripts:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              {`console.log('Scanned code:', code);
console.log('Form data before:', formData);

// Your logic here

console.log('Form data after:', formData);`}
            </pre>
            <p className="mt-2 text-gray-700">
              Open your browser's developer console (F12) to see the output.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
