import { useState } from "react";
import SearchPhase from "./SearchPhase";
import SelectionPhase from "./SelectionPhase";
import QuizSettingPhase from "./QuizSettingPhase";
import Navbar from "../components/Navbar";
import Quiz from "./QuizPhase";

export default function Home() {
  const [headings, setHeadings] = useState(null);
  const [maxPhase, setMaxPhase] = useState(0);
  const [phase, setPhase] = useState(0);
  const [headingSelections, setHeadingSelections] = useState({
    selections: new Set(),
    deselections: new Set(),
  });

  // This stores the quiz questions and the question type
  const [quizData, setQuizData] = useState(null);

  const nextPhase = (phaseValue) => {
    setMaxPhase(prev => prev + 1);
    setPhase(phaseValue);
  };

  const resetPhase = (phaseValue) => {
    setPhase(phaseValue);
    setMaxPhase(phaseValue);
  };

  const getCurrentPhase = () => {
    if (phase == 0) {
      return (
        <SearchPhase
          setHeadings={setHeadings}
          setHeadingSelections={setHeadingSelections}
          nextPhase={nextPhase}
          resetPhase={resetPhase}
        />
      );
    } else if (phase == 1) {
      return (
        <SelectionPhase
          headings={headings}
          headingSelections={headingSelections}
          setHeadingSelections={setHeadingSelections}
          nextPhase={nextPhase}
          resetPhase={resetPhase}
        />
      );
    } else if (phase == 2) {
      return <QuizSettingPhase nextPhase={nextPhase} setQuizData={setQuizData} />;
    } else if (phase == 3) {
      console.log("Quiz Data:", quizData);
      return <Quiz questions={quizData.questions} quizType={quizData.quizType} resetPhase={resetPhase} />;
    }
  };

  console.log(phase, maxPhase);
  return (
    <div className="flex justify-center items-center min-h-screen w-full px-4">
      <div className="max-w-2xl w-full">
        <div className="grid grid-rows-[3rem_1fr_3rem] min-h-screen gap-6 py-4">
          {/* Navbar */}
          <div className="pt-1">
            <Navbar />
          </div>

          {/* Main Content */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-full">{getCurrentPhase()}</div>
          </div>

          {/* Phase Navigation */}
          <div className="pb-1 grid grid-cols-2 gap-4">
            {phase - 1 >= 0 && <button
              onClick={() => setPhase((prev) => Math.max(prev - 1, 0))}
              className="bg-blue-500/20 col-start-1 backdrop-blur-md border border-blue-400/30 rounded-lg px-4 py-3 cursor-pointer hover:bg-blue-500/30 hover:border-blue-400/50 transition-all duration-200 text-blue-200 font-semibold text-sm text-center"
            >
              ← Previous
            </button>}

            {phase + 1 <= maxPhase && <button
              onClick={() => setPhase((prev) => prev + 1)}
              className="bg-blue-500/20 col-start-2 backdrop-blur-md border border-blue-400/30 rounded-lg px-4 py-3 cursor-pointer hover:bg-blue-500/30 hover:border-blue-400/50 transition-all duration-200 text-blue-200 font-semibold text-sm text-center"
            >
              Next →
            </button>}
          </div>
        </div>
      </div>
    </div>
  );
}