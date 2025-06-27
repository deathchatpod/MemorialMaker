import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaPinterest, FaInstagram, FaFacebook, FaTiktok } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Share2 } from "lucide-react";

interface SocialMediaLinks {
  pinterest?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
}

interface SocialMediaFormProps {
  socialMediaLinks: SocialMediaLinks;
  onChange: (links: SocialMediaLinks) => void;
  className?: string;
}

const socialPlatforms = [
  {
    key: 'pinterest' as keyof SocialMediaLinks,
    label: 'Pinterest',
    icon: FaPinterest,
    placeholder: 'https://pinterest.com/your-profile',
    color: 'text-red-600'
  },
  {
    key: 'twitter' as keyof SocialMediaLinks,
    label: 'X (Twitter)',
    icon: FaXTwitter,
    placeholder: 'https://x.com/your-handle',
    color: 'text-gray-900 dark:text-white'
  },
  {
    key: 'instagram' as keyof SocialMediaLinks,
    label: 'Instagram',
    icon: FaInstagram,
    placeholder: 'https://instagram.com/your-profile',
    color: 'text-pink-600'
  },
  {
    key: 'facebook' as keyof SocialMediaLinks,
    label: 'Facebook',
    icon: FaFacebook,
    placeholder: 'https://facebook.com/your-profile',
    color: 'text-blue-600'
  },
  {
    key: 'tiktok' as keyof SocialMediaLinks,
    label: 'TikTok',
    icon: FaTiktok,
    placeholder: 'https://tiktok.com/@your-handle',
    color: 'text-gray-900 dark:text-white'
  }
];

export default function SocialMediaForm({
  socialMediaLinks,
  onChange,
  className = ""
}: SocialMediaFormProps) {
  const handleLinkChange = (platform: keyof SocialMediaLinks, value: string) => {
    onChange({
      ...socialMediaLinks,
      [platform]: value.trim() || undefined
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Share2 className="h-5 w-5 text-blue-500" />
          Social Media Links
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Add personal social media accounts to be displayed on the memorial page
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {socialPlatforms.map((platform) => {
          const IconComponent = platform.icon;
          return (
            <div key={platform.key} className="space-y-2">
              <Label 
                htmlFor={`social-${platform.key}`}
                className="flex items-center gap-2 text-sm font-medium"
              >
                <IconComponent className={`h-4 w-4 ${platform.color}`} />
                {platform.label}
              </Label>
              <Input
                id={`social-${platform.key}`}
                type="url"
                placeholder={platform.placeholder}
                value={socialMediaLinks[platform.key] || ""}
                onChange={(e) => handleLinkChange(platform.key, e.target.value)}
                className="bg-background border-border"
              />
            </div>
          );
        })}
        
        <div className="pt-2 text-xs text-muted-foreground">
          <p>• Only enter full URLs starting with https://</p>
          <p>• Leave fields empty to hide from memorial page</p>
          <p>• These links will be shown publicly on the memorial</p>
        </div>
      </CardContent>
    </Card>
  );
}