import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Download,
  Upload,
  List,
  ListOrdered,
  Strikethrough,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditorToolbarProps {
  onFormat: (command: string, value?: string) => void;
  onDownloadPDF: () => void;
  onDownloadHTML: () => void;
  onNewFile: () => void;
  filename: string;
}

export const EditorToolbar = ({
  onFormat,
  onDownloadPDF,
  onDownloadHTML,
  onNewFile,
  filename,
}: EditorToolbarProps) => {
  const fontSizes = ["8", "10", "12", "14", "16", "18", "20", "24", "28", "32"];
  const fonts = [
    "Arial",
    "Arial-Black",
    "Times New Roman",
    "Courier New",
    "Georgia",
    "Verdana",
  ];

  return (
    <div className="bg-card border-b border-border p-3 flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onNewFile}>
          <Upload className="w-4 h-4 mr-2" />
          New File
        </Button>
        <Button variant="default" size="sm" onClick={onDownloadPDF}>
          <FileDown className="w-4 h-4 mr-2" />
          PDF
        </Button>
        {/* <Button variant="outline" size="sm" onClick={onDownloadHTML}>
          <Download className="w-4 h-4 mr-2" />
          HTML
        </Button> */}
      </div>

      <Separator orientation="vertical" className="h-8" />

      <span className="text-sm font-medium text-muted-foreground">
        {filename}
      </span>

      <Separator orientation="vertical" className="h-8" />

      <Select onValueChange={(value) => onFormat("fontName", value)}>
        <SelectTrigger className="w-[140px] h-8">
          <SelectValue placeholder="Font" />
        </SelectTrigger>
        <SelectContent>
          {fonts.map((font) => (
            <SelectItem key={font} value={font}>
              {font}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={(value) => onFormat("fontSize", value)}>
        <SelectTrigger className="w-[80px] h-8">
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent>
          {fontSizes.map((size) => (
            <SelectItem key={size} value={size}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-8" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat("bold")}
        className="px-2"
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat("italic")}
        className="px-2"
      >
        <Italic className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat("underline")}
        className="px-2"
      >
        <Underline className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat("strikeThrough")}
        className="px-2"
      >
        <Strikethrough className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="h-8" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat("insertUnorderedList")}
        className="px-2"
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat("insertOrderedList")}
        className="px-2"
      >
        <ListOrdered className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="h-8" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat("justifyLeft")}
        className="px-2"
      >
        <AlignLeft className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat("justifyCenter")}
        className="px-2"
      >
        <AlignCenter className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat("justifyRight")}
        className="px-2"
      >
        <AlignRight className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat("justifyFull")}
        className="px-2"
      >
        <AlignJustify className="w-4 h-4" />
      </Button>
    </div>
  );
};
