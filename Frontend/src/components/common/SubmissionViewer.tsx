import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Video,
  Github,
  Globe,
  Image,
  File,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Submission, Link as SubmissionLink } from '@/types';
import { cn } from '@/lib/utils';

interface SubmissionViewerProps {
  submission: Submission;
  className?: string;
}

const SubmissionViewer = ({ submission, className }: SubmissionViewerProps) => {
  const [currentScreenshotIndex, setCurrentScreenshotIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const renderContent = () => {
    switch (submission.submissionType) {
      case 'video':
        return renderVideo();
      case 'github':
        return renderGithub();
      case 'ppt':
      case 'document':
        return renderDocument();
      case 'screenshot':
        return renderScreenshots();
      case 'live_demo':
        return renderLiveDemo();
      case 'multiple':
        return renderMultiple();
      default:
        return renderGeneric();
    }
  };

  const renderVideo = () => {
    if (!submission.videoUrl) return renderEmpty('No video submitted');

    // Extract YouTube/Vimeo embed URL
    const getEmbedUrl = (url: string) => {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/)?.[1];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
      }
      if (url.includes('vimeo.com')) {
        const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
        return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
      }
      return url;
    };

    return (
      <div className="aspect-video rounded-xl overflow-hidden bg-card border border-border">
        <iframe
          src={getEmbedUrl(submission.videoUrl)}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  };

  const renderGithub = () => {
    if (!submission.githubUrl) return renderEmpty('No GitHub repository submitted');

    return (
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
            <Github className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-heading font-semibold">GitHub Repository</h4>
            <p className="text-sm text-muted-foreground truncate max-w-md">
              {submission.githubUrl}
            </p>
          </div>
        </div>
        <Button asChild>
          <a href={submission.githubUrl} target="_blank" rel="noopener noreferrer">
            <Github className="w-4 h-4 mr-2" />
            View Repository
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
      </div>
    );
  };

  const renderDocument = () => {
    const docUrl = submission.pptUrl || submission.documentUrl;
    if (!docUrl) return renderEmpty('No document submitted');

    // Check if it's a Google Docs/Slides/PDF URL that can be embedded
    const canEmbed = docUrl.includes('docs.google.com') || docUrl.endsWith('.pdf');

    return (
      <div className="space-y-4">
        {canEmbed ? (
          <div className="aspect-[4/3] rounded-xl overflow-hidden bg-card border border-border">
            <iframe
              src={docUrl.includes('docs.google.com') ? `${docUrl}/preview` : docUrl}
              className="w-full h-full"
              allow="autoplay"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-heading font-semibold">Document</h4>
                <p className="text-sm text-muted-foreground">
                  {submission.submissionType === 'ppt' ? 'Presentation' : 'Document'} file
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <a href={docUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={docUrl} download>
              <Download className="w-4 h-4 mr-2" />
              Download
            </a>
          </Button>
        </div>
      </div>
    );
  };

  const renderScreenshots = () => {
    if (!submission.screenshots || submission.screenshots.length === 0) {
      return renderEmpty('No screenshots submitted');
    }

    return (
      <div className="space-y-4">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-card border border-border">
          <img
            src={submission.screenshots[currentScreenshotIndex]}
            alt={`Screenshot ${currentScreenshotIndex + 1}`}
            className="w-full h-full object-contain"
          />
          
          {submission.screenshots.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                onClick={() =>
                  setCurrentScreenshotIndex((prev) =>
                    prev === 0 ? submission.screenshots!.length - 1 : prev - 1
                  )
                }
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                onClick={() =>
                  setCurrentScreenshotIndex((prev) =>
                    prev === submission.screenshots!.length - 1 ? 0 : prev + 1
                  )
                }
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}

          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              {currentScreenshotIndex + 1} / {submission.screenshots.length}
            </Badge>
          </div>
        </div>

        {/* Thumbnails */}
        {submission.screenshots.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {submission.screenshots.map((screenshot, index) => (
              <button
                key={index}
                onClick={() => setCurrentScreenshotIndex(index)}
                className={cn(
                  'flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors',
                  index === currentScreenshotIndex
                    ? 'border-primary'
                    : 'border-transparent hover:border-muted-foreground/50'
                )}
              >
                <img
                  src={screenshot}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderLiveDemo = () => {
    if (!submission.liveDemoUrl) return renderEmpty('No live demo link submitted');

    return (
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
            <Globe className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h4 className="font-heading font-semibold">Live Demo</h4>
            <p className="text-sm text-muted-foreground truncate max-w-md">
              {submission.liveDemoUrl}
            </p>
          </div>
        </div>
        <Button asChild>
          <a href={submission.liveDemoUrl} target="_blank" rel="noopener noreferrer">
            <Globe className="w-4 h-4 mr-2" />
            View Live Demo
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
      </div>
    );
  };

  const renderMultiple = () => {
    return (
      <div className="space-y-6">
        {submission.videoUrl && renderVideo()}
        {submission.githubUrl && renderGithub()}
        {(submission.pptUrl || submission.documentUrl) && renderDocument()}
        {submission.screenshots && submission.screenshots.length > 0 && renderScreenshots()}
        {submission.liveDemoUrl && renderLiveDemo()}
        {submission.additionalLinks && submission.additionalLinks.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-heading font-semibold">Additional Links</h4>
            <div className="grid gap-2">
              {submission.additionalLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{link.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGeneric = () => {
    return renderEmpty('Unsupported submission type');
  };

  const renderEmpty = (message: string) => {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
        <File className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('space-y-4', className)}
    >
      {/* Header */}
      <div className="space-y-2">
        <h3 className="font-heading font-semibold text-lg">{submission.title}</h3>
        {submission.description && (
          <p className="text-muted-foreground">{submission.description}</p>
        )}
        {submission.technologies && submission.technologies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {submission.technologies.map((tech, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tech}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {renderContent()}
    </motion.div>
  );
};

export default SubmissionViewer;
