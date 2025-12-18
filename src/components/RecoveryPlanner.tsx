import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield, AlertTriangle, AlertOctagon, Calendar, User, BookOpen } from "lucide-react";

interface RecoveryResult {
  percentage: number;
  riskLevel: "safe" | "warning" | "critical";
  recoveryPlan: string;
  classesNeeded: number;
  isPossible: boolean;
  weeksNeeded?: number;
}

const RecoveryPlanner = () => {
  const [studentName, setStudentName] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [credits, setCredits] = useState<string>("");
  const [hoursPerWeek, setHoursPerWeek] = useState<string>("");
  const [totalClasses, setTotalClasses] = useState<string>("");
  const [attendedClasses, setAttendedClasses] = useState<string>("");
  const [requiredPercentage, setRequiredPercentage] = useState<string>("75");
  const [missReason, setMissReason] = useState("");
  const [result, setResult] = useState<RecoveryResult | null>(null);

  useEffect(() => {
    const total = parseInt(totalClasses) || 0;
    const attended = parseInt(attendedClasses) || 0;
    const required = parseFloat(requiredPercentage) || 75;
    const hours = parseInt(hoursPerWeek) || 0;

    if (total <= 0 || attended < 0 || attended > total) {
      setResult(null);
      return;
    }

    const percentage = (attended / total) * 100;
    
    // Calculate classes needed for recovery
    // (attended + x) / (total + x) >= required/100
    let classesNeeded = 0;
    let isPossible = true;

    if (percentage < required) {
      classesNeeded = Math.ceil((required * total - 100 * attended) / (100 - required));
      
      // Check if mathematically possible (required < 100)
      if (required >= 100 || classesNeeded > 500) {
        isPossible = false;
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

    // Calculate weeks needed based on hours per week
    let weeksNeeded: number | undefined;
    if (hours > 0 && classesNeeded > 0) {
      // Assuming 1 hour = 1 class approximately
      weeksNeeded = Math.ceil(classesNeeded / hours);
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
      if (weeksNeeded) {
        recoveryPlan += ` At ${hours} hour${hours > 1 ? "s" : ""}/week, this will take approximately ${weeksNeeded} week${weeksNeeded > 1 ? "s" : ""}.`;
      }
    } else {
      recoveryPlan = `Recovery to ${required}% is mathematically impossible with current attendance. The deficit is too large to overcome. Please consult your academic advisor for options.`;
    }

    setResult({
      percentage,
      riskLevel,
      recoveryPlan,
      classesNeeded,
      isPossible,
      weeksNeeded,
    });
  }, [totalClasses, attendedClasses, requiredPercentage, hoursPerWeek]);

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
    <div className="glass-strong rounded-2xl p-6 md:p-8 animate-fade-in">
      <h2 className="text-xl font-semibold font-display mb-6 text-foreground">
        Attendance Risk & Recovery
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <Label htmlFor="studentName" className="text-sm font-medium text-foreground flex items-center gap-2">
            <User className="w-4 h-4" /> Student Name
          </Label>
          <Input
            id="studentName"
            placeholder="Your name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
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
            onChange={(e) => setSubjectName(e.target.value)}
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
            onChange={(e) => setCredits(e.target.value)}
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
            placeholder="e.g., 3"
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(e.target.value)}
            className="bg-background/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalRecovery" className="text-sm font-medium text-foreground">
            Total Classes
          </Label>
          <Input
            id="totalRecovery"
            type="number"
            min="0"
            placeholder="e.g., 50"
            value={totalClasses}
            onChange={(e) => setTotalClasses(e.target.value)}
            className="bg-background/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="attendedRecovery" className="text-sm font-medium text-foreground">
            Attended
          </Label>
          <Input
            id="attendedRecovery"
            type="number"
            min="0"
            placeholder="e.g., 30"
            value={attendedClasses}
            onChange={(e) => setAttendedClasses(e.target.value)}
            className="bg-background/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <Label htmlFor="requiredRecovery" className="text-sm font-medium text-foreground">
            Required Attendance %
          </Label>
          <Input
            id="requiredRecovery"
            type="number"
            min="0"
            max="100"
            placeholder="e.g., 75"
            value={requiredPercentage}
            onChange={(e) => setRequiredPercentage(e.target.value)}
            className="bg-background/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason" className="text-sm font-medium text-foreground">
            Reason for Missing Classes
          </Label>
          <Input
            id="reason"
            placeholder="e.g., Medical leave"
            value={missReason}
            onChange={(e) => setMissReason(e.target.value)}
            className="bg-background/50"
          />
        </div>
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

          <div className={`p-4 rounded-xl border ${
            result.riskLevel === "safe" 
              ? "bg-success/5 border-success/20" 
              : result.riskLevel === "warning"
              ? "bg-warning/5 border-warning/20"
              : "bg-destructive/5 border-destructive/20"
          }`}>
            <div className="flex items-start gap-3">
              <Calendar className={`w-5 h-5 mt-0.5 ${
                result.riskLevel === "safe" 
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
    </div>
  );
};

export default RecoveryPlanner;
