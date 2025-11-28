'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GuideImageDisplay } from './GuideImageDisplay';

interface GuideImage {
  url: string;
  mobile_url?: string;
  link?: string;
  alt?: string;
}

interface Section {
  id: string;
  section_type: string;
  title: string;
  content: string;
  icon: string;
  is_collapsible: boolean;
  is_expanded_default: boolean;
  is_active: boolean;
  bg_color?: string;
  text_color?: string;
  images?: GuideImage[];
  image_layout?: string;
}

interface Guide {
  id: string;
  title: string;
  description: string;
  sections?: Section[];
}

interface GuidePreviewProps {
  guide: Guide;
}

export function GuidePreview({ guide }: GuidePreviewProps) {
  const activeSections = guide.sections?.filter(s => s.is_active) || [];

  return (
    <Card className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">{guide.title}</h1>
          {guide.description && (
            <p className="text-muted-foreground">{guide.description}</p>
          )}
        </div>

        <div className="space-y-4">
          {activeSections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>표시할 섹션이 없습니다</p>
            </div>
          ) : (
            activeSections.map((section) => (
              <SectionPreview key={section.id} section={section} />
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

function SectionPreview({ section }: { section: Section }) {
  const [isOpen, setIsOpen] = useState(section.is_expanded_default);

  const sectionClasses = cn(
    'rounded-lg border p-4',
    section.bg_color || 'bg-white',
    section.text_color || ''
  );

  if (!section.is_collapsible) {
    return (
      <div className={sectionClasses}>
        <h3 className="text-lg font-semibold mb-3">{section.title}</h3>
        
        {/* 이미지 표시 */}
        {section.images && section.images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {section.images.map((img, idx) => (
              <div key={idx} className="rounded-lg overflow-hidden">
                {img.link ? (
                  <a href={img.link} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
                    <img src={img.url} alt={img.alt || ''} className="w-full h-auto" />
                  </a>
                ) : (
                  <img src={img.url} alt={img.alt || ''} className="w-full h-auto" />
                )}
                {img.alt && <p className="text-xs text-center mt-1 text-muted-foreground">{img.alt}</p>}
              </div>
            ))}
          </div>
        )}
        
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: section.content }}
        />
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={sectionClasses}>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
          <h3 className="text-lg font-semibold">{section.title}</h3>
          {isOpen ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <GuideImageDisplay 
            images={section.images || []} 
            layout={section.image_layout || 'grid'} 
          />
          
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

