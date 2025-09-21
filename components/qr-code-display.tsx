"use client";

import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QRCodeDisplayProps {
  url: string;
  size?: number;
}

export function QRCodeDisplay({ url, size = 128 }: QRCodeDisplayProps) {
  return (
    <Card className="flex flex-col items-center justify-center p-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Scan QR Code</CardTitle>
      </CardHeader>
      <CardContent>
        {url ? (
          <QRCodeSVG value={url} size={size} level="H" includeMargin={true} />
        ) : (
          <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded-md">
            <p className="text-sm text-gray-500">No URL</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}