import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, X, Crop, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoverPhotoEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageData: string) => Promise<void>;
  currentImage?: string;
}

export const CoverPhotoEditor: React.FC<CoverPhotoEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  currentImage,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [cropDimensions, setCropDimensions] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleCrop = async () => {
    if (!imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imageRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    canvas.width = cropDimensions.width * scaleX;
    canvas.height = cropDimensions.height * scaleY;

    ctx.drawImage(
      img,
      cropDimensions.x * scaleX,
      cropDimensions.y * scaleY,
      cropDimensions.width * scaleX,
      cropDimensions.height * scaleY,
      0,
      0,
      cropDimensions.width * scaleX,
      cropDimensions.height * scaleY
    );

    const croppedImage = canvas.toDataURL("image/jpeg", 0.95);
    setPreview(croppedImage);
    setIsCropping(false);
  };

  const handleSave = async () => {
    if (!preview) return;

    try {
      setIsSaving(true);
      await onSave(preview);
      setSelectedFile(null);
      setPreview(null);
      onClose();
    } catch (error) {
      console.error("Error saving cover photo:", error);
      alert("Failed to save cover photo. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(currentImage || null);
    setIsCropping(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Cover Photo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!preview ? (
            <div
              className={cn(
                "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                "focus-within:ring-2 focus-within:ring-blue-500",
                isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-gray-400"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
              aria-label="Upload cover photo - drag and drop or click to browse"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
                aria-label="Cover photo file input"
              />
              <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" aria-hidden="true" />
              <h3 className="text-lg font-semibold mb-1">Drop your cover photo here</h3>
              <p className="text-sm text-muted-foreground mb-3">or click to browse your computer</p>
              <p className="text-xs text-muted-foreground">Recommended: 1200x400px • JPG, PNG or GIF</p>
            </div>
          ) : isCropping ? (
            <div className="space-y-4">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <img
                  ref={imageRef}
                  src={preview}
                  alt="Preview"
                  className="w-full h-auto max-h-96 object-contain"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreview(null);
                    setSelectedFile(null);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Choose Different
                </Button>
                <Button onClick={handleCrop} className="flex-1">
                  <Crop className="h-4 w-4 mr-2" />
                  Continue
                </Button>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden max-h-96">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreview(null);
                    setSelectedFile(null);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Choose Different
                </Button>
                <Button onClick={() => setIsCropping(true)} variant="outline">
                  <Crop className="h-4 w-4 mr-2" />
                  Recrop
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!preview || isSaving}>
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Cover Photo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CoverPhotoEditor;
