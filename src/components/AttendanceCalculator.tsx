import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, TrendingDown, RotateCcw } from "lucide-react";
import useLocalStorage from "@/hooks/useLocalStorage";

interface AttendanceResult {
  percentage: number;
  status: "safe" | "at-risk" | "not-eligible"; // "not-eligible" corresponds to "Not Recoverable"
  message: string;
  canSkip?: number;
  needToAttend?: number;
  badgeText?: string;
}

const AttendanceCalculator = () => {
  const [data, setData, resetData] = useLocalStorage("attendify_attendance_calc", {
    totalClasses: "",
    attendedClasses: "",
    requiredPercentage: "75",
    result: null as AttendanceResult | null,
  });

  const { totalClasses, attendedClasses, requiredPercentage, result } = data;

  useEffect(() => {
    // 1. Parsing Inputs
    const T = parseInt(totalClasses) || 0; // Total
    const A = parseInt(attendedClasses) || 0; // Attended
    const R = parseFloat(requiredPercentage) || 75; // Required

    // 2. Base Validation (Hard Stops)
    if (T <= 0 && totalClasses !== "") {
      // Wait for input
      if (result !== null) setData((prev) => ({ ...prev, result: null }));
      return;
    }

    if (totalClasses === "" || attendedClasses === "") {
      if (result !== null) setData((prev) => ({ ...prev, result: null }));
      return;
    }

    if (A > T) {
      if (result !== null) setData((prev) => ({ ...prev, result: null }));
      return;
      // Error message handled in render by checking parsing
    }

    // 3. Definitions
    const C = T - A; // Remaining Classes
    const CurrentPercentage = (A / T) * 100;

    let status: AttendanceResult["status"];
    let message: string;
    let canSkip: number | undefined;
    let needToAttend: number | undefined;
    let badgeText: string;

    // 4. Logic Branching
    if (CurrentPercentage >= R) {
      // Case: Safe
      status = "safe";
      badgeText = "Safe";

      // Safe Skips Calculation
      // How many CAN I miss from the Remaining C?
      // Formula: (A + (C - Skips)) / (T + (C - Skips)) ?? No, T is fixed?
      // Wait, prompt says "Semester is a closed system".
      // T is conducted SO FAR? Or COMPLETED SEMESTER?
      // Prompt definitions: "T = Total classes conducted... C = Remaining classes...".
      // Wait. "C = Remaining classes in the semester = T - A".
      // This implies T is the TOTAL SEMESTER CLASSES?
      // "Total classes conducted in the semester". Usually means "So far".
      // BUT "Remaining classes = T - A" means T is the FINAL GOAL.
      // If T was "So far", remaining would be unknown.
      // Therefore T MUST be interpreted as "Total Classes In Semester".

      // Check Safe Skips:
      // (A) / T >= R/100 -> NO.
      // Condition: (A) / T >= R.
      // If I skip S classes, I attend (C - S) more classes.
      // Final Attended = A + (C - S).
      // Final Total = T.
      // (A + C - S) / T >= R / 100
      // A + C - S >= (R * T) / 100
      // S <= A + C - (R * T) / 100
      // Since A + C = T:
      // S <= T - (R * T) / 100
      // S <= T * (1 - R/100)

      // Let's use standard "Keep attending until..." or "Skip constraint"?
      // Usually safe skips means "How many more can I miss?".
      // If I have C remaining, I can attend anywhere from 0 to C of them.
      // To stay safe: (A + (C - S)) / T >= R.
      const maxMissable = Math.floor(T * (1 - R / 100)); // Total misses allowed ever
      const currentMissed = T - A - C; // Wait, T-A is C. So current missed is 0?
      // Be careful with the prompt definition.
      // Prompt: "C = T - A". This implies NO classes have been missed yet, or T includes future.
      // If T=50, A=40. C=10.
      // User has attended 40/50. 10 left.
      // If user attends ALL 10, final = 50/50.
      // If user misses S of the 10: Final = (40 + 10 - S) / 50.
      // (50 - S) / 50 >= R.
      // 50 - S >= 50*R.
      // S <= 50(1-R).
      // Let's stick to this logic.

      const totalWithPerfectFuture = T; // A + C = T
      const maxSkipsAllowed = Math.floor((A + C) - (R * T) / 100);

      canSkip = maxSkipsAllowed;
      if (canSkip < 0) canSkip = 0;

      if (canSkip > 0) {
        message = `You can safely skip ${canSkip} more class${canSkip > 1 ? "es" : ""} and still maintain ${R}%.`;
      } else {
        message = `You are on track, but cannot afford to miss any more classes.`;
      }

    } else {
      // Case: Recovery Needed
      // Solve for X (Additional classes needed)
      // Formula per prompt: X >= (R*T - 100*A) / (100 - R)
      // Wait, prompt formula: (A + X) / (T + X) >= R/100
      // This formula assumes T increases with X.
      // BUT T is defined as "Total classes conducted".
      // AND C = T - A.
      // This implies T is FIXED if C is derived from it?
      // "Never assume future classes beyond T"
      // "The semester is a closed system".
      // IF T IS FIXED, then logic is:
      // (A + X) / T >= R? 
      // NO. The prompt specific formula: "(A + X) / (T + X) >= R / 100".
      // This formula implies defining X as *additional* classes added to the total.
      // BUT the constraint says check X against C (Remaining).
      // If X adds to T, then T grows?
      // Prompt says: "Remaining classes... = T - A".
      // IF T grows, then Remaining should be Fixed?
      // LET'S READ CAREFULLY:
      // "T = Total classes conducted in the semester"
      // "Calculated X... check if X > C".
      // Verification:
      // If Prompt formula is (A+X)/(T+X), it treats T as "Current Total".
      // If Prompt definition says C = T - A, it treats T as "Final Total"?
      // Contradiction?
      // "Never assume future classes beyond T".
      // "Semester is a closed system".
      // This strongly implies T is the FINAL count.
      // If T is final, then the formula for % is (A + X) / T.
      // NOT (A + X) / (T + X).
      // BUT THE PROMPT EXPLICITLY GAVE THE FORMULA: `(A + X) / (T + X) >= R / 100`.
      // This formula is typically for "Roling Total".
      // AND "Rearranged: X >= (R*T - 100*A) / (100 - R)".
      // I MUST USE THE PROMPT'S FORMULA EVEN IF IT SEEMS TO CONTRADICT "CLOSED SYSTEM".
      // WHY? Because the prompt explicitly said "Core Definitions... Must Be Used Exactly".
      // AND "Recovery Calculation Logic (CRITICAL FIX)... Solve (A+X)/(T+X)...".
      // So I will use that formula for X.
      // AND I will use C = T - A.
      // AND I will checks X > C.

      // Wait, if I use that formula, X might be small.
      // Example: 40/50. Req 90%.
      // Formula: (90*50 - 100*40) / (10) = (4500 - 4000) / 10 = 50.
      // Needed = 50.
      // C = 10.
      // 50 > 10 -> Impossible. Correct.

      // Example 2: 40/50. Req 81%.
      // Formula: (81*50 - 4000) / 19 = (4050 - 4000) / 19 = 50/19 = 2.6 -> 3.
      // Need 3.
      // C = 10.
      // 3 <= 10. Possible.
      // Result: 43 / 53 = 81.1%.
      // Wait, if I add 3, Total becomes 53.
      // But C=10 implies max total is 50?
      // Prompt: "Never assume future classes beyond T".
      // This implies T should NOT grow.
      // BUT the formula provided FORCE-GROWS T (`T + X`).
      // IS IT POSSIBLE `T` in the formula refers to "Current Total"?
      // "T = Total classes conducted...". Yes, usually implies current.
      // "C = Remaining... = T - A".
      // If T is current, and A is current. T-A = Missed.
      // "Remaining classes in the semester = T - A".
      // THIS IS THE DEFINITION OF "REMAINING" PROVIDED.
      // "C = Remaining".
      // So "Remaining" actually means "Classes I missed so far".
      // AND "Recovery is IMPOSSIBLE if X > C".
      // Meaning: You can only recover by attending "Missed" classes?
      // I.e. "Retaking" them?
      // This is a very weird definition of "Remaining".
      // USUALLY: C = SemesterTotal - CurrentTotal.
      // BUT PROMPT SAYS: C = T - A.
      // Just purely following the prompt's math:

      // Implementation:
      // 1. Calculate X using prompt formula.
      // 2. Calculate C = T - A.
      // 3. Compare.

      const numer = (R * T) - (100 * A);
      const denom = 100 - R;
      let X = 0;

      if (denom === 0) {
        X = Infinity; // Req 100% and missed one?
      } else {
        X = Math.ceil(numer / denom);
      }

      // Sanity check X positive
      if (X < 0) X = 0;
      needToAttend = X;

      if (X > C) {
        status = "not-eligible";
        badgeText = "Not Recoverable This Semester";
        message = `You would need to attend ${X} more classes to reach ${R}%, but only ${C} classes remain in this semester. Recovery is not possible.`;
      } else {
        status = "at-risk"; // Prompt said "Recovery Possible... Status badge: Recoverable".
        // I'll map "at-risk" to "Recoverable" text in UI to keep TS interface clean or update interface.
        // Interface has "at-risk". I will render text "Recoverable".
        badgeText = "Recoverable";
        message = `You need to attend ${X} more classes to reach ${R}%.`;
      }
    }

    const newResult = {
      percentage: CurrentPercentage,
      status,
      message,
      canSkip,
      needToAttend,
      badgeText
    };

    if (JSON.stringify(result) !== JSON.stringify(newResult)) {
      setData((prev) => ({ ...prev, result: newResult }));
    }
  }, [totalClasses, attendedClasses, requiredPercentage, result, setData]);

  const updateField = (field: keyof typeof data, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

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
      case "at-risk": // Recoverable
        return "bg-warning/10 border-warning/20 text-warning";
      case "not-eligible": // Impossible
        return "bg-destructive/10 border-destructive/20 text-destructive";
    }
  };

  return (
    <div className="glass-strong rounded-2xl p-6 md:p-8 animate-fade-in relative group">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold font-display text-foreground">
            Attendance Calculator
          </h2>
          <p className="text-xs text-muted-foreground mt-1 font-medium bg-secondary/50 px-2 py-0.5 rounded-md w-fit">
            For school students
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={resetData}
          className="text-muted-foreground hover:text-foreground opacity-50 group-hover:opacity-100 transition-opacity"
          title="Reset Calculator"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

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
            onChange={(e) => updateField("totalClasses", e.target.value)}
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
            onChange={(e) => updateField("attendedClasses", e.target.value)}
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
            onChange={(e) => updateField("requiredPercentage", e.target.value)}
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
              <span className="font-semibold">{result.badgeText}</span>
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
        </div>
      )}

      {!result && totalClasses && attendedClasses && parseInt(attendedClasses) > parseInt(totalClasses) && (
        <p className="text-destructive font-bold text-center py-4">
          Classes attended cannot exceed total classes.
        </p>
      )}
      {!result && totalClasses && parseInt(totalClasses) === 0 && (
        <p className="text-destructive font-bold text-center py-4">
          Total classes must be greater than zero.
        </p>
      )}
    </div>
  );
};

export default AttendanceCalculator;
