import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function QuizView() {
  const [searchParams] = useSearchParams();
  const quizId = searchParams.get("quizId");

  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) {
        setError("No quiz ID provided");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3000/get-quiz?quizId=${quizId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const data = await response.json();

        if (response.ok && data.success) {
          setQuizData(data.quiz);
        } else {
          setError("Failed to fetch quiz");
        }
      } catch (err) {
        console.error("Error fetching quiz:", err);
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen w-full px-4">
        <div className="max-w-4xl w-full">
          <div className="grid grid-rows-[3rem_1fr] min-h-screen gap-6 py-4">
            <div className="pt-1 flex justify-center">
              <div className="max-w-2xl w-full">
                <Navbar />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="bg-yellow-500/10 backdrop-blur-md border border-yellow-400/20 rounded-2xl p-8 text-center">
                <div className="inline-flex items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                  <span className="text-yellow-200/80 text-lg">
                    Loading quiz...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen w-full px-4">
        <div className="max-w-4xl w-full">
          <div className="grid grid-rows-[3rem_1fr] min-h-screen gap-6 py-4">
            <div className="pt-1 flex justify-center">
              <div className="max-w-2xl w-full">
                <Navbar />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="bg-red-500/10 backdrop-blur-md border border-red-400/20 rounded-2xl p-8 text-center">
                <p className="text-red-300">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen w-full px-4">
      <div className="max-w-2xl w-full">
        <div className="grid grid-rows-[3rem_1fr] min-h-screen gap-6 py-4">
          <div className="pt-1">
            <Navbar />
          </div>
          <div className="flex flex-col">
            <div>
              <h1 className="text-2xl font-bold text-yellow-100 mb-6">
                Quiz Review
              </h1>

              <div className="space-y-6">
                {quizData &&
                  quizData.questions &&
                  quizData.questions.map((question, index) => {
                    const userAnswer = quizData.user_answers[index];

                    return (
                      <div
                        key={index}
                        className="bg-blue-500/10 backdrop-blur-md border border-blue-400/20 rounded-lg p-6"
                      >
                        <div className="mb-4">
                          <span className="text-blue-200/70 text-sm">
                            Question {index + 1}
                          </span>
                        </div>

                        {quizData.quiz_type === "mc" && (
                          <MCQuestionView
                            question={question}
                            userAnswer={userAnswer}
                          />
                        )}
                        {quizData.quiz_type === "tf" && (
                          <TFQuestionView
                            question={question}
                            userAnswer={userAnswer}
                          />
                        )}
                        {quizData.quiz_type === "fib" && (
                          <FIBQuestionView
                            question={question}
                            userAnswer={userAnswer}
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Multiple Choice Question View Component
function MCQuestionView({ question, userAnswer }) {
  const isCorrect = userAnswer === question.answer;

  return (
    <div>
      <h3 className="text-lg font-medium text-white mb-4">
        {question.question}
      </h3>

      <div className="space-y-3">
        {question.options.map((option, index) => {
          let className = "w-full p-4 text-left rounded-lg border ";

          if (option === question.answer) {
            className += "bg-green-500/20 border-green-400/50 text-green-100";
          } else if (option === userAnswer && !isCorrect) {
            className += "bg-red-500/20 border-red-400/50 text-red-100";
          } else {
            className += "bg-blue-500/5 border-blue-400/20 text-blue-200/70";
          }

          return (
            <div key={index} className={className}>
              <div className="flex justify-between items-center">
                <span>{option}</span>
                {option === question.answer && (
                  <span className="text-green-300 text-sm">✓ Correct</span>
                )}
                {option === userAnswer && !isCorrect && (
                  <span className="text-red-300 text-sm">✗ Your Answer</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-sm">
        <span
          className={`font-medium ${isCorrect ? "text-green-300" : "text-red-300"}`}
        >
          {isCorrect ? "✓ Correct" : "✗ Incorrect"}
        </span>
        {!isCorrect && (
          <span className="text-blue-200/70 ml-4">
            Your answer: {userAnswer}
          </span>
        )}
      </div>
    </div>
  );
}

// True/False Question View Component
function TFQuestionView({ question, userAnswer }) {
  const isCorrect = userAnswer === question.answer;
  const options = ["True", "False"];

  return (
    <div>
      <h3 className="text-lg font-medium text-white mb-4">
        {question.question}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {options.map((option) => {
          let className = "p-4 rounded-lg border font-medium ";

          if (option === question.answer) {
            className += "bg-green-500/20 border-green-400/50 text-green-100";
          } else if (option === userAnswer && !isCorrect) {
            className += "bg-red-500/20 border-red-400/50 text-red-100";
          } else {
            className += "bg-blue-500/5 border-blue-400/20 text-blue-200/70";
          }

          return (
            <div key={option} className={className}>
              <div className="flex justify-between items-center">
                <span>{option}</span>
                {option === question.answer && (
                  <span className="text-green-300 text-sm">✓</span>
                )}
                {option === userAnswer && !isCorrect && (
                  <span className="text-red-300 text-sm">✗</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-sm">
        <span
          className={`font-medium ${isCorrect ? "text-green-300" : "text-red-300"}`}
        >
          {isCorrect ? "✓ Correct" : "✗ Incorrect"}
        </span>
        {!isCorrect && (
          <span className="text-blue-200/70 ml-4">
            Your answer: {userAnswer}
          </span>
        )}
      </div>
    </div>
  );
}

// Fill in the Blank Question View Component
function FIBQuestionView({ question, userAnswer }) {
  const parts = question.question.split("_____");
  const isCorrect =
    JSON.stringify(userAnswer) === JSON.stringify(question.answers);

  return (
    <div>
      <div className="mb-4">
        <div className="text-white text-lg leading-relaxed">
          {parts.map((part, index) => (
            <span key={index}>
              {part}
              {index < parts.length - 1 && (
                <span
                  className={`mx-2 px-3 py-2 rounded-lg border inline-block ${
                    userAnswer[index] === question.answers[index]
                      ? "bg-green-500/20 border-green-400/50 text-green-100"
                      : "bg-red-500/20 border-red-400/50 text-red-100"
                  }`}
                >
                  {userAnswer[index] || "___"}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      {!isCorrect && (
        <div className="mt-4 bg-green-500/10 backdrop-blur-md border border-green-400/20 rounded-lg p-4">
          <p className="text-green-100">
            Correct answers: {question.answers.join(", ")}
          </p>
        </div>
      )}

      <div className="mt-4 text-sm">
        <span
          className={`font-medium ${isCorrect ? "text-green-300" : "text-red-300"}`}
        >
          {isCorrect ? "✓ All Correct" : "✗ Some Incorrect"}
        </span>
        {!isCorrect && (
          <span className="text-blue-200/70 ml-4">
            Your answers: {userAnswer.join(", ")}
          </span>
        )}
      </div>
    </div>
  );
}
