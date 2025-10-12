import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Sparkles, CheckCircle, XCircle } from "lucide-react";
import { Subject } from "@/types/studyPlan";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIDataExtractorProps {
  onDataExtracted: (subjects: Subject[]) => void;
  onCancel: () => void;
}

export const AIDataExtractor = ({ onDataExtracted, onCancel }: AIDataExtractorProps) => {
  const [textInput, setTextInput] = useState("");
  const [extractedData, setExtractedData] = useState<{ subjects: Subject[] } | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();

  const handleExtract = async () => {
    if (!textInput.trim()) {
      toast({
        title: "Input required",
        description: "Please provide some content to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-study-data", {
        body: { content: textInput },
      });

      if (error) throw error;

      // Add IDs to subjects and nested items
      const processedSubjects = data.subjects.map((subject: any) => ({
        ...subject,
        id: crypto.randomUUID(),
        preference_weight: subject.preference_weight || 5,
        chapters: subject.chapters || [],
        revisions: (subject.revisions || []).map((rev: any) => ({
          ...rev,
          stage: 1,
        })),
        customFactorTypes: (subject.customFactorTypes || []).map((factorType: any) => ({
          ...factorType,
          id: crypto.randomUUID(),
          items: factorType.items.map((item: any) => ({
            ...item,
            id: crypto.randomUUID(),
          })),
        })),
      }));

      setExtractedData({ subjects: processedSubjects });
      toast({
        title: "Data extracted successfully!",
        description: `Found ${processedSubjects.length} subject(s)`,
      });
    } catch (error: any) {
      console.error("Extraction error:", error);
      toast({
        title: "Extraction failed",
        description: error.message || "Failed to extract data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirm = () => {
    if (extractedData) {
      onDataExtracted(extractedData.subjects);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Data Extraction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!extractedData ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Paste your study material data:</label>
              <Textarea
                placeholder="Example: 
Mathematics - 3 chapters: Calculus (5 lectures), Algebra (4 lectures), Geometry (3 lectures)
Revisions: Integration, Differentiation

Physics - 2 chapters: Mechanics (6 lectures), Thermodynamics (4 lectures)
Practice Questions: 50 questions on mechanics"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleExtract}
                disabled={isExtracting}
                className="flex-1"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isExtracting ? "Analyzing..." : "Extract Data"}
              </Button>
              <Button onClick={onCancel} variant="outline">
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Data extracted successfully!</span>
              </div>

              <div className="border rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto">
                {extractedData.subjects.map((subject, idx) => (
                  <div key={idx} className="border-b pb-3 last:border-b-0">
                    <h3 className="font-semibold text-lg">{subject.name}</h3>
                    <div className="ml-4 mt-2 space-y-1 text-sm">
                      {subject.chapters.length > 0 && (
                        <div>
                          <span className="font-medium">Chapters:</span>{" "}
                          {subject.chapters.map(ch => `${ch.name} (${ch.lectures_remaining} lectures)`).join(", ")}
                        </div>
                      )}
                      {subject.revisions && subject.revisions.length > 0 && (
                        <div>
                          <span className="font-medium">Revisions:</span>{" "}
                          {subject.revisions.map(rev => rev.name).join(", ")}
                        </div>
                      )}
                      {subject.customFactorTypes && subject.customFactorTypes.length > 0 && (
                        <div>
                          {subject.customFactorTypes.map(ft => (
                            <div key={ft.id}>
                              <span className="font-medium">{ft.typeName}:</span>{" "}
                              {ft.items.map(item => `${item.name} (${item.value})`).join(", ")}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  Please review the extracted data above. If it looks correct, click "Confirm & Use Data" to populate your study plan.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleConfirm} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm & Use Data
              </Button>
              <Button
                onClick={() => setExtractedData(null)}
                variant="outline"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={onCancel} variant="outline">
                Cancel
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
