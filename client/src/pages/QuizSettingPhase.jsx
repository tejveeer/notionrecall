import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";

export default function QuizSettingPhase() {
  const [quizType, setQuizType] = useState("multiple-choice");
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [freestyle, setFreestyle] = useState(false);

  const quizTypes = [
    { value: "multiple-choice", label: "Multiple Choice" },
    { value: "true-false", label: "True/False" },
    { value: "fill-blank", label: "Fill in the Blank" },
  ];

  const handleNumberChange = (increment) => {
    setNumberOfQuestions((prev) => {
      const newValue = prev + increment;
      return Math.min(Math.max(newValue, 5), 10);
    });
  };

  return (
    <div className="bg-amber-500/10 backdrop-blur-md border border-amber-400/30 rounded-2xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-amber-100 mb-4 sm:mb-6">
        Quiz Settings
      </h2>

      <div className="space-y-6">
        {/* Quiz Type Selection */}
        <div>
          <label className="block text-amber-200 font-medium mb-3">
            Quiz Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quizTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setQuizType(type.value)}
                className={`p-3 rounded-lg border transition-all duration-200 text-sm font-medium ${
                  quizType === type.value
                    ? "bg-amber-400/20 border-amber-300/50 text-amber-100"
                    : "bg-amber-500/5 border-amber-400/20 text-amber-200/70 hover:bg-amber-400/10 hover:border-amber-300/30"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Number of Questions */}
        <div>
          <label className="block text-amber-200 font-medium mb-3">
            Number of Questions
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleNumberChange(-1)}
              disabled={numberOfQuestions <= 5}
              className={`w-10 h-10 rounded-lg border transition-all duration-200 font-bold ${
                numberOfQuestions <= 5
                  ? "bg-amber-500/5 border-amber-400/20 text-amber-200/30 cursor-not-allowed"
                  : "bg-amber-400/10 border-amber-300/30 text-amber-200 hover:bg-amber-400/20 hover:border-amber-300/50"
              }`}
            >
              −
            </button>

            <div className="bg-amber-400/10 border border-amber-300/30 rounded-lg px-4 py-2 min-w-[60px] text-center">
              <span className="text-amber-100 font-semibold text-lg">
                {numberOfQuestions}
              </span>
            </div>

            <button
              onClick={() => handleNumberChange(1)}
              disabled={numberOfQuestions >= 10}
              className={`w-10 h-10 rounded-lg border transition-all duration-200 font-bold ${
                numberOfQuestions >= 10
                  ? "bg-amber-500/5 border-amber-400/20 text-amber-200/30 cursor-not-allowed"
                  : "bg-amber-400/10 border-amber-300/30 text-amber-200 hover:bg-amber-400/20 hover:border-amber-300/50"
              }`}
            >
              +
            </button>

            <span className="text-amber-200/70 text-sm ml-2">
              (5-10 questions)
            </span>
          </div>
        </div>

        {/* Freestyle Option */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={freestyle}
              onCheckedChange={setFreestyle}
              className="rounded border-amber-300/30 data-[state=checked]:bg-amber-400/20 data-[state=checked]:border-amber-300/50"
            />
            <div>
              <span className="text-amber-200 font-medium">Freestyle Mode</span>
              <p className="text-amber-200/60 text-sm mt-1">
                Allow open-ended questions and creative responses
              </p>
            </div>
          </label>
        </div>

        {/* Settings Summary */}
        <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4 mt-6">
          <h3 className="text-amber-200 font-medium mb-2">Quiz Preview</h3>
          <div className="space-y-1 text-sm">
            <p className="text-amber-200/80">
              <span className="font-medium">Type:</span>{" "}
              {quizTypes.find((t) => t.value === quizType)?.label}
            </p>
            <p className="text-amber-200/80">
              <span className="font-medium">Questions:</span>{" "}
              {numberOfQuestions}
            </p>
            <p className="text-amber-200/80">
              <span className="font-medium">Freestyle:</span>{" "}
              {freestyle ? "Enabled" : "Disabled"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
