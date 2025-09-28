import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddSubjectFormProps {
  onAddSubject: (name: string) => void;
}

export const AddSubjectForm = ({ onAddSubject }: AddSubjectFormProps) => {
  const [subjectName, setSubjectName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subjectName.trim()) {
      onAddSubject(subjectName.trim());
      setSubjectName("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        placeholder="Subject name (e.g., Physics)"
        value={subjectName}
        onChange={(e) => setSubjectName(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-background border-border/50 focus:border-primary/50 focus:ring-primary/20"
      />
      <Button 
        type="submit"
        size="sm"
        className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
        disabled={!subjectName.trim()}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
};