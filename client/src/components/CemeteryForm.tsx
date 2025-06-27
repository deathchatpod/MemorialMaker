import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapPin } from "lucide-react";

interface CemeteryData {
  hasGravePlot: boolean;
  cemeteryName: string;
  cemeteryUrl: string;
  cemeteryAddress: string;
  plotNumber: string;
}

interface CemeteryFormProps {
  data: CemeteryData;
  onChange: (data: CemeteryData) => void;
}

export default function CemeteryForm({ data, onChange }: CemeteryFormProps) {
  const handleHasGravePlotChange = (value: string) => {
    const hasGravePlot = value === "yes";
    onChange({
      ...data,
      hasGravePlot,
      // Clear cemetery fields if user selects "no"
      ...(hasGravePlot ? {} : {
        cemeteryName: "",
        cemeteryUrl: "",
        cemeteryAddress: "",
        plotNumber: ""
      })
    });
  };

  const handleFieldChange = (field: keyof CemeteryData, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <MapPin className="w-5 h-5 mr-2" />
          Cemetery & Grave Plot Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-base font-medium">Do you have a grave plot?</Label>
          <RadioGroup
            value={data.hasGravePlot ? "yes" : "no"}
            onValueChange={handleHasGravePlotChange}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="has-plot-yes" />
              <Label htmlFor="has-plot-yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="has-plot-no" />
              <Label htmlFor="has-plot-no">No</Label>
            </div>
          </RadioGroup>
        </div>

        {data.hasGravePlot ? (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="space-y-2">
              <Label htmlFor="cemetery-name">Cemetery Name</Label>
              <Input
                id="cemetery-name"
                value={data.cemeteryName}
                onChange={(e) => handleFieldChange("cemeteryName", e.target.value)}
                placeholder="Enter cemetery name"
                className="bg-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cemetery-url">Cemetery Website (Optional)</Label>
              <Input
                id="cemetery-url"
                type="url"
                value={data.cemeteryUrl}
                onChange={(e) => handleFieldChange("cemeteryUrl", e.target.value)}
                placeholder="https://cemetery-website.com"
                className="bg-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cemetery-address">Cemetery Address</Label>
              <Textarea
                id="cemetery-address"
                value={data.cemeteryAddress}
                onChange={(e) => handleFieldChange("cemeteryAddress", e.target.value)}
                placeholder="Enter full cemetery address"
                className="bg-input min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plot-number">Plot Number/Location</Label>
              <Input
                id="plot-number"
                value={data.plotNumber}
                onChange={(e) => handleFieldChange("plotNumber", e.target.value)}
                placeholder="e.g., Section A, Plot 123"
                className="bg-input"
              />
            </div>
          </div>
        ) : (
          <div className="pt-4 border-t border-border">
            <p className="text-muted-foreground">
              We really recommend you get one if you plan to be buried!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}