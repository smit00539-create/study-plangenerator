import { useState } from "react";
import { Subject, StudyPlan, GeneratedSchedule } from "@/types/studyPlan";
import { SubjectCard } from "@/components/SubjectCard";
import { AddSubjectForm } from "@/components/AddSubjectForm";
import { SubjectDetailModal } from "@/components/SubjectDetailModal";
import { GlobalSettingsForm } from "@/components/GlobalSettingsForm";
import { SchedulePreview } from "@/components/SchedulePreview";
import { AIDataExtractor } from "@/components/AIDataExtractor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, Eye, GraduationCap, AlertTriangle, Zap, Sparkles, BookOpen, Target, Clock, TrendingUp } from "lucide-react";
import { generateSchedule } from "@/utils/scheduler";
import { generatePDF } from "@/utils/pdfGenerator";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [schedule, setSchedule] = useState<GeneratedSchedule | null>(null);
  const [showAIExtractor, setShowAIExtractor] = useState(false);
  
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
      customFactorTypes: []
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

  const handleAIDataExtracted = (extractedSubjects: Subject[]) => {
    setSubjects(extractedSubjects);
    setShowAIExtractor(false);
    toast({
      title: "Data imported successfully!",
      description: `Added ${extractedSubjects.length} subject(s) to your study plan.`,
    });
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
        customFactorTypes: []
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
        customFactorTypes: []
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
        customFactorTypes: []
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
    <div className="min-h-screen bg-background bg-mesh relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none animate-float" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl pointer-events-none" style={{ animationDelay: '3s' }} />

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Hero Section */}
        <header className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-2xl mb-6 shadow-glow rotate-3 hover:rotate-0 transition-transform duration-500">
            <GraduationCap className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold text-gradient mb-4 tracking-tight">
            Study Plan Generator
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Create intelligent, optimized study schedules with AI-powered subject rotation and smart workload distribution
          </p>
          
          {/* Quick stats */}
          {subjects.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 mb-6 animate-fade-in-up">
              <Badge variant="secondary" className="px-4 py-2 text-sm glass">
                <BookOpen className="w-4 h-4 mr-2" />
                {subjects.length} Subject{subjects.length !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm glass">
                <Target className="w-4 h-4 mr-2" />
                {totalLectures} Lectures
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm glass">
                <Clock className="w-4 h-4 mr-2" />
                {globalSettings.duration_days} Days
              </Badge>
              {schedule && (
                <Badge className="px-4 py-2 text-sm bg-success/20 text-success border-success/30">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {schedule.summary.buffer_days} Buffer Days
                </Badge>
              )}
            </div>
          )}
        </header>

        {/* Capacity Warning */}
        {isOverCapacity && (
          <Card className="mb-8 border-warning/50 bg-warning/5 glass animate-scale-in">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="p-3 bg-warning/20 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="font-semibold text-warning">Schedule may not fit in time frame</p>
                <p className="text-sm text-muted-foreground">
                  {totalLectures} lectures in {globalSettings.duration_days} days 
                  (max {globalSettings.duration_days * globalSettings.max_lectures_per_day} possible)
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Left Column - Configuration (3/5) */}
          <div className="xl:col-span-3 space-y-6">
            {/* Add Subjects */}
            <Card className="card-elevated border-border/50 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 font-display">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  Add Subjects
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <AddSubjectForm onAddSubject={addSubject} />
                
                {subjects.length > 0 && (
                  <>
                    <Separator className="bg-border/50" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {subjects.map((subject, index) => (
                        <div key={subject.id} className="animate-scale-in" style={{ animationDelay: `${index * 0.05}s` }}>
                          <SubjectCard
                            subject={subject}
                            onEdit={editSubject}
                            onDelete={deleteSubject}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                {subjects.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-xl bg-muted/20">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-2xl mb-4">
                      <GraduationCap className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No subjects added yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      Start by adding your first subject above, use AI extraction, or load example data
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => setShowAIExtractor(true)}
                        className="glass glow-on-hover"
                      >
                        <Sparkles className="h-4 w-4 mr-2 text-accent" />
                        Extract with AI
                      </Button>
                      <Button
                        variant="outline"
                        onClick={loadExampleData}
                        className="glass glow-on-hover"
                      >
                        <Zap className="h-4 w-4 mr-2 text-warning" />
                        Load Example
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Data Extractor */}
            {showAIExtractor && (
              <div className="animate-scale-in">
                <AIDataExtractor
                  onDataExtracted={handleAIDataExtracted}
                  onCancel={() => setShowAIExtractor(false)}
                />
              </div>
            )}

            {/* Global Settings */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <GlobalSettingsForm
                settings={globalSettings}
                onChange={setGlobalSettings}
                subjects={subjects}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Button
                onClick={validateAndGenerateSchedule}
                disabled={subjects.length === 0}
                size="lg"
                className="flex-1 bg-gradient-primary hover:shadow-glow transition-all duration-300 h-14 text-lg font-semibold"
              >
                <Eye className="h-5 w-5 mr-3" />
                Preview Plan
              </Button>
              <Button
                onClick={exportToPDF}
                disabled={!schedule}
                variant="outline"
                size="lg"
                className="flex-1 glass hover:bg-accent/10 transition-all duration-300 h-14 text-lg font-semibold glow-on-hover"
              >
                <Download className="h-5 w-5 mr-3" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Right Column - Preview (2/5) */}
          <div className="xl:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {schedule ? (
              <div className="sticky top-8">
                <Card className="card-elevated border-border/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 font-display">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Calendar className="h-5 w-5 text-accent" />
                      </div>
                      Generated Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <SchedulePreview schedule={schedule} />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="card-elevated border-border/50 min-h-[500px] flex items-center justify-center sticky top-8">
                <CardContent className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-muted rounded-2xl mb-6 float">
                    <Calendar className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-display font-semibold text-foreground mb-3">No schedule generated</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto">
                    Add subjects and click "Preview Plan" to see your optimized study schedule
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
