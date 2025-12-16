import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface FileUploadProps {
  onFileLoad: (content: string, filename: string) => void;
}

export const FileUpload = ({ onFileLoad }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);  const [isConverting, setIsConverting] = useState(false);

  // Backend converter URL - configure this based on your environment
  const CONVERTER_API_URL = import.meta.env.VITE_CONVERTER_API_URL || "http://127.0.0.1:8000";

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();

    const allowedExts = [".html", ".htm", ".pdf", ".rtf", ".doc", ".docx", ".txt"];

    if (!allowedExts.includes(ext)) {
      toast.error("Unsupported file type");
      return;
    }

    // For HTML files, read directly as text
    if (ext === ".html" || ext === ".htm") {
      try {
        const text = await file.text();
        onFileLoad(text, file.name);
      } catch (error) {
        toast.error("Failed to read HTML file");
        console.error(error);
      }
      return;
    }

    // For all other supported files (.docx, .doc, .rtf, .pdf, .txt), use the converter backend
    try {
      setIsConverting(true);
      toast.loading("Loading...");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${CONVERTER_API_URL}/convert`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Conversion failed: ${response.statusText}`);
      }

      const htmlContent = await response.text();
      toast.dismiss();
      toast.success("File converted successfully!");
      onFileLoad(htmlContent, file.name);
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to convert file. Make sure the converter service is running.");
      console.error("Conversion error:", error);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="bg-card border-2 border-dashed border-border rounded-lg p-12 text-center">
        <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-semibold mb-2">Upload Your File</h2>
        <p className="text-muted-foreground mb-6">
          Select a file to start editing (HTML, PDF, DOCX, DOC, RTF, TXT)
        </p>
        <Button onClick={() => fileInputRef.current?.click()} disabled={isConverting}>
          {isConverting ? "Converting..." : "Choose File"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".html,.htm,.pdf,.docx,.doc,.rtf,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};
