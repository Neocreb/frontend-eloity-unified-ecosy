import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ThumbsUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Skill {
  id: string;
  name: string;
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
  endorsementCount: number;
  endorsedBy?: string[];
  isEndorsedByCurrentUser?: boolean;
}

interface SkillsSectionProps {
  skills: Skill[];
  isOwner?: boolean;
  onAddSkill?: () => void;
  onEndorseSkill?: (skillId: string) => void;
  maxVisibleSkills?: number;
}

const getProficiencyColor = (proficiency: string) => {
  switch (proficiency) {
    case "beginner":
      return "bg-blue-100 text-blue-800";
    case "intermediate":
      return "bg-green-100 text-green-800";
    case "advanced":
      return "bg-purple-100 text-purple-800";
    case "expert":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getProficiencyLabel = (proficiency: string) => {
  return proficiency.charAt(0).toUpperCase() + proficiency.slice(1);
};

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  skills,
  isOwner = false,
  onAddSkill,
  onEndorseSkill,
  maxVisibleSkills = 10,
}) => {
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [hoveredSkillId, setHoveredSkillId] = useState<string | null>(null);

  const visibleSkills = showAllSkills ? skills : skills.slice(0, maxVisibleSkills);
  const hasMoreSkills = skills.length > maxVisibleSkills;

  if (skills.length === 0 && !isOwner) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Skills</CardTitle>
        {isOwner && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddSkill}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Skill
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {skills.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">No skills added yet</p>
            {isOwner && (
              <Button variant="outline" size="sm" onClick={onAddSkill}>
                Add your first skill
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {visibleSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredSkillId(skill.id)}
                  onMouseLeave={() => setHoveredSkillId(null)}
                >
                  <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-input bg-card hover:bg-accent transition-colors">
                    <span className="text-sm font-medium">{skill.name}</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs px-2 py-0",
                        getProficiencyColor(skill.proficiency)
                      )}
                    >
                      {getProficiencyLabel(skill.proficiency)}
                    </Badge>
                  </div>

                  {/* Hover tooltip with endorsement info and button */}
                  {hoveredSkillId === skill.id && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover border rounded-lg shadow-md whitespace-nowrap z-10 text-sm">
                      <div className="font-medium mb-2">{skill.name}</div>
                      <div className="text-muted-foreground text-xs mb-2">
                        {skill.endorsementCount} endorsement
                        {skill.endorsementCount !== 1 ? "s" : ""}
                      </div>
                      {!isOwner && (
                        <Button
                          size="sm"
                          variant={
                            skill.isEndorsedByCurrentUser ? "default" : "outline"
                          }
                          className="gap-1"
                          onClick={() => onEndorseSkill?.(skill.id)}
                        >
                          <ThumbsUp className="h-3 w-3" />
                          {skill.isEndorsedByCurrentUser
                            ? "Endorsed"
                            : "Endorse"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* See all / Show less button */}
            {hasMoreSkills && (
              <button
                onClick={() => setShowAllSkills(!showAllSkills)}
                className="flex items-center gap-1 text-sm text-primary hover:underline mt-4"
              >
                {showAllSkills ? (
                  <>
                    Show less <ChevronDown className="h-4 w-4 rotate-180" />
                  </>
                ) : (
                  <>
                    See all {skills.length} skills{" "}
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            )}

            {/* Endorsers preview (if available) */}
            {!isOwner &&
              visibleSkills.some((s) => s.endorsedBy && s.endorsedBy.length > 0) && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Endorsed by
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <p>View skill details to see who endorsed each skill</p>
                  </div>
                </div>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
