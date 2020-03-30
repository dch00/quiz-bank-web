import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import storage from "../../../storage/ls";
import { Card, Button, Spinner } from "react-bootstrap";

export default function Questions({ match }) {
  let [questions, setQuestions] = useState({ quizzes: [] });
  let [syncing, setSyncing] = useState(false);
  let [synced, setSynced] = useState(false);

  useEffect(() => {
    setSyncing(true);
    storage.getTag(match.params.id).then(data => {
      setQuestions(data);
      setSyncing(false);
    });
  }, []);

  function sync() {
    setSyncing(true);
    storage.syncQuestions(match.params.id).then(res => {
      setQuestions(res);
      setSyncing(false);
      setSynced(true);
    });
  }

  return (
    <div>
      <Card bg="dark" text="white" style={{ margin: "0.5%" }}>
        <Card.Header>
          <div className="flex-row-between-center">
            <h1>Questions</h1>
            <Button
              variant={synced ? "success" : "primary"}
              onClick={() => sync()}
              style={{ minWidth: "100px" }}
            >
              {syncing ? (
                <Spinner animation="border" variant="light" />
              ) : synced ? (
                "Synced"
              ) : (
                "Sync"
              )}
            </Button>
          </div>
        </Card.Header>
      </Card>
      <div className="quiz-container">
        {questions.quizzes.map((q, i) => (
          <Question
            question={q}
            key={i}
            progress={questions}
            tag={match.params.id}
          />
        ))}
      </div>
    </div>
  );
}

function Question({ question, progress, tag }) {
  return (
    <Card bg="dark" key={question.id} text="white">
      <Card.Header>{question.name}</Card.Header>
      <Card.Body>
        <Button
          variant={checkProgress(progress, question.id)}
          as={Link}
          to={`/tag/${tag}/${question.id}`}
        >
          {checkProgress(progress, question.id, true)}
        </Button>
      </Card.Body>
    </Card>
  );
}

function checkProgress(progress, id, text) {
  let p = progress["quiz-" + id];
  if (typeof p === "undefined" && text) return "View Question";
  if (typeof p === "undefined") return "secondary";

  if (text) {
    if (p) return "Completed";
    else return "In Progress";
  }
  if (p) return "success";
  else return "warning";
}
