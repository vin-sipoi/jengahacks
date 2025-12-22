import { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { DEFAULT_QR_CODE_SIZE } from "@/lib/constants";

interface RegistrationQRCodeProps {
  registrationId: string;
  email: string;
  fullName: string;
  token?: string | null;
  className?: string;
  size?: number;
}

const RegistrationQRCode = ({
  registrationId,
  email,
  fullName,
  token,
  className,
  size = DEFAULT_QR_CODE_SIZE,
}: RegistrationQRCodeProps) => {
  const { t } = useTranslation();

  // Generate QR code data as JSON for easy scanning
  const qrData = useMemo(() => {
    const data: {
      id: string;
      email: string;
      name: string;
      event: string;
      managementUrl?: string;
    } = {
      id: registrationId,
      email: email,
      name: fullName,
      event: "JengaHacks 2026",
    };

    // Include management URL if token is available
    if (token) {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://jengahacks.com";
      data.managementUrl = `${baseUrl}/manage-registration?token=${encodeURIComponent(token)}`;
    }

    return JSON.stringify(data);
  }, [registrationId, email, fullName, token]);

  const handleDownload = () => {
    // Find the SVG element containing the QR code
    const qrElement = document.querySelector(`[data-qr-id="${registrationId}"]`);
    if (!qrElement) return;

    const svgElement = qrElement.querySelector("svg");
    if (!svgElement) return;

    // Serialize SVG to string
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    // Create download link
    const link = document.createElement("a");
    link.href = url;
    link.download = `jengahacks-registration-${registrationId}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-xl">{t("qrCode.title")}</CardTitle>
        <CardDescription>{t("qrCode.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div
          data-qr-id={registrationId}
          className="p-4 bg-white rounded-lg border-2 border-border"
          style={{ display: "inline-block" }}
        >
          <QRCodeSVG
            value={qrData}
            size={size}
            level="M"
            includeMargin={true}
            fgColor="#000000"
            bgColor="#ffffff"
          />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold">{fullName}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          {t("qrCode.download")}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          {t("qrCode.instructions")}
        </p>
      </CardContent>
    </Card>
  );
};

export default RegistrationQRCode;

