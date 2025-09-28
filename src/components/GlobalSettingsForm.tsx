import { StudyPlan } from "@/types/studyPlan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Settings, ChevronDown, Info } from "lucide-react";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GlobalSettingsFormProps {
  settings: Omit<StudyPlan, 'subjects'>;
  onChange: (settings: Omit<StudyPlan, 'subjects'>) => void;
}

export const GlobalSettingsForm = ({ settings, onChange }: GlobalSettingsFormProps) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const updateSetting = <K extends keyof Omit<StudyPlan, 'subjects'>>(
    key: K,
    value: Omit<StudyPlan, 'subjects'>[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Global Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="exam-name">Exam Name (optional)</Label>
            <Input
              id="exam-name"
              placeholder="e.g., NEET 2025"
              value={settings.exam_name || ""}
              onChange={(e) => updateSetting('exam_name', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date (optional)</Label>
            <Input
              id="start-date"
              type="date"
              value={settings.start_date || ""}
              onChange={(e) => updateSetting('start_date', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Target Duration (days)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={settings.duration_days}
              onChange={(e) => updateSetting('duration_days', parseInt(e.target.value) || 30)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="max-lectures">Max Lectures per Day</Label>
            <Input
              id="max-lectures"
              type="number"
              min="1"
              max="10"
              value={settings.max_lectures_per_day}
              onChange={(e) => updateSetting('max_lectures_per_day', parseInt(e.target.value) || 3)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="subjects-per-day">Subjects per Day</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Two subjects per day provides focused work and better retention. You can adjust this based on your preferences.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="subjects-per-day"
            type="number"
            min="1"
            max="5"
            value={settings.subjects_per_day}
            onChange={(e) => updateSetting('subjects_per_day', parseInt(e.target.value) || 2)}
          />
        </div>

        <Separator />

        {/* Scheduling Preferences */}
        <div className="space-y-4">
          <h3 className="font-medium">Scheduling Preferences</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="rotation">Prefer rotation of subject pairings</Label>
              <p className="text-sm text-muted-foreground">Cycles subject combinations for variety</p>
            </div>
            <Switch
              id="rotation"
              checked={settings.rotation_enabled}
              onCheckedChange={(checked) => updateSetting('rotation_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="revision-sundays">Revision Sundays only</Label>
              <p className="text-sm text-muted-foreground">Schedule all revisions on Sundays</p>
            </div>
            <Switch
              id="revision-sundays"
              checked={settings.revision_sundays_only}
              onCheckedChange={(checked) => updateSetting('revision_sundays_only', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Distribution Strategy</Label>
            <Select
              value={settings.distribution_mode}
              onValueChange={(value: "auto" | "preference") => updateSetting('distribution_mode', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-distribute by workload</SelectItem>
                <SelectItem value="preference">Respect explicit preference weights</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>PDF Theme</Label>
            <Select
              value={settings.pdf_theme}
              onValueChange={(value: "simple" | "compact" | "colorful" | "print") => updateSetting('pdf_theme', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple</SelectItem>
                <SelectItem value="compact">Compact Table</SelectItem>
                <SelectItem value="colorful">Colorful Card</SelectItem>
                <SelectItem value="print">Print-optimized</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Custom Requirements (Description)</Label>
          <Textarea
            id="description"
            placeholder="e.g., No study on Thursdays, holidays every 5th day, extra revision on weekends..."
            value={settings.description || ""}
            onChange={(e) => updateSetting('description', e.target.value)}
            className="min-h-[100px]"
          />
          <p className="text-sm text-muted-foreground">
            Describe any custom requirements like holidays, specific day preferences, or special scheduling needs.
          </p>
        </div>

        <Separator />

        {/* Advanced Options */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0">
              <span className="font-medium">Advanced Options</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="even-distribution">Force exact even distribution</Label>
                <p className="text-sm text-muted-foreground">May leave idle days</p>
              </div>
              <Switch
                id="even-distribution"
                checked={settings.force_even_distribution || false}
                onCheckedChange={(checked) => updateSetting('force_even_distribution', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="chapter-atomicity">Preserve per-chapter atomicity</Label>
                <p className="text-sm text-muted-foreground">Never split a single lecture across days</p>
              </div>
              <Switch
                id="chapter-atomicity"
                checked={settings.preserve_chapter_atomicity || false}
                onCheckedChange={(checked) => updateSetting('preserve_chapter_atomicity', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="chapter-splitting">Allow splitting chapters across days</Label>
                <p className="text-sm text-muted-foreground">Chapters can span multiple days</p>
              </div>
              <Switch
                id="chapter-splitting"
                checked={settings.allow_chapter_splitting !== false}
                onCheckedChange={(checked) => updateSetting('allow_chapter_splitting', checked)}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};