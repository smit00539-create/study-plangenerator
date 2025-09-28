import { useState, useEffect } from "react";
import { Subject, Chapter, Revision } from "@/types/studyPlan";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, BookOpen, RotateCcw } from "lucide-react";

interface SubjectDetailModalProps {
  subject: Subject | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (subject: Subject) => void;
}

export const SubjectDetailModal = ({ subject, isOpen, onClose, onSave }: SubjectDetailModalProps) => {
  const [formData, setFormData] = useState<Subject | null>(null);

  useEffect(() => {
    if (subject) {
      setFormData({ ...subject });
    }
  }, [subject]);

  if (!formData) return null;

  const handleSave = () => {
    if (formData.chapters.length === 0 && formData.revisions.length === 0) {
      alert("Please add at least one chapter or revision item.");
      return;
    }
    onSave(formData);
    onClose();
  };

  const addChapter = () => {
    const chapterNum = formData.chapters.length + 1;
    setFormData({
      ...formData,
      chapters: [...formData.chapters, { name: `Ch ${chapterNum}`, lectures_remaining: 1 }]
    });
  };

  const updateChapter = (index: number, updates: Partial<Chapter>) => {
    const newChapters = [...formData.chapters];
    newChapters[index] = { ...newChapters[index], ...updates };
    setFormData({ ...formData, chapters: newChapters });
  };

  const removeChapter = (index: number) => {
    setFormData({
      ...formData,
      chapters: formData.chapters.filter((_, i) => i !== index)
    });
  };

  const addRevision = () => {
    setFormData({
      ...formData,
      revisions: [...formData.revisions, { name: "Revision Topic", stage: 0 }]
    });
  };

  const updateRevision = (index: number, updates: Partial<Revision>) => {
    const newRevisions = [...formData.revisions];
    newRevisions[index] = { ...newRevisions[index], ...updates };
    setFormData({ ...formData, revisions: newRevisions });
  };

  const removeRevision = (index: number) => {
    setFormData({
      ...formData,
      revisions: formData.revisions.filter((_, i) => i !== index)
    });
  };

  const handlePriorityToggle = (checked: boolean) => {
    setFormData({
      ...formData,
      preference_weight: checked ? 1.4 : 1.0
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Subject Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Subject Name */}
          <div className="space-y-2">
            <Label htmlFor="subject-name">Subject Name</Label>
            <Input
              id="subject-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-background"
            />
          </div>

          {/* Chapters Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5" />
                Chapters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.chapters.map((chapter, index) => (
                <div key={index} className="flex gap-2 items-center p-3 border rounded-lg bg-gradient-subtle">
                  <Input
                    placeholder="Chapter name"
                    value={chapter.name}
                    onChange={(e) => updateChapter(index, { name: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Lectures"
                    value={chapter.lectures_remaining}
                    onChange={(e) => updateChapter(index, { lectures_remaining: parseInt(e.target.value) || 1 })}
                    className="w-24"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeChapter(index)}
                    className="text-destructive hover:bg-destructive/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addChapter}
                className="w-full border-dashed hover:bg-accent/50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Chapter
              </Button>
            </CardContent>
          </Card>

          {/* Revisions Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <RotateCcw className="h-5 w-5" />
                Revisions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.revisions.map((revision, index) => (
                <div key={index} className="flex gap-2 items-center p-3 border rounded-lg bg-gradient-subtle">
                  <Input
                    placeholder="Revision topic"
                    value={revision.name}
                    onChange={(e) => updateRevision(index, { name: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRevision(index)}
                    className="text-destructive hover:bg-destructive/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addRevision}
                className="w-full border-dashed hover:bg-accent/50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Revision Topic
              </Button>
            </CardContent>
          </Card>

          {/* Priority Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Priority Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="priority-toggle">Mark as priority subject</Label>
                  <p className="text-sm text-muted-foreground">Sets weight to 1.4x for more scheduling priority</p>
                </div>
                <Switch
                  id="priority-toggle"
                  checked={formData.preference_weight >= 1.4}
                  onCheckedChange={handlePriorityToggle}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Preference Weight: {formData.preference_weight.toFixed(1)}x</Label>
                <Slider
                  value={[formData.preference_weight]}
                  onValueChange={([value]) => setFormData({ ...formData, preference_weight: value })}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.5x (Low)</span>
                  <span>1.0x (Normal)</span>
                  <span>2.0x (High)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-gradient-primary">
              Save Subject
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};