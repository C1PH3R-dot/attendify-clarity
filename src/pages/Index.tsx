import { useState } from "react";
import Header from "@/components/Header";
import ToolSelector from "@/components/ToolSelector";
import AttendanceCalculator from "@/components/AttendanceCalculator";
import RecoveryPlanner from "@/components/RecoveryPlanner";
import CGPACalculator from "@/components/CGPACalculator";
import Footer from "@/components/Footer";

type Tool = "attendance" | "recovery" | "cgpa";

const Index = () => {
  const [activeTool, setActiveTool] = useState<Tool>("attendance");

  return (
    <div className="min-h-screen">
      <div className="container max-w-4xl py-6 md:py-10">
        <Header />
        <ToolSelector activeTool={activeTool} onToolChange={setActiveTool} />
        
        <main>
          {activeTool === "attendance" && <AttendanceCalculator />}
          {activeTool === "recovery" && <RecoveryPlanner />}
          {activeTool === "cgpa" && <CGPACalculator />}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Index;
