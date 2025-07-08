import { useState, useEffect } from "react";
import { useUser } from "../UserContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function History() {
  const { selectedUser } = useUser();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQuizzes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:3000/get-quizzes?username=${encodeURIComponent(selectedUser)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        setQuizzes(data.quizzes);
      } else {
        setError("Failed to fetch quizzes");
      }
    } catch (err) {
      console.error("Error fetching quizzes:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [selectedUser]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleQuizClick = (quiz) => {
    navigate(`/quiz-view?quizId=${quiz.quiz_id}`);
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full px-4">
      <div className="max-w-2xl w-full">
        <div className="grid grid-rows-[3rem_1fr] min-h-screen gap-6 py-4">
          {/* Navbar */}
          <div className="pt-1">
            <Navbar />
          </div>

          {/* Main Content */}
          <div className="flex flex-col">
            <div className="bg-yellow-500/10 backdrop-blur-md border border-yellow-400/20 rounded-2xl p-6">
              <h1 className="text-2xl font-bold text-yellow-100 mb-6 text-center">
                Quiz History - {selectedUser === "T" ? "Tejveer" : "Sehaj"}
              </h1>

              {loading && (
                <div className="text-center text-yellow-200/80">
                  Loading quizzes...
                </div>
              )}

              {error && (
                <div className="text-center text-red-300 bg-red-500/10 border border-red-400/20 rounded-lg p-4">
                  {error}
                </div>
              )}

              {!loading && !error && quizzes.length === 0 && (
                <div className="text-center text-yellow-200/60">
                  No quizzes found for this user.
                </div>
              )}

              {!loading && !error && quizzes.length > 0 && (
                <div className="space-y-3">
                  {quizzes.map((quiz) => (
                    <div
                      key={quiz.quiz_id}
                      onClick={() => handleQuizClick(quiz)}
                      className="bg-blue-500/10 backdrop-blur-md border border-blue-400/20 rounded-lg p-4 cursor-pointer hover:bg-blue-500/15 hover:border-blue-400/30 transition-all duration-200"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="text-blue-100 font-medium">
                            {quiz.page_name}
                          </div>
                          <div className="text-blue-200/70 text-sm capitalize">
                            {quiz.quiz_type === "mc"
                              ? "Multiple Choice"
                              : quiz.quiz_type === "tf"
                                ? "True/False"
                                : quiz.quiz_type === "fib"
                                  ? "Fill in the Blank"
                                  : quiz.quiz_type}
                          </div>
                        </div>
                        <div className="text-blue-200/80 text-sm">
                          {formatDate(quiz.attempt_date)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
