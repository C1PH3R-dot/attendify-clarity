import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Calculator, Award, RotateCcw } from "lucide-react";
import useLocalStorage from "@/hooks/useLocalStorage";

interface Subject {
  id: string;
  name: string;
  totalMarks: string;
  obtainedMarks: string;
}

const MarksCalculator = () => {
  const [subjects, setSubjects, resetSubjects] = useLocalStorage<Subject[]>("attendify_marks_calc", [
    { id: "1", name: "", totalMarks: "", obtainedMarks: "" },
  ]);

  const addSubject = () => {
    setSubjects((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", totalMarks: "", obtainedMarks: "" },
    ]);
  };

  const removeSubject = (id: string) => {
    if (subjects.length > 1) {
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const updateSubject = (id: string, field: keyof Subject, value: string) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const result = useMemo(() => {
    let totalMaxMarks = 0;
    let totalObtained = 0;
    let validSubjects = 0;

    subjects.forEach((subject) => {
      const total = parseFloat(subject.totalMarks);
      const obtained = parseFloat(subject.obtainedMarks);

      // Validate: both must be valid numbers, obtained <= total, both >= 0
      if (
        !isNaN(total) &&
        !isNaN(obtained) &&
        total > 0 &&
        obtained >= 0 &&
        obtained <= total
      ) {
        totalMaxMarks += total;
        totalObtained += obtained;
        validSubjects++;
      }
    });

    if (totalMaxMarks === 0 || validSubjects === 0) return null;

    const percentage = (totalObtained / totalMaxMarks) * 100;

    return {
      percentage: percentage.toFixed(2),
      totalObtained: totalObtained.toFixed(2),
      totalMaxMarks: totalMaxMarks.toFixed(2),
      subjectsCalculated: validSubjects,
    };
  }, [subjects]);

  const getValidationError = (subject: Subject): string | null => {
    const total = parseFloat(subject.totalMarks);
    const obtained = parseFloat(subject.obtainedMarks);

    if (subject.totalMarks && (isNaN(total) || total <= 0)) {
      return "Total marks must be positive";
    }
    if (subject.obtainedMarks && isNaN(obtained)) {
      return "Invalid obtained marks";
    }
    if (!isNaN(total) && !isNaN(obtained) && obtained > total) {
      return "Obtained cannot exceed total";
    }
    if (!isNaN(obtained) && obtained < 0) {
      return "Marks cannot be negative";
    }
    return null;
  };

  return (
    <div className="glass-strong rounded-2xl p-6 md:p-8 animate-fade-in relative group">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-semibold font-display text-foreground">
          Marks Calculator
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetSubjects}
          className="text-muted-foreground hover:text-foreground opacity-50 group-hover:opacity-100 transition-opacity"
          title="Reset Calculator"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="space-y-4 mb-6">
        {subjects.map((subject, index) => {
          const error = getValidationError(subject);
          return (
            <div
              key={subject.id}
              className="animate-slide-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-12 md:col-span-4 space-y-2">
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

                <div className="col-span-5 md:col-span-3 space-y-2">
                  <Label className="text-sm font-medium text-foreground">Total Marks</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g., 100"
                    value={subject.totalMarks}
                    onChange={(e) => updateSubject(subject.id, "totalMarks", e.target.value)}
                    className={`bg-background/50 ${error ? 'border-destructive' : ''}`}
                  />
                </div>

                <div className="col-span-5 md:col-span-3 space-y-2">
                  <Label className="text-sm font-medium text-foreground">Marks Obtained</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g., 85"
                    value={subject.obtainedMarks}
                    onChange={(e) => updateSubject(subject.id, "obtainedMarks", e.target.value)}
                    className={`bg-background/50 ${error ? 'border-destructive' : ''}`}
                  />
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
              {error && (
                <p className="text-xs text-destructive mt-1 ml-1">{error}</p>
              )}
            </div>
          );
        })}
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
                <p className="text-sm text-muted-foreground">Overall Percentage</p>
              </div>
              <p className="text-3xl font-bold font-display text-primary">
                {result.percentage}%
              </p>
            </div>

            <div className="p-5 rounded-xl bg-accent/5 border border-accent/20 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calculator className="w-5 h-5 text-accent" />
                <p className="text-sm text-muted-foreground">Marks Obtained</p>
              </div>
              <p className="text-3xl font-bold font-display text-accent">
                {result.totalObtained}
              </p>
              <p className="text-xs text-muted-foreground">out of {result.totalMaxMarks}</p>
            </div>

            <div className="p-5 rounded-xl bg-muted border border-border text-center">
              <p className="text-sm text-muted-foreground mb-2">Subjects Calculated</p>
              <p className="text-3xl font-bold font-display text-foreground">
                {result.subjectsCalculated}
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Calculation:</strong> Overall Percentage = (Total Marks Obtained / Total Maximum Marks) × 100
              <br />
              <span className="text-xs">= ({result.totalObtained} / {result.totalMaxMarks}) × 100 = {result.percentage}%</span>
            </p>
          </div>
        </div>
      )}

      {!result && subjects.some((s) => s.totalMarks || s.obtainedMarks) && (
        <p className="text-muted-foreground text-center py-4">
          Enter valid marks for at least one subject. Obtained marks cannot exceed total marks.
        </p>
      )}
    </div>
  );
};

export default MarksCalculator;
