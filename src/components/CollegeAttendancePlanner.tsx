import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Shield, AlertTriangle, AlertOctagon, Info, Clock, CheckCircle2 } from "lucide-react";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type DurationMode = "hours" | "minutes" | "both";

interface Subject {
    id: string;
    name: string;
    totalClasses: string;
    attendedClasses: string;
    requiredPercentage: string;
    durationMode: DurationMode;
    durationHours: string;
    durationMinutes: string;
    credits: string;
    reductionPercentage: string;
}

interface CalculationResult {
    currentPercentage: number;
    safeSkips: number;
    classesToAttend: number;
    riskLevel: "safe" | "caution" | "critical";
    message: string;
    isValid: boolean;
    showResults: boolean;
    error?: string;
    badgeText?: string;

    totalInstructionalHours: number;
    impactPerMiss: number;
    isReductionOverride: boolean;
}

const CollegeAttendancePlanner = () => {
    const [subjects, setSubjects] = useLocalStorage<Subject[]>("attendify_college_subjects", []);

    useEffect(() => {
        if (subjects.length === 0) {
            addSubject();
        }
    }, []);

    const addSubject = () => {
        const newSubject: Subject = {
            id: crypto.randomUUID(),
            name: "",
            totalClasses: "",
            attendedClasses: "",
            requiredPercentage: "75",
            durationMode: "minutes",
            durationHours: "0",
            durationMinutes: "60",
            credits: "4",
            reductionPercentage: "",
        };
        setSubjects([...subjects, newSubject]);
    };

    const removeSubject = (id: string) => {
        setSubjects(subjects.filter((s) => s.id !== id));
    };

    const updateSubject = (id: string, field: keyof Subject, value: any) => {
        setSubjects(
            subjects.map((s) => (s.id === id ? { ...s, [field]: value } : s))
        );
    };

    // STRICT BUG FIX LOGIC APPLIED HERE
    const calculateSubjectStatus = (subject: Subject): CalculationResult => {
        const T = parseFloat(subject.totalClasses);
        const A = parseFloat(subject.attendedClasses);
        const R = parseFloat(subject.requiredPercentage);
        const credits = parseFloat(subject.credits);
        const reductionInput = parseFloat(subject.reductionPercentage);

        const durHrs = parseFloat(subject.durationHours) || 0;
        const durMins = parseFloat(subject.durationMinutes) || 0;

        let singleClassHours = 0;
        if (subject.durationMode === 'hours') singleClassHours = durHrs;
        else if (subject.durationMode === 'minutes') singleClassHours = durMins / 60;
        else singleClassHours = durHrs + (durMins / 60);

        // --- VALIDATION ---
        const isDurationValid = singleClassHours > 0;
        const isCreditsValid = !isNaN(credits) && credits > 0;
        const isTotalValid = !isNaN(T) && T > 0;
        const isAttendedValid = !isNaN(A) && A >= 0;
        const isRequiredValid = !isNaN(R) && R >= 0;

        const emptyResult: CalculationResult = {
            currentPercentage: 0,
            safeSkips: 0,
            classesToAttend: 0,
            riskLevel: "safe",
            message: "",
            isValid: false,
            showResults: false,
            totalInstructionalHours: 0,
            impactPerMiss: 0,
            isReductionOverride: false,
            badgeText: ""
        };

        if (!isDurationValid || !isCreditsValid || !isTotalValid || !isAttendedValid || !isRequiredValid) {
            return emptyResult;
        }

        if (A > T) {
            return {
                ...emptyResult,
                isValid: false,
                showResults: true,
                error: "Classes attended cannot exceed total classes.",
                riskLevel: "critical"
            };
        }

        // --- MATH DEFINITIONS ---
        // C = Remaining classes
        const C = T - A;

        const currentPercentage = (A / T) * 100;
        const totalInstructionalHours = T * singleClassHours;

        let impactPerMiss = 0;
        let isReductionOverride = false;

        if (!isNaN(reductionInput) && reductionInput > 0) {
            impactPerMiss = reductionInput;
            isReductionOverride = true;
        } else {
            // Dynamic: Current - (A / (T+1))
            const nextTotal = T + 1;
            const nextPercentage = (A / nextTotal) * 100;
            impactPerMiss = currentPercentage - nextPercentage;
            if (currentPercentage === 0) impactPerMiss = 0;
        }

        let safeSkips = 0;
        let classesToAttend = 0;
        let riskLevel: "safe" | "caution" | "critical" = "safe";
        let message = "";
        let badgeText = "";

        if (currentPercentage >= R) {
            // Safe Case
            riskLevel = "safe";
            badgeText = "Safe";

            if (isReductionOverride) {
                safeSkips = Math.floor((currentPercentage - R) / reductionInput);
            } else {
                // Standard Safe Skips based on "Constraint C" implies?
                // Prompt didn't specify Safe Skips logic, only Recovery.
                // Assuming standard logic is acceptable for Safe state with C - S.
                // (A + C - S) / T >= R
                // S <= A + C - R*T/100
                safeSkips = Math.floor((A + C) - (R * T) / 100);
            }
            if (safeSkips < 0) safeSkips = 0;
            const unit = safeSkips === 1 ? 'class' : 'classes';
            message = `You can safely skip ${safeSkips} ${unit} and stay above ${R}%.`;

        } else {
            // Recovery Case
            // X Formula: (R*T - 100*A) / (100 - R)
            const numer = (R * T) - (100 * A);
            const denom = 100 - R;
            let X = 0;

            if (denom <= 0) X = Infinity;
            else X = Math.ceil(numer / denom);

            if (X < 0) X = 0;

            classesToAttend = X;

            // CHECK CONSTRAINT
            if (X > C) {
                // Impossible
                riskLevel = "critical";
                badgeText = "Not Recoverable This Semester";
                message = `You would need to attend ${X} more classes to reach ${R}%, but only ${C} classes remain in this semester. Recovery is not possible.`;
            } else {
                // Possible
                riskLevel = "caution";
                badgeText = "Recoverable";
                const unit = X === 1 ? 'class' : 'classes';
                message = `You need to attend ${X} more classes to reach ${R}%.`;
            }
        }

        return {
            currentPercentage,
            safeSkips,
            classesToAttend,
            riskLevel,
            message,
            isValid: true,
            showResults: true,
            totalInstructionalHours,
            impactPerMiss,
            isReductionOverride,
            badgeText
        };
    };

    const overallStats = useMemo(() => {
        let totalWeightedPercentage = 0;
        let totalCredits = 0;
        let validSubjectsCount = 0;

        subjects.forEach(sub => {
            const stats = calculateSubjectStatus(sub);
            if (stats.showResults && stats.isValid && !isNaN(parseFloat(sub.credits))) {
                const cred = parseFloat(sub.credits);
                if (cred > 0) {
                    totalWeightedPercentage += stats.currentPercentage * cred;
                    totalCredits += cred;
                    validSubjectsCount++;
                }
            }
        });

        if (totalCredits === 0) return null;
        return {
            percentage: (totalWeightedPercentage / totalCredits).toFixed(2),
            totalCredits
        };
    }, [subjects]);

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="glass-strong rounded-2xl p-6 md:p-8 relative">
                <div className="mb-6 flex flex-col md:flex-row justify-between md:items-end gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">For College Students</span>
                        </div>
                        <h2 className="text-2xl font-bold font-display text-foreground">Attendance Plan</h2>
                        <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
                            Plan subject-wise attendance with strictly validated recovery logic.
                        </p>
                    </div>
                    {overallStats && (
                        <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 px-5 text-right min-w-[150px] animate-fade-in">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Overall (Weighted)</p>
                            <p className="text-2xl font-bold text-primary">{overallStats.percentage}%</p>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {subjects.map((subject, index) => {
                        const result = calculateSubjectStatus(subject);

                        return (
                            <div key={subject.id} className="glass rounded-xl p-6 border border-white/20 shadow-sm relative group transition-all hover:shadow-md">
                                {subjects.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-4 right-4 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        onClick={() => removeSubject(subject.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}

                                <div className="grid gap-6">
                                    {/* Subject Name Header */}
                                    <div>
                                        <Label htmlFor={`subject-${subject.id}`} className="sr-only">Subject Name</Label>
                                        <Input
                                            id={`subject-${subject.id}`}
                                            value={subject.name}
                                            onChange={(e) => updateSubject(subject.id, "name", e.target.value)}
                                            placeholder={`Subject ${index + 1} Name`}
                                            className="text-lg font-semibold bg-transparent border-0 border-b border-border/50 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50 h-auto py-2 w-full max-w-md"
                                        />
                                    </div>

                                    {/* Main Metrics: Total, Attended, Required */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Conducted *</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={subject.totalClasses}
                                                onChange={(e) => updateSubject(subject.id, "totalClasses", e.target.value)}
                                                className="bg-white/50 border-white/20"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="space-y-2 relative">
                                            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Classes Attended *</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={subject.attendedClasses}
                                                onChange={(e) => updateSubject(subject.id, "attendedClasses", e.target.value)}
                                                className={`bg-white/50 border-white/20 ${result.error ? "border-destructive/50 ring-2 ring-destructive/10" : ""}`}
                                                placeholder="0"
                                            />
                                            {result.error && (
                                                <div className="absolute -bottom-6 left-0 text-[11px] text-destructive font-bold flex items-center gap-1 animate-slide-in-up bg-destructive/10 px-2 py-0.5 rounded-md">
                                                    <AlertTriangle className="w-3 h-3" /> {result.error}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Required % *</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={subject.requiredPercentage}
                                                onChange={(e) => updateSubject(subject.id, "requiredPercentage", e.target.value)}
                                                className="bg-white/50 border-white/20"
                                                placeholder="75"
                                            />
                                        </div>
                                    </div>

                                    {/* Secondary Metrics */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
                                        <div className="p-4 rounded-xl bg-secondary/20 border border-white/10 flex flex-col justify-between group/duration">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                                                    <Clock className="w-4 h-4" />
                                                    Class Duration *
                                                </div>
                                                <div className="flex bg-white/20 rounded-lg p-1 gap-1">
                                                    {(['hours', 'minutes', 'both'] as DurationMode[]).map((mode) => (
                                                        <button
                                                            key={mode}
                                                            onClick={() => updateSubject(subject.id, "durationMode", mode)}
                                                            className={`text-[10px] px-2 py-1 rounded-md uppercase font-bold tracking-wider transition-all ${subject.durationMode === mode
                                                                    ? 'bg-white shadow-sm text-primary'
                                                                    : 'hover:bg-white/10 text-muted-foreground'
                                                                }`}
                                                        >
                                                            {mode}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                {(subject.durationMode === "hours" || subject.durationMode === "both") && (
                                                    <div className="flex-1 space-y-1 animate-fade-in">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            placeholder="0"
                                                            value={subject.durationHours}
                                                            onChange={(e) => updateSubject(subject.id, "durationHours", e.target.value)}
                                                            className="bg-white/60 h-9 transition-all focus:bg-white"
                                                        />
                                                        <span className="text-[10px] text-muted-foreground ml-1">Hours</span>
                                                    </div>
                                                )}
                                                {(subject.durationMode === "minutes" || subject.durationMode === "both") && (
                                                    <div className="flex-1 space-y-1 animate-fade-in">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="59"
                                                            placeholder="0"
                                                            value={subject.durationMinutes}
                                                            onChange={(e) => updateSubject(subject.id, "durationMinutes", e.target.value)}
                                                            className="bg-white/60 h-9 transition-all focus:bg-white"
                                                        />
                                                        <span className="text-[10px] text-muted-foreground ml-1">Minutes</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl bg-secondary/20 border border-white/10 grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-medium text-foreground/70">Subject Credits *</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={subject.credits}
                                                    onChange={(e) => updateSubject(subject.id, "credits", e.target.value)}
                                                    className="bg-white/60 h-9"
                                                    placeholder="e.g. 4"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Label className="text-xs font-medium text-foreground/70 truncate">Reduction %</Label>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Info className="w-3 h-3 text-muted-foreground" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="max-w-[200px] text-xs">Optional: Explicit percentage drop if ONE class is missed. Defaults to standard math.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={subject.reductionPercentage}
                                                    onChange={(e) => updateSubject(subject.id, "reductionPercentage", e.target.value)}
                                                    className={`bg-white/60 h-9 ${result.isReductionOverride ? 'border-primary/30 ring-1 ring-primary/10' : ''}`}
                                                    placeholder="Auto"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* RESULTS AREA */}
                                    {result.showResults && result.isValid ? (
                                        <div className="animate-fade-in space-y-4">
                                            <div className="grid grid-cols-2 gap-4 text-xs font-medium text-muted-foreground opacity-80 pl-1">
                                                <div>
                                                    Total Hours: <span className="text-foreground">{result.totalInstructionalHours.toFixed(1)}h</span>
                                                </div>
                                                <div className="text-right">
                                                    Impact of Next Miss: <span className="text-destructive">-{result.impactPerMiss.toFixed(2)}%</span>
                                                    {result.isReductionOverride && <span className="text-[10px] ml-1 bg-primary/10 px-1 rounded text-primary">Fixed</span>}
                                                </div>
                                            </div>

                                            <div className={`p-4 rounded-xl border flex items-start gap-4 transition-all duration-300 ${result.riskLevel === 'safe' ? 'bg-success/5 border-success/20' :
                                                    result.riskLevel === 'caution' ? 'bg-warning/5 border-warning/20' :
                                                        'bg-destructive/5 border-destructive/20'
                                                }`}>
                                                <div className="mt-1 shadow-sm rounded-full bg-white/50 p-1">
                                                    {result.riskLevel === 'safe' && <Shield className="w-5 h-5 text-success" />}
                                                    {result.riskLevel === 'caution' && <AlertTriangle className="w-5 h-5 text-warning" />}
                                                    {result.riskLevel === 'critical' && <AlertOctagon className="w-5 h-5 text-destructive" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-bold text-2xl font-display tracking-tight">
                                                            {result.currentPercentage.toFixed(2)}%
                                                        </h4>
                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm ${result.riskLevel === 'safe' ? 'bg-success/20 text-success-foreground' :
                                                                result.riskLevel === 'caution' ? 'bg-warning/20 text-warning-foreground' :
                                                                    'bg-destructive/20 text-destructive-foreground'
                                                            }`}>
                                                            {result.badgeText}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-foreground/90 font-medium leading-relaxed">
                                                        {result.message}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        !result.error && (
                                            <div className="py-4 text-center text-sm text-muted-foreground/60 italic border-t border-dashed border-white/20 mt-2">
                                                Fill all mandatory fields (*) to view analysis.
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 flex justify-center">
                    <Button
                        onClick={addSubject}
                        variant="outline"
                        className="w-full md:w-auto border-dashed border-2 py-6 px-8 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all hover:shadow-md"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add Another Subject
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CollegeAttendancePlanner;