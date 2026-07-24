import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface LogoUploadFieldProps {
  logoUrl: string;
  onLogoChange: (url: string) => void;
}

export function LogoUploadField({ logoUrl, onLogoChange }: LogoUploadFieldProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, SVG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("invoice-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("invoice-logos")
        .getPublicUrl(fileName);

      onLogoChange(publicUrl);
      
      toast({
        title: "Logo uploaded",
        description: "Your logo has been uploaded successfully",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = () => {
    onLogoChange("");
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs text-muted-foreground tracking-wide uppercase">
        LOGO (OPTIONAL)
      </Label>
      
      {logoUrl ? (
        <div className="relative inline-block">
          <div className="p-3 bg-white rounded-sm border border-border">
            <img
              src={logoUrl}
              alt="Invoice logo"
              className="max-w-[200px] max-h-[60px] object-contain"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleRemoveLogo}
            aria-label="Remove logo"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-sm cursor-pointer hover:border-foreground/50 transition-colors"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" />
              <p className="text-xs text-muted-foreground uppercase">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground uppercase">Click to upload logo</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                PNG, JPG, or SVG (max 2MB)
              </p>
            </>
          )}
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <p className="text-[10px] text-muted-foreground">
        Recommended size: 200×60px. Replaces "INVOICE" title on the document.
      </p>
    </div>
  );
}
