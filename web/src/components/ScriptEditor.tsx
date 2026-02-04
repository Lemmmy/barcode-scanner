import {
  Upload,
  Download,
  Link as LinkIcon,
  BookOpen,
  Code,
  Maximize2,
  Minimize2,
  PanelRight,
} from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { ScriptDocumentation } from "./ScriptDocumentation";
import type { OnMount } from "@monaco-editor/react";
import { Dialog, DialogContent } from "./ui/Dialog";

// Lazy load Monaco editor to reduce bundle size
const Editor = lazy(() => import("@monaco-editor/react"));

interface ScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  onUrlChange?: (url: string) => void;
  scriptUrl?: string;
}

export function ScriptEditor({ value, onChange, onUrlChange, scriptUrl }: ScriptEditorProps) {
  const [urlInput, setUrlInput] = useState(scriptUrl || "");
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDocsSidebar, setShowDocsSidebar] = useState(false);

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || "");
  };

  const handleEditorMount: OnMount = (_editor, monaco) => {
    // Add TypeScript type definitions for the script context
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      lib: ["es2020", "dom"],
    });

    // Add type definitions for the script parameters
    const typeDefinitions = `
      interface ScannedCodeInfo {
        code: string;
        timestamp: number;
        format?: string;
      }

      declare const code: string;
      declare const info: ScannedCodeInfo;
      declare const formData: Record<string, unknown>;
    `;

    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      typeDefinitions,
      "ts:script-context.d.ts",
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onChange(content);
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    const blob = new Blob([value], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "post-scan-script.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadFromUrl = () => {
    if (!urlInput.trim()) return;

    setIsLoadingUrl(true);
    fetch(urlInput)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        return response.text();
      })
      .then((content) => {
        onChange(content);
        onUrlChange?.(urlInput);
        alert("Script loaded successfully from URL");
      })
      .catch((error) => {
        alert(
          `Failed to load script from URL: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      })
      .finally(() => {
        setIsLoadingUrl(false);
      });
  };

  if (showDocs) {
    return <ScriptDocumentation onClose={() => setShowDocs(false)} />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Post-Scan Script</Label>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="small" onClick={() => setShowDocs(true)}>
            <BookOpen className="h-4 w-4 mr-1" />
            Docs
          </Button>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".js,.mjs,.cjs,.ts"
              onChange={handleFileUpload}
              className="hidden"
            />
            <span className="inline-flex items-center justify-center gap-1.5 h-8 px-3 text-sm font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-colors">
              <Upload className="h-4 w-4" />
              Upload
            </span>
          </label>
          <Button type="button" variant="secondary" size="small" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="url"
            placeholder="https://example.com/script.js"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={handleLoadFromUrl}
          disabled={isLoadingUrl || !urlInput.trim()}
        >
          <LinkIcon className="h-4 w-4 mr-1" />
          {isLoadingUrl ? "Loading..." : "Load from URL"}
        </Button>
      </div>

      {!showEditor ? (
        <div className="space-y-2">
          <Button type="button" variant="secondary" fullWidth onClick={() => setShowEditor(true)}>
            <Code className="h-4 w-4 mr-2" />
            {value ? "Edit Script" : "Add Script"}
          </Button>
          {value && (
            <p className="text-xs text-gray-500">Script configured ({value.length} characters)</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Script Editor</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="small"
                onClick={() => setIsFullscreen(true)}
              >
                <Maximize2 className="h-4 w-4 mr-1" />
                Fullscreen
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="small"
                onClick={() => setShowEditor(false)}
              >
                Close Editor
              </Button>
            </div>
          </div>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-[400px] bg-gray-900 text-white">
                  Loading editor...
                </div>
              }
            >
              <Editor
                height="400px"
                defaultLanguage="javascript"
                value={value}
                onChange={handleEditorChange}
                onMount={handleEditorMount}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: "on",
                }}
              />
            </Suspense>
          </div>
          <p className="text-xs text-gray-500">
            Write a JavaScript function that returns a Promise. The function receives an object with{" "}
            <code className="bg-gray-100 px-1 rounded">code</code>,{" "}
            <code className="bg-gray-100 px-1 rounded">info</code>, and{" "}
            <code className="bg-gray-100 px-1 rounded">formData</code>. Modify{" "}
            <code className="bg-gray-100 px-1 rounded">formData</code> to pre-populate fields.
          </p>
        </div>
      )}

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="!max-w-screen !max-h-screen !w-full !h-full !p-0 !gap-0 !border-0 !rounded-none overflow-hidden">
          <div className="flex w-full h-full bg-gray-900 overflow-hidden">
            {/* Main editor area */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Toolbar */}
              <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
                <span className="text-sm font-medium text-white">Script Editor</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="small"
                    onClick={() => setShowDocsSidebar(!showDocsSidebar)}
                    className="text-white hover:bg-gray-700"
                  >
                    <PanelRight className="h-4 w-4 mr-1" />
                    {showDocsSidebar ? "Hide" : "Show"} Docs
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="small"
                    onClick={() => setIsFullscreen(false)}
                    className="text-white hover:bg-gray-700"
                  >
                    <Minimize2 className="h-4 w-4 mr-1" />
                    Exit Fullscreen
                  </Button>
                </div>
              </div>

              {/* Editor */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full bg-gray-900 text-white">
                      Loading editor...
                    </div>
                  }
                >
                  <div className="w-full h-full [&_.monaco-editor]:!absolute">
                    <Editor
                      height="100%"
                      width="100%"
                      defaultLanguage="javascript"
                      value={value}
                      onChange={handleEditorChange}
                      onMount={handleEditorMount}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: true },
                        fontSize: 14,
                        lineNumbers: "on",
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: "on",
                      }}
                    />
                  </div>
                </Suspense>
              </div>
            </div>

            {/* Docs sidebar */}
            {showDocsSidebar && (
              <div className="flex-shrink-0 w-[40vw] max-w-[960px] bg-white border-l border-gray-700 overflow-y-auto">
                <ScriptDocumentation onClose={() => setShowDocsSidebar(false)} isSidebar={true} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
