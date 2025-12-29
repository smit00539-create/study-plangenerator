import { Subject } from "@/types/studyPlan";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, BookOpen, RotateCcw } from "lucide-react";

interface SubjectCardProps {
  subject: Subject;
  onEdit: (subject: Subject) => void;
  onDelete: (subjectId: string) => void;
}

export const SubjectCard = ({ subject, onEdit, onDelete }: SubjectCardProps) => {
  const totalLectures = subject.chapters.reduce((sum, chapter) => sum + chapter.lectures_remaining, 0);
  const totalRevisions = subject.revisions.length;
  const isPriority = subject.preference_weight > 1.2;

  return (
    <Card 
      className="group cursor-pointer transition-all duration-300 hover-lift card-elevated border-border/50 overflow-hidden"
      onClick={() => onEdit(subject)}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
            {subject.name}
          </h3>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(subject);
              }}
              className="h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(subject.id);
              }}
              className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {isPriority && (
          <Badge variant="secondary" className="w-fit bg-accent/20 text-accent border-accent/30">
            Priority Subject
          </Badge>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4 text-primary/70" />
            <span>{totalLectures} lectures remaining</span>
          </div>
          {totalRevisions > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RotateCcw className="h-4 w-4 text-accent/70" />
              <span>{totalRevisions} revisions scheduled</span>
            </div>
          )}
          <div className="text-xs text-muted-foreground/70 pt-1">
            Weight: <span className="text-primary">{subject.preference_weight}x</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};