import React, { useState, useEffect } from "react";
import storage from "../../../storage/ls";
import idb from "../../../storage/idb";
import { Card, Button, ProgressBar } from "react-bootstrap";
import { Link } from "react-router-dom";
import SimpleMDE from "react-simplemde-editor";

export default function Dashboard() {
  let [user, setUser] = useState({ name: "" });
  let [last, setLast] = useState(undefined);
  let [recent, setRecent] = useState(undefined);
  let [progress, setProgress] = useState({ completed: 0 });

  useEffect(() => {
    idb.user.get("userdata", data => {
      if (typeof data !== "undefined" && data.data) {
        storage.getLastQuestion().then(res => {
          storage.getRecent().then(res => {
            if (typeof res !== "undefined") setRecent(res);
            storage.getProgressToday().then(res => {
              if (typeof res !== "undefined") setProgress(res.data);
            });
          });
          if (typeof res !== "undefined") setLast(res);
        });
        setUser(data.data);
      }
    });
  }, []);

  return (
    <div>
      <Card bg="dark" text="white" style={{ width: "100%" }}>
        <Card.Header>
          <h1>Hello, {user.name}!</h1>
        </Card.Header>
      </Card>
      <Progress progress={progress} />
      <div style={{ width: "100%", display: "flex" }}>
        <div style={container}>
          {recent && recent.submissions.length > 0 && (
            <RecentSubmissions recent={recent} />
          )}
        </div>
        {last && <LastQuestion question={last} />}
      </div>
    </div>
  );
}

function Progress({ progress }) {
  let text =
    typeof progress === "undefined" || progress.completed === 0
      ? "You have not completed any questions today. Click questions to get started!"
      : progress.completed === 1
      ? "You've completed 1 question so far. Keep it up!"
      : "You've completed " +
        progress.completed +
        " questions today. Great job!";

  return (
    <Card bg="dark" text="white" style={{ width: "100%", marginTop: "10px" }}>
      <Card.Header>Today's Progress</Card.Header>
      <Card.Body>
        <Card.Text>{text}</Card.Text>
      </Card.Body>
    </Card>
  );
}

function RecentSubmissions({ recent }) {
  return (
    <Card bg="dark" text="white" style={{ width: "100%" }}>
      <Card.Header>Recent Submissions</Card.Header>
      <Card.Body>
        {recent.submissions.map((s, i) => (
          <Submission submission={s} key={"recent-" + i} />
        ))}
      </Card.Body>
    </Card>
  );
}

function Submission({ submission }) {
  function check(progress) {
    if (progress === 100) return "success";
    else return "warning";
  }

  let btnText = submission.progress === 100 ? "Completed" : "Continue";
  let title =
    "[" +
    submission.mode +
    "] " +
    submission.question.question.name +
    (submission.time ? " @ " + submission.time : "");
  return (
    <Card
      bg="dark"
      border={check(submission.progress)}
      style={{ marginTop: "10px" }}
    >
      <Card.Header>{title}</Card.Header>
      <Card.Body>
        <Button
          as={Link}
          to={`/tag/${submission.question.question.tag}/${
            submission.question.question.id
          }`}
          style={{ marginBottom: "10px" }}
          variant={check(submission.progress)}
        >
          {btnText}
        </Button>
        <ProgressBar variant="info" animated now={submission.progress} />
      </Card.Body>
    </Card>
  );
}

function LastQuestion({ question }) {
  let previewOnLoad = instance => {
    instance.togglePreview();
  };
  return (
    <div style={container}>
      <Card bg="dark" text="white" style={{ width: "100%" }}>
        <Card.Header>Last Viewed Question</Card.Header>
        <Card.Body>
          <Card.Text>{question.name}</Card.Text>
          <SimpleMDE
            getMdeInstance={previewOnLoad}
            value={question.text}
            options={{
              lineWrapping: false,
              spellChecker: false,
              toolbar: false,
              status: false
            }}
            style={promptStyle}
          />
          <Button
            as={Link}
            to={`/tag/${question.tag}/${question.id}`}
            variant="info"
          >
            Resume
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
}

const container = {
  display: "flex",
  width: "50%",
  justifyContent: "center",
  alignItems: "flex-start",
  marginTop: "10px"
};

const promptStyle = {
  width: "100%",
  borderRadius: "10px",
  marginBottom: "10px",
  backgroundColor: "lightskyblue"
};
