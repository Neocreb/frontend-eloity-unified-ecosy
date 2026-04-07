import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Building,
  Award,
  Globe,
  Plus,
  Edit,
} from "lucide-react";

export interface ProfessionalData {
  title?: string;
  company?: string;
  yearsOfExperience?: number;
  specializations?: string[];
  languages?: string[];
  certifications?: Array<{
    name: string;
    issuer: string;
    year: number;
  }>;
}

interface ProfessionalInfoProps {
  data: ProfessionalData;
  isOwner?: boolean;
  onEdit?: () => void;
}

export const ProfessionalInfo: React.FC<ProfessionalInfoProps> = ({
  data,
  isOwner = false,
  onEdit,
}) => {
  const hasData =
    data.title ||
    data.company ||
    data.yearsOfExperience ||
    (data.specializations && data.specializations.length > 0) ||
    (data.languages && data.languages.length > 0) ||
    (data.certifications && data.certifications.length > 0);

  if (!hasData && !isOwner) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Professional Info</CardTitle>
        {isOwner && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">No professional information added yet</p>
            {isOwner && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                Add professional details
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Title & Company */}
            {(data.title || data.company) && (
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  {data.title && (
                    <div className="font-medium text-sm">{data.title}</div>
                  )}
                  {data.company && (
                    <div className="text-sm text-muted-foreground">
                      {data.company}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Years of Experience */}
            {data.yearsOfExperience !== undefined && data.yearsOfExperience > 0 && (
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm text-muted-foreground">Experience</div>
                  <div className="font-medium text-sm">
                    {data.yearsOfExperience} year
                    {data.yearsOfExperience !== 1 ? "s" : ""} in the field
                  </div>
                </div>
              </div>
            )}

            {/* Specializations */}
            {data.specializations && data.specializations.length > 0 && (
              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="w-full">
                  <div className="text-sm text-muted-foreground mb-2">
                    Specializations
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.specializations.map((spec, index) => (
                      <span
                        key={index}
                        className="inline-block px-2.5 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Languages */}
            {data.languages && data.languages.length > 0 && (
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="w-full">
                  <div className="text-sm text-muted-foreground mb-2">
                    Languages
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.languages.map((language, index) => (
                      <span
                        key={index}
                        className="inline-block px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full"
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Certifications */}
            {data.certifications && data.certifications.length > 0 && (
              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="w-full">
                  <div className="text-sm text-muted-foreground mb-2">
                    Certifications
                  </div>
                  <div className="space-y-2">
                    {data.certifications.map((cert, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium">{cert.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {cert.issuer} • {cert.year}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
