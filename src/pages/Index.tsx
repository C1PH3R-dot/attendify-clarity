import { useState } from "react";
import Header from "@/components/Header";
import ToolSelector from "@/components/ToolSelector";
import AttendanceCalculator from "@/components/AttendanceCalculator";
import AttendancePlanner from "@/components/AttendancePlanner";
import MarksCalculator from "@/components/MarksCalculator";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";

type Tool = "attendance" | "planner" | "marks";

const Index = () => {
  const [activeTool, setActiveTool] = useState<Tool>("attendance");

  return (
    <div className="min-h-screen">
      <div className="container max-w-4xl py-6 md:py-10">
        <Header />
        <ToolSelector activeTool={activeTool} onToolChange={setActiveTool} />
        
        <main>
          {activeTool === "attendance" && <AttendanceCalculator />}
          {activeTool === "planner" && <AttendancePlanner />}
          {activeTool === "marks" && <MarksCalculator />}
        </main>

        <Footer />
      </div>
      
      <Chatbot />
    </div>
  );
};

export default Index;
