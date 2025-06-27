import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaPinterest, FaInstagram, FaFacebook, FaTiktok } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Share2, ExternalLink } from "lucide-react";

interface SocialMediaLinks {
  pinterest?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
}

interface SocialMediaDisplayProps {
  socialMediaLinks: SocialMediaLinks;
  memorialTitle: string;
  memorialUrl: string;
  className?: string;
}

const socialPlatforms = [
  {
    key: 'pinterest' as keyof SocialMediaLinks,
    label: 'Pinterest',
    icon: FaPinterest,
    color: 'text-red-600 hover:text-red-700',
    bgColor: 'hover:bg-red-50 dark:hover:bg-red-900/20'
  },
  {
    key: 'twitter' as keyof SocialMediaLinks,
    label: 'X',
    icon: FaXTwitter,
    color: 'text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300',
    bgColor: 'hover:bg-gray-100 dark:hover:bg-gray-800'
  },
  {
    key: 'instagram' as keyof SocialMediaLinks,
    label: 'Instagram',
    icon: FaInstagram,
    color: 'text-pink-600 hover:text-pink-700',
    bgColor: 'hover:bg-pink-50 dark:hover:bg-pink-900/20'
  },
  {
    key: 'facebook' as keyof SocialMediaLinks,
    label: 'Facebook',
    icon: FaFacebook,
    color: 'text-blue-600 hover:text-blue-700',
    bgColor: 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
  },
  {
    key: 'tiktok' as keyof SocialMediaLinks,
    label: 'TikTok',
    icon: FaTiktok,
    color: 'text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300',
    bgColor: 'hover:bg-gray-100 dark:hover:bg-gray-800'
  }
];

export default function SocialMediaDisplay({
  socialMediaLinks,
  memorialTitle,
  memorialUrl,
  className = ""
}: SocialMediaDisplayProps) {
  // Filter out empty links
  const activeLinks = socialPlatforms.filter(platform => 
    socialMediaLinks[platform.key]?.trim()
  );

  const shareMemorial = (platform: string) => {
    const encodedUrl = encodeURIComponent(memorialUrl);
    const encodedTitle = encodeURIComponent(`Memorial for ${memorialTitle}`);
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'pinterest':
        shareUrl = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  if (activeLinks.length === 0) {
    return null;
  }

  return (
    <Card className={`bg-card border-border ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-foreground text-lg">
          <Share2 className="h-5 w-5 text-blue-500" />
          Connect & Share
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Personal Social Media Links */}
        {activeLinks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Personal Social Media
            </h4>
            <div className="flex flex-wrap gap-2">
              {activeLinks.map((platform) => {
                const IconComponent = platform.icon;
                const url = socialMediaLinks[platform.key];
                
                return (
                  <Button
                    key={platform.key}
                    variant="outline"
                    size="sm"
                    className={`${platform.bgColor} border-border transition-colors`}
                    onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                  >
                    <IconComponent className={`h-4 w-4 mr-2 ${platform.color}`} />
                    <span className="text-foreground">{platform.label}</span>
                    <ExternalLink className="h-3 w-3 ml-1 text-muted-foreground" />
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Memorial Sharing */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Share This Memorial
          </h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-blue-50 dark:hover:bg-blue-900/20 border-border transition-colors"
              onClick={() => shareMemorial('facebook')}
            >
              <FaFacebook className="h-4 w-4 mr-2 text-blue-600" />
              <span className="text-foreground">Share</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-gray-100 dark:hover:bg-gray-800 border-border transition-colors"
              onClick={() => shareMemorial('twitter')}
            >
              <FaXTwitter className="h-4 w-4 mr-2 text-gray-900 dark:text-white" />
              <span className="text-foreground">Tweet</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-red-50 dark:hover:bg-red-900/20 border-border transition-colors"
              onClick={() => shareMemorial('pinterest')}
            >
              <FaPinterest className="h-4 w-4 mr-2 text-red-600" />
              <span className="text-foreground">Pin</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="border-border transition-colors"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `Memorial for ${memorialTitle}`,
                    url: memorialUrl
                  });
                } else {
                  navigator.clipboard.writeText(memorialUrl);
                  // Toast notification would be added here
                }
              }}
            >
              <Share2 className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-foreground">Copy Link</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}