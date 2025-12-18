import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, TrendingDown } from "lucide-react";

interface AttendanceResult {
  percentage: number;
  status: "safe" | "at-risk" | "not-eligible";
  message: string;
  canSkip?: number;
  needToAttend?: number;
}

const AttendanceCalculator = () => {
  const [totalClasses, setTotalClasses] = useState<string>("");
  const [attendedClasses, setAttendedClasses] = useState<string>("");
  const [requiredPercentage, setRequiredPercentage] = useState<string>("75");
  const [result, setResult] = useState<AttendanceResult | null>(null);

  useEffect(() => {
    const total = parseInt(totalClasses) || 0;
    const attended = parseInt(attendedClasses) || 0;
    const required = parseFloat(requiredPercentage) || 75;

    if (total <= 0 || attended < 0) {
      setResult(null);
      return;
    }

    if (attended > total) {
      setResult(null);
      return;
    }

    const percentage = (attended / total) * 100;
    const requiredClasses = Math.ceil((required * total) / 100);

    let status: AttendanceResult["status"];
    let message: string;
    let canSkip: number | undefined;
    let needToAttend: number | undefined;

    if (percentage >= required) {
      status = "safe";
      // Calculate how many more classes can be skipped
      // (attended) / (total + x) >= required/100
      // attended * 100 >= required * (total + x)
      // attended * 100 / required >= total + x
      // x <= (attended * 100 / required) - total
      const maxTotal = Math.floor((attended * 100) / required);
      canSkip = maxTotal - total;
      
      if (canSkip > 0) {
        message = `You can safely skip up to ${canSkip} more class${canSkip > 1 ? "es" : ""} while maintaining ${required}% attendance.`;
      } else {
        message = `You're at exactly ${required}% attendance. Don't skip any more classes.`;
      }
    } else if (percentage >= required - 10) {
      status = "at-risk";
      // Calculate classes needed to recover
      // (attended + x) / (total + x) >= required/100
      // (attended + x) * 100 >= required * (total + x)
      // 100*attended + 100*x >= required*total + required*x
      // 100*x - required*x >= required*total - 100*attended
      // x * (100 - required) >= required*total - 100*attended
      // x >= (required*total - 100*attended) / (100 - required)
      needToAttend = Math.ceil((required * total - 100 * attended) / (100 - required));
      
      if (needToAttend > 0 && needToAttend < 1000) {
        message = `You need to attend ${needToAttend} consecutive class${needToAttend > 1 ? "es" : ""} without missing any to reach ${required}% attendance.`;
      } else {
        message = `Recovery is possible but requires consistent attendance.`;
      }
    } else {
      status = "not-eligible";
      needToAttend = Math.ceil((required * total - 100 * attended) / (100 - required));
      
      if (needToAttend > 0 && needToAttend < 1000) {
        message = `You need to attend ${needToAttend} consecutive classes to reach ${required}%. This may not be achievable this semester.`;
      } else {
        message = `Recovery to ${required}% attendance is mathematically not achievable. Consider speaking with your academic advisor.`;
      }
    }

    setResult({
      percentage,
      status,
      message,
      canSkip,
      needToAttend,
    });
  }, [totalClasses, attendedClasses, requiredPercentage]);

  const getStatusIcon = () => {
    if (!result) return null;
    switch (result.status) {
      case "safe":
        return <CheckCircle2 className="w-6 h-6 text-success" />;
      case "at-risk":
        return <AlertTriangle className="w-6 h-6 text-warning" />;
      case "not-eligible":
        return <XCircle className="w-6 h-6 text-destructive" />;
    }
  };

  const getStatusColor = () => {
    if (!result) return "";
    switch (result.status) {
      case "safe":
        return "bg-success/10 border-success/20 text-success";
      case "at-risk":
        return "bg-warning/10 border-warning/20 text-warning";
      case "not-eligible":
        return "bg-destructive/10 border-destructive/20 text-destructive";
    }
  };

  const getStatusLabel = () => {
    if (!result) return "";
    switch (result.status) {
      case "safe":
        return "Safe";
      case "at-risk":
        return "At Risk";
      case "not-eligible":
        return "Not Eligible";
    }
  };

  return (
    <div className="glass-strong rounded-2xl p-6 md:p-8 animate-fade-in">
      <h2 className="text-xl font-semibold font-display mb-6 text-foreground">
        Attendance Calculator
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="space-y-2">
          <Label htmlFor="total" className="text-sm font-medium text-foreground">
            Total Classes Conducted
          </Label>
          <Input
            id="total"
            type="number"
            min="0"
            placeholder="e.g., 50"
            value={totalClasses}
            onChange={(e) => setTotalClasses(e.target.value)}
            className="bg-background/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="attended" className="text-sm font-medium text-foreground">
            Classes Attended
          </Label>
          <Input
            id="attended"
            type="number"
            min="0"
            placeholder="e.g., 40"
            value={attendedClasses}
            onChange={(e) => setAttendedClasses(e.target.value)}
            className="bg-background/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="required" className="text-sm font-medium text-foreground">
            Required Attendance %
          </Label>
          <Input
            id="required"
            type="number"
            min="0"
            max="100"
            placeholder="e.g., 75"
            value={requiredPercentage}
            onChange={(e) => setRequiredPercentage(e.target.value)}
            className="bg-background/50"
          />
        </div>
      </div>

      {result && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm text-muted-foreground mb-1">Current Attendance</p>
              <p className="text-4xl font-bold font-display text-foreground">
                {result.percentage.toFixed(2)}%
              </p>
            </div>

            <div className={`px-4 py-2 rounded-full border flex items-center gap-2 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="font-semibold">{getStatusLabel()}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-start gap-3">
              {result.status === "safe" ? (
                <TrendingUp className="w-5 h-5 text-success mt-0.5" />
              ) : (
                <TrendingDown className="w-5 h-5 text-destructive mt-0.5" />
              )}
              <p className="text-foreground leading-relaxed">{result.message}</p>
            </div>
          </div>

          {result.canSkip !== undefined && result.canSkip > 0 && (
            <div className="p-4 rounded-xl bg-success/5 border border-success/20">
              <p className="text-sm text-success font-medium">
                Maximum skippable classes: <span className="text-lg">{result.canSkip}</span>
              </p>
            </div>
          )}

          {result.needToAttend !== undefined && result.needToAttend > 0 && result.needToAttend < 1000 && (
            <div className={`p-4 rounded-xl ${result.status === "not-eligible" ? "bg-destructive/5 border border-destructive/20" : "bg-warning/5 border border-warning/20"}`}>
              <p className={`text-sm font-medium ${result.status === "not-eligible" ? "text-destructive" : "text-warning"}`}>
                Classes needed for recovery: <span className="text-lg">{result.needToAttend}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {!result && totalClasses && attendedClasses && (
        <p className="text-muted-foreground text-center py-4">
          Please enter valid numbers. Attended classes cannot exceed total classes.
        </p>
      )}
    </div>
  );
};

export default AttendanceCalculator;
