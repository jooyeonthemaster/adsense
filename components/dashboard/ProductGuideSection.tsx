'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GuideImageDisplay } from '@/components/admin/product-guides/GuideImageDisplay';

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
  is_collapsible: boolean;
  is_expanded_default: boolean;
  bg_color?: string;
  text_color?: string;
  images?: GuideImage[];
  image_layout?: string;
}

interface ProductGuideSectionProps {
  productKey: string;
}

export function ProductGuideSection({ productKey }: ProductGuideSectionProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const response = await fetch(`/api/client/product-guides/${productKey}`);
        if (!response.ok) throw new Error('가이드 조회 실패');
        
        const data = await response.json();
        setSections(data.sections || []);
      } catch (error) {
        console.error('가이드 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGuide();
  }, [productKey]);

  if (loading) {
    return (
      <Card className="p-6 mb-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-4">
      {sections.map((section) => (
        <GuideSection key={section.id} section={section} />
      ))}
    </div>
  );
}

function GuideSection({ section }: { section: Section }) {
  const [isOpen, setIsOpen] = useState(section.is_expanded_default);

  const sectionClasses = cn(
    'rounded-lg border p-4 transition-all',
    section.bg_color || 'bg-white',
    section.text_color || ''
  );

  if (!section.is_collapsible) {
    return (
      <Card className={sectionClasses}>
        <div className="flex items-start gap-3">
          <Gift className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-3">{section.title}</h3>
            
            <GuideImageDisplay 
              images={section.images || []} 
              layout={section.image_layout || 'grid'} 
            />
            
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={sectionClasses}>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-left group">
          <div className="flex items-center gap-3">
            <Gift className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
              {section.title}
            </h3>
          </div>
          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 pl-8">
          <GuideImageDisplay 
            images={section.images || []} 
            layout={section.image_layout || 'grid'} 
          />
          
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

