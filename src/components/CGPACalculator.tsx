import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Calculator, Award } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  credits: string;
  grade: string;
}

const gradePoints: Record<string, number> = {
  "O": 10,
  "A+": 9,
  "A": 8,
  "B+": 7,
  "B": 6,
  "C": 5,
  "D": 4,
  "F": 0,
};

const CGPACalculator = () => {
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: "1", name: "", credits: "", grade: "" },
  ]);

  const addSubject = () => {
    setSubjects([
      ...subjects,
      { id: Date.now().toString(), name: "", credits: "", grade: "" },
    ]);
  };

  const removeSubject = (id: string) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter((s) => s.id !== id));
    }
  };

  const updateSubject = (id: string, field: keyof Subject, value: string) => {
    setSubjects(
      subjects.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const calculateCGPA = () => {
    let totalCredits = 0;
    let totalGradePoints = 0;

    subjects.forEach((subject) => {
      const credits = parseFloat(subject.credits) || 0;
      const gradePoint = gradePoints[subject.grade] ?? 0;

      if (credits > 0 && subject.grade) {
        totalCredits += credits;
        totalGradePoints += credits * gradePoint;
      }
    });

    if (totalCredits === 0) return null;

    const cgpa = totalGradePoints / totalCredits;
    const percentage = (cgpa - 0.5) * 10; // Common conversion formula

    return {
      cgpa: cgpa.toFixed(2),
      percentage: Math.max(0, percentage).toFixed(2),
      totalCredits,
    };
  };

  const result = calculateCGPA();

  return (
    <div className="glass-strong rounded-2xl p-6 md:p-8 animate-fade-in">
      <h2 className="text-xl font-semibold font-display mb-6 text-foreground">
        CGPA Calculator
      </h2>

      <div className="space-y-4 mb-6">
        {subjects.map((subject, index) => (
          <div
            key={subject.id}
            className="grid grid-cols-12 gap-3 items-end animate-slide-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="col-span-12 md:col-span-5 space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Subject {index + 1}
              </Label>
              <Input
                placeholder="Subject name (optional)"
                value={subject.name}
                onChange={(e) => updateSubject(subject.id, "name", e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="col-span-5 md:col-span-2 space-y-2">
              <Label className="text-sm font-medium text-foreground">Credits</Label>
              <Input
                type="number"
                min="0"
                max="10"
                placeholder="e.g., 4"
                value={subject.credits}
                onChange={(e) => updateSubject(subject.id, "credits", e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="col-span-5 md:col-span-3 space-y-2">
              <Label className="text-sm font-medium text-foreground">Grade</Label>
              <Select
                value={subject.grade}
                onValueChange={(value) => updateSubject(subject.id, "grade", value)}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(gradePoints).map(([grade, points]) => (
                    <SelectItem key={grade} value={grade}>
                      {grade} ({points})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 md:col-span-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSubject(subject.id)}
                disabled={subjects.length === 1}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={addSubject}
        className="w-full mb-6 border-dashed"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Subject
      </Button>

      {result && (
        <div className="border-t border-border pt-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-primary/5 border border-primary/20 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground">CGPA</p>
              </div>
              <p className="text-3xl font-bold font-display text-primary">
                {result.cgpa}
              </p>
            </div>

            <div className="p-5 rounded-xl bg-accent/5 border border-accent/20 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calculator className="w-5 h-5 text-accent" />
                <p className="text-sm text-muted-foreground">Percentage</p>
              </div>
              <p className="text-3xl font-bold font-display text-accent">
                {result.percentage}%
              </p>
            </div>

            <div className="p-5 rounded-xl bg-muted border border-border text-center">
              <p className="text-sm text-muted-foreground mb-2">Total Credits</p>
              <p className="text-3xl font-bold font-display text-foreground">
                {result.totalCredits}
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Calculation:</strong> CGPA = Σ(Credits × Grade Points) / Total Credits
              <br />
              <strong>Percentage conversion:</strong> (CGPA - 0.5) × 10
            </p>
          </div>
        </div>
      )}

      {!result && subjects.some((s) => s.credits && s.grade) && (
        <p className="text-muted-foreground text-center py-4">
          Enter credits and grades for all subjects to calculate CGPA.
        </p>
      )}
    </div>
  );
};

export default CGPACalculator;
