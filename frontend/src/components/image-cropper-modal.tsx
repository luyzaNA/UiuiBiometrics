import { useState } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/utils/crop-image.ts";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface ImageCropperModalProps {
    image: string;
    onClose: () => void;
    onConfirm: (base64Result: string) => void;
}

export function ImageCropperModal({ image, onClose, onConfirm }: ImageCropperModalProps) {
    const { t } = useTranslation();
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [processing, setProcessing] = useState(false);

    const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleConfirmCrop = async () => {
        if (!image || !croppedAreaPixels) return;

        try {
            setProcessing(true);
            const base64Result = await getCroppedImg(image, croppedAreaPixels);
            onConfirm(base64Result);
        } catch (error) {
            toast.error(t("Error processing the image. Please try again."));
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-secondary-foreground/80 backdrop-blur-md p-4">
            <div className="relative w-full max-w-md h-[400px] bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-2xl">
                <Cropper
                    image={image}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                />
            </div>

            <div className="w-full max-w-md mt-4 flex items-center gap-4 px-4">
                <span className="text-xs text-secondary/60">{t("Zoom")}:</span>
                <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-1 bg-secondary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
            </div>

            <div className="flex gap-4 mt-6">
                <button
                    type="button"
                    disabled={processing}
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl border border-secondary/20 text-secondary hover:bg-secondary/10 text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors disabled:opacity-50"
                >
                    {t("Cancel")}
                </button>
                <button
                    type="button"
                    disabled={processing}
                    onClick={handleConfirmCrop}
                    className="px-5 py-2.5 rounded-xl bg-primary text-secondary hover:opacity-90 text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors disabled:opacity-50"
                >
                    {processing ? t("Processing...") : t("Save the image")}
                </button>
            </div>
        </div>
    );
}