import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, AlertOctagon, Calendar, User, BookOpen, Upload, X, FileText, RotateCcw } from "lucide-react";
import useLocalStorage from "@/hooks/useLocalStorage";

interface RecoveryResult {
  percentage: number;
  riskLevel: "safe" | "warning" | "critical";
  recoveryPlan: string;
  classesNeeded: number;
  isPossible: boolean;
  weeksNeeded?: number;
}

const AttendancePlanner = () => {
  const [data, setData, resetData] = useLocalStorage("attendify_attendance_planner", {
    studentName: "",
    subjectName: "",
    credits: "",
    hoursPerWeek: "",
    minutesPerWeek: "",
    totalClasses: "",
    attendedClasses: "",
    requiredPercentage: "75",
    missReason: "",
    timetableMetadata: null as { name: string; size: number } | null,
    result: null as RecoveryResult | null,
  });

  const {
    studentName, subjectName, credits, hoursPerWeek, minutesPerWeek,
    totalClasses, attendedClasses, requiredPercentage, missReason,
    timetableMetadata, result
  } = data;

  const [timetableFile, setTimetableFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof typeof data, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (validTypes.includes(file.type)) {
        setTimetableFile(file);
        updateField("timetableMetadata", { name: file.name, size: file.size });
      } else {
        alert('Please upload a PDF or image file (PNG, JPG)');
      }
    }
  };

  const removeTimetable = () => {
    setTimetableFile(null);
    updateField("timetableMetadata", null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    resetData();
    setTimetableFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const total = parseInt(totalClasses) || 0;
    const attended = parseInt(attendedClasses) || 0;
    const required = parseFloat(requiredPercentage) || 75;
    const hours = parseInt(hoursPerWeek) || 0;
    const minutes = parseInt(minutesPerWeek) || 0;

    if (total <= 0 || attended < 0) {
      if (result !== null) updateField("result", null);
      return;
    }

    if (attended > total) {
      if (result !== null) updateField("result", null);
      return;
    }

    // Convert to total minutes for accurate calculations
    const totalMinutesPerWeek = (hours * 60) + minutes;
    // Assume average class duration of 50 minutes if not specified
    const classesPerWeek = totalMinutesPerWeek > 0 ? totalMinutesPerWeek / 50 : 0;

    const percentage = (attended / total) * 100;

    // Calculate classes needed for recovery
    let classesNeeded = 0;
    let isPossible = true;

    if (percentage < required) {
      if (required >= 100) {
        isPossible = false;
        classesNeeded = Infinity;
      } else {
        classesNeeded = Math.ceil((required * total - 100 * attended) / (100 - required));

        // Check if mathematically possible
        if (classesNeeded > 500) {
          isPossible = false;
        }
      }
    }

    // Determine risk level
    let riskLevel: RecoveryResult["riskLevel"];
    if (percentage >= required) {
      riskLevel = "safe";
    } else if (percentage >= required - 15) {
      riskLevel = "warning";
    } else {
      riskLevel = "critical";
    }

    // Calculate weeks needed based on classes per week
    let weeksNeeded: number | undefined;
    if (classesPerWeek > 0 && classesNeeded > 0 && isPossible) {
      weeksNeeded = Math.ceil(classesNeeded / classesPerWeek);
    }

    // Generate recovery plan message
    let recoveryPlan: string;
    if (percentage >= required) {
      const maxTotal = Math.floor((attended * 100) / required);
      const canSkip = maxTotal - total;
      recoveryPlan = canSkip > 0
        ? `You're currently safe. You can skip up to ${canSkip} class${canSkip > 1 ? "es" : ""} and still maintain ${required}% attendance.`
        : `You're at exactly ${required}%. Attend all remaining classes to stay safe.`;
    } else if (isPossible) {
      recoveryPlan = `To reach ${required}% attendance, you must attend the next ${classesNeeded} class${classesNeeded > 1 ? "es" : ""} consecutively without any absence.`;
      if (weeksNeeded && totalMinutesPerWeek > 0) {
        const hoursDisplay = Math.floor(totalMinutesPerWeek / 60);
        const minsDisplay = totalMinutesPerWeek % 60;
        const timeStr = hoursDisplay > 0
          ? `${hoursDisplay}h${minsDisplay > 0 ? ` ${minsDisplay}m` : ''}`
          : `${minsDisplay}m`;
        recoveryPlan += ` At ${timeStr}/week, this will take approximately ${weeksNeeded} week${weeksNeeded > 1 ? "s" : ""}.`;
      }
    } else {
      recoveryPlan = `Recovery to ${required}% is mathematically impossible with current attendance. The deficit is too large to overcome. Please consult your academic advisor for options.`;
    }

    const newResult = {
      percentage,
      riskLevel,
      recoveryPlan,
      classesNeeded: isPossible ? classesNeeded : 0,
      isPossible,
      weeksNeeded,
    };

    if (JSON.stringify(result) !== JSON.stringify(newResult)) {
      updateField("result", newResult);
    }
  }, [totalClasses, attendedClasses, requiredPercentage, hoursPerWeek, minutesPerWeek, result, setData]);

  const getRiskIcon = () => {
    if (!result) return null;
    switch (result.riskLevel) {
      case "safe":
        return <Shield className="w-6 h-6 text-success" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-warning" />;
      case "critical":
        return <AlertOctagon className="w-6 h-6 text-destructive" />;
    }
  };

  const getRiskColor = () => {
    if (!result) return "";
    switch (result.riskLevel) {
      case "safe":
        return "bg-success/10 border-success/20 text-success";
      case "warning":
        return "bg-warning/10 border-warning/20 text-warning";
      case "critical":
        return "bg-destructive/10 border-destructive/20 text-destructive";
    }
  };

  const getRiskLabel = () => {
    if (!result) return "";
    switch (result.riskLevel) {
      case "safe":
        return "Safe";
      case "warning":
        return "Warning";
      case "critical":
        return "Critical";
    }
  };

  return (
    <div className="glass-strong rounded-2xl p-6 md:p-8 animate-fade-in relative group">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-semibold font-display text-foreground">
          Attendance Planner
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-muted-foreground hover:text-foreground opacity-50 group-hover:opacity-100 transition-opacity"
          title="Reset Planner"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <Label htmlFor="studentName" className="text-sm font-medium text-foreground flex items-center gap-2">
            <User className="w-4 h-4" /> Student Name
          </Label>
          <Input
            id="studentName"
            placeholder="Your name"
            value={studentName}
            onChange={(e) => updateField("studentName", e.target.value)}
            className="bg-background/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subjectName" className="text-sm font-medium text-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Subject Name
          </Label>
          <Input
            id="subjectName"
            placeholder="e.g., Data Structures"
            value={subjectName}
            onChange={(e) => updateField("subjectName", e.target.value)}
            className="bg-background/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="credits" className="text-sm font-medium text-foreground">
            Credits
          </Label>
          <Input
            id="credits"
            type="number"
            min="0"
            placeholder="e.g., 4"
            value={credits}
            onChange={(e) => updateField("credits", e.target.value)}
            className="bg-background/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hours" className="text-sm font-medium text-foreground">
            Hours/Week
          </Label>
          <Input
            id="hours"
            type="number"
            min="0"
            max="168"
            placeholder="e.g., 3"
            value={hoursPerWeek}
            onChange={(e) => updateField("hoursPerWeek", e.target.value)}
            className="bg-background/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minutes" className="text-sm font-medium text-foreground">
            Minutes/Week
          </Label>
          <Input
            id="minutes"
            type="number"
            min="0"
            max="59"
            placeholder="e.g., 30"
            value={minutesPerWeek}
            onChange={(e) => updateField("minutesPerWeek", e.target.value)}
            className="bg-background/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalPlanner" className="text-sm font-medium text-foreground">
            Total Classes
          </Label>
          <Input
            id="totalPlanner"
            type="number"
            min="0"
            placeholder="e.g., 50"
            value={totalClasses}
            onChange={(e) => updateField("totalClasses", e.target.value)}
            className="bg-background/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="attendedPlanner" className="text-sm font-medium text-foreground">
            Classes Attended
          </Label>
          <Input
            id="attendedPlanner"
            type="number"
            min="0"
            placeholder="e.g., 30"
            value={attendedClasses}
            onChange={(e) => updateField("attendedClasses", e.target.value)}
            className="bg-background/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="requiredPlanner" className="text-sm font-medium text-foreground">
            Required %
          </Label>
          <Input
            id="requiredPlanner"
            type="number"
            min="0"
            max="100"
            placeholder="e.g., 75"
            value={requiredPercentage}
            onChange={(e) => updateField("requiredPercentage", e.target.value)}
            className="bg-background/50"
          />
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label htmlFor="reason" className="text-sm font-medium text-foreground">
            Reason for Missing
          </Label>
          <Input
            id="reason"
            placeholder="e.g., Medical leave"
            value={missReason}
            onChange={(e) => updateField("missReason", e.target.value)}
            className="bg-background/50"
          />
        </div>
      </div>

      {/* Timetable Upload Section */}
      <div className="mb-6 p-4 rounded-xl bg-muted/30 border border-border">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4" /> Timetable Upload (Optional)
        </Label>
        <p className="text-xs text-muted-foreground mb-3">
          Uploading a timetable is optional. It helps improve accuracy but is not required.
        </p>

        {!timetableFile && !timetableMetadata ? (
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/jpg"
              onChange={handleFileChange}
              className="hidden"
              id="timetable-upload"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="border-dashed"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload PDF or Image
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/5 border border-primary/20">
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-sm text-foreground flex-1 truncate">
              {timetableFile ? timetableFile.name : `Previous file: ${timetableMetadata?.name}`}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeTimetable}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-4 animate-fade-in border-t border-border pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm text-muted-foreground mb-1">
                {studentName ? `${studentName}'s` : "Current"} Attendance {subjectName ? `in ${subjectName}` : ""}
              </p>
              <p className="text-4xl font-bold font-display text-foreground">
                {result.percentage.toFixed(2)}%
              </p>
            </div>

            <div className={`px-4 py-2 rounded-full border flex items-center gap-2 ${getRiskColor()}`}>
              {getRiskIcon()}
              <span className="font-semibold">{getRiskLabel()}</span>
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${result.riskLevel === "safe"
              ? "bg-success/5 border-success/20"
              : result.riskLevel === "warning"
                ? "bg-warning/5 border-warning/20"
                : "bg-destructive/5 border-destructive/20"
            }`}>
            <div className="flex items-start gap-3">
              <Calendar className={`w-5 h-5 mt-0.5 ${result.riskLevel === "safe"
                  ? "text-success"
                  : result.riskLevel === "warning"
                    ? "text-warning"
                    : "text-destructive"
                }`} />
              <div>
                <p className="font-medium text-foreground mb-1">Recovery Plan</p>
                <p className="text-foreground/80 leading-relaxed">{result.recoveryPlan}</p>
              </div>
            </div>
          </div>

          {result.classesNeeded > 0 && result.isPossible && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/50 border border-border text-center">
                <p className="text-2xl font-bold text-foreground">{result.classesNeeded}</p>
                <p className="text-sm text-muted-foreground">Classes to Attend</p>
              </div>
              {result.weeksNeeded && (
                <div className="p-4 rounded-xl bg-muted/50 border border-border text-center">
                  <p className="text-2xl font-bold text-foreground">{result.weeksNeeded}</p>
                  <p className="text-sm text-muted-foreground">Weeks Estimated</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!result && totalClasses && attendedClasses && (
        <p className="text-muted-foreground text-center py-4">
          Please enter valid numbers. Classes attended cannot exceed total classes.
        </p>
      )}
    </div>
  );
};

export default AttendancePlanner;
