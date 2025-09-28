import { useState } from "react";
import { Subject, StudyPlan, GeneratedSchedule } from "@/types/studyPlan";
import { SubjectCard } from "@/components/SubjectCard";
import { AddSubjectForm } from "@/components/AddSubjectForm";
import { SubjectDetailModal } from "@/components/SubjectDetailModal";
import { GlobalSettingsForm } from "@/components/GlobalSettingsForm";
import { SchedulePreview } from "@/components/SchedulePreview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Download, Eye, GraduationCap, AlertTriangle, Zap } from "lucide-react";
import { generateSchedule } from "@/utils/scheduler";
import { generatePDF } from "@/utils/pdfGenerator";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [schedule, setSchedule] = useState<GeneratedSchedule | null>(null);
  
  const [globalSettings, setGlobalSettings] = useState<Omit<StudyPlan, 'subjects'>>({
    duration_days: 30,
    max_lectures_per_day: 3,
    subjects_per_day: 2,
    rotation_enabled: true,
    revision_sundays_only: false,
    distribution_mode: "auto",
    pdf_theme: "simple",
    allow_chapter_splitting: true
  });

  const addSubject = (name: string) => {
    const newSubject: Subject = {
      id: Date.now().toString(),
      name,
      preference_weight: 1.0,
      chapters: [],
      revisions: [],
      custom_factors: []
    };
    setSubjects([...subjects, newSubject]);
    setSelectedSubject(newSubject);
    setIsModalOpen(true);
  };

  const editSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsModalOpen(true);
  };

  const saveSubject = (updatedSubject: Subject) => {
    setSubjects(subjects.map(s => s.id === updatedSubject.id ? updatedSubject : s));
  };

  const deleteSubject = (subjectId: string) => {
    setSubjects(subjects.filter(s => s.id !== subjectId));
  };

  const loadExampleData = () => {
    const exampleSubjects: Subject[] = [
      {
        id: "1",
        name: "Physics",
        preference_weight: 1.0,
        chapters: [
          { name: "P1", lectures_remaining: 4 },
          { name: "P2", lectures_remaining: 4 },
          { name: "P3", lectures_remaining: 2 },
          { name: "P4", lectures_remaining: 2 },
          { name: "P5", lectures_remaining: 2 }
        ],
        revisions: [],
        custom_factors: []
      },
      {
        id: "2",
        name: "Chemistry",
        preference_weight: 1.4,
        chapters: [
          { name: "C1", lectures_remaining: 2 },
          { name: "C2", lectures_remaining: 2 },
          { name: "C3", lectures_remaining: 2 },
          { name: "C4", lectures_remaining: 2 },
          { name: "C5", lectures_remaining: 2 },
          { name: "C6", lectures_remaining: 2 },
          { name: "C7", lectures_remaining: 2 },
          { name: "C8", lectures_remaining: 2 },
          { name: "C9", lectures_remaining: 2 },
          { name: "C10", lectures_remaining: 2 }
        ],
        revisions: [],
        custom_factors: []
      },
      {
        id: "3",
        name: "Math",
        preference_weight: 1.0,
        chapters: [
          { name: "M1", lectures_remaining: 3 },
          { name: "M2", lectures_remaining: 3 },
          { name: "M3", lectures_remaining: 3 },
          { name: "M4", lectures_remaining: 3 },
          { name: "M5", lectures_remaining: 3 }
        ],
        revisions: [],
        custom_factors: []
      }
    ];

    setSubjects(exampleSubjects);
    setGlobalSettings(prev => ({
      ...prev,
      exam_name: "Example Exam",
      start_date: "2025-10-01"
    }));

    toast({
      title: "Example data loaded",
      description: "Physics (14), Chemistry (20), Math (15) - 49 total lectures over 30 days."
    });
  };

  const validateAndGenerateSchedule = () => {
    try {
      if (subjects.length === 0) {
        toast({
          title: "No subjects added",
          description: "Please add at least one subject to generate a schedule.",
          variant: "destructive"
        });
        return;
      }

      const totalLectures = subjects.reduce((sum, subject) => 
        sum + subject.chapters.reduce((chapterSum, chapter) => chapterSum + chapter.lectures_remaining, 0), 0
      );

      if (totalLectures === 0) {
        toast({
          title: "No lectures to schedule",
          description: "Please add chapters with lectures to your subjects.",
          variant: "destructive"
        });
        return;
      }

      const maxPossibleLectures = globalSettings.duration_days * globalSettings.max_lectures_per_day;
      if (totalLectures > maxPossibleLectures) {
        toast({
          title: "Impossible to finish in time",
          description: `You have ${totalLectures} lectures but can only fit ${maxPossibleLectures} in ${globalSettings.duration_days} days. Consider increasing duration or max lectures per day.`,
          variant: "destructive"
        });
        return;
      }

      const plan: StudyPlan = {
        ...globalSettings,
        subjects
      };

      const generatedSchedule = generateSchedule(plan);
      setSchedule(generatedSchedule);
      
      toast({
        title: "Schedule generated successfully!",
        description: `${generatedSchedule.summary.total_lectures} lectures scheduled over ${generatedSchedule.summary.completion_day} days.`
      });
    } catch (error) {
      toast({
        title: "Error generating schedule",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  const exportToPDF = async () => {
    if (!schedule) {
      toast({
        title: "No schedule to export",
        description: "Please generate a schedule first.",
        variant: "destructive"
      });
      return;
    }

    try {
      const plan: StudyPlan = { ...globalSettings, subjects };
      await generatePDF(schedule, plan);
      
      toast({
        title: "PDF export initiated",
        description: "Your study plan PDF should open in a new window."
      });
    } catch (error) {
      toast({
        title: "PDF export failed",
        description: error instanceof Error ? error.message : "Failed to generate PDF.",
        variant: "destructive"
      });
    }
  };

  const totalLectures = subjects.reduce((sum, subject) => 
    sum + subject.chapters.reduce((chapterSum, chapter) => chapterSum + chapter.lectures_remaining, 0), 0
  );

  const isOverCapacity = totalLectures > (globalSettings.duration_days * globalSettings.max_lectures_per_day);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4 shadow-glow">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Study Plan Generator
          </h1>
          <p className="text-lg text-muted-foreground">
            Create optimized daily study schedules with intelligent subject rotation
          </p>
        </div>

        {/* Capacity Warning */}
        {isOverCapacity && (
          <Card className="mb-6 border-warning bg-warning/5">
            <CardContent className="flex items-center gap-3 pt-6">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div>
                <p className="font-medium text-warning">Schedule may not fit in time frame</p>
                <p className="text-sm text-muted-foreground">
                  {totalLectures} lectures in {globalSettings.duration_days} days 
                  (max {globalSettings.duration_days * globalSettings.max_lectures_per_day} possible)
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            {/* Add Subjects */}
            <Card>
              <CardHeader>
                <CardTitle>Add Subjects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AddSubjectForm onAddSubject={addSubject} />
                
                {subjects.length > 0 && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 gap-3">
                      {subjects.map((subject) => (
                        <SubjectCard
                          key={subject.id}
                          subject={subject}
                          onEdit={editSubject}
                          onDelete={deleteSubject}
                        />
                      ))}
                    </div>
                  </>
                )}
                
                {subjects.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No subjects added yet</p>
                    <p className="text-sm mb-4">Start by adding your first subject above</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadExampleData}
                      className="mx-auto hover:bg-accent/50"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Load Example Data
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Global Settings */}
            <GlobalSettingsForm
              settings={globalSettings}
              onChange={setGlobalSettings}
            />

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={validateAndGenerateSchedule}
                disabled={subjects.length === 0}
                className="flex-1 bg-gradient-primary hover:shadow-glow transition-all duration-300"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Plan
              </Button>
              <Button
                onClick={exportToPDF}
                disabled={!schedule}
                variant="outline"
                className="flex-1 hover:bg-accent/50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div>
            {schedule ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Generated Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <SchedulePreview schedule={schedule} />
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full min-h-[400px] flex items-center justify-center">
                <CardContent className="text-center">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No schedule generated</h3>
                  <p className="text-sm text-muted-foreground">
                    Add subjects and click "Preview Plan" to see your schedule
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Subject Detail Modal */}
        <SubjectDetailModal
          subject={selectedSubject}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSubject(null);
          }}
          onSave={saveSubject}
        />
      </div>
    </div>
  );
};

export default Index;
