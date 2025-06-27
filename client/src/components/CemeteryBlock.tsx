import { MapPin, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CemeteryBlockProps {
  cemeteryName: string;
  cemeteryUrl?: string;
  cemeteryAddress: string;
  plotNumber: string;
  style?: React.CSSProperties;
  className?: string;
}

export default function CemeteryBlock({
  cemeteryName,
  cemeteryUrl,
  cemeteryAddress,
  plotNumber,
  style,
  className = ""
}: CemeteryBlockProps) {
  return (
    <Card 
      className={`bg-card border-border ${className}`}
      style={style}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-foreground text-lg">
          <MapPin className="w-5 h-5 mr-2" />
          Come visit me!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h4 className="font-medium text-foreground">{cemeteryName}</h4>
          {cemeteryUrl && (
            <a
              href={cemeteryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mt-1"
            >
              Visit website
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">Address:</p>
          <p className="text-sm text-foreground whitespace-pre-line">{cemeteryAddress}</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">Plot Location:</p>
          <p className="text-sm text-foreground">{plotNumber}</p>
        </div>
      </CardContent>
    </Card>
  );
}