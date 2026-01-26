import { Facebook, Twitter, Linkedin, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface SocialShareProps {
  url?: string;
  title?: string;
  description?: string;
}

/**
 * Social sharing component for viral growth
 * Allows users to share MatatuConnect on social platforms
 */
export default function SocialShare({ 
  url = 'https://matatuconnect.co.ke',
  title = 'MatatuConnect - Smart Matatu Booking',
  description = "Kenya's #1 matatu booking platform. Check it out!"
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const shareData = {
    url: encodeURIComponent(url),
    title: encodeURIComponent(title),
    text: encodeURIComponent(description),
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: url,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-700 mr-2">Share:</span>
      
      {/* Facebook */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareData.url}`, '_blank')}
        className="gap-2"
        aria-label="Share on Facebook"
      >
        <Facebook className="h-4 w-4" />
        <span className="hidden sm:inline">Facebook</span>
      </Button>

      {/* Twitter/X */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(`https://twitter.com/intent/tweet?url=${shareData.url}&text=${shareData.text}`, '_blank')}
        className="gap-2"
        aria-label="Share on Twitter"
      >
        <Twitter className="h-4 w-4" />
        <span className="hidden sm:inline">Twitter</span>
      </Button>

      {/* LinkedIn */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareData.url}`, '_blank')}
        className="gap-2"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
        <span className="hidden sm:inline">LinkedIn</span>
      </Button>

      {/* Native Share (Mobile) */}
      {navigator.share && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleNativeShare}
          className="gap-2"
          aria-label="Share via system"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">More</span>
        </Button>
      )}

      {/* Copy Link */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="gap-2"
        aria-label={copied ? 'Link copied' : 'Copy link'}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            <span className="hidden sm:inline text-green-600">Copied!</span>
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">Copy</span>
          </>
        )}
      </Button>
    </div>
  );
}
