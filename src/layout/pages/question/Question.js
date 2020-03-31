import React, { useState, useEffect } from "react";
import storage from "../../../storage/ls";
import { Link } from "react-router-dom";
import { Splicer } from "./Splicer";
import { Button, ButtonGroup, ProgressBar, Spinner } from "react-bootstrap";
import SimpleMDE from "react-simplemde-editor";
import AceEditor from "react-ace";
import axios from "axios";
import "easymde/dist/easymde.min.css";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/theme-tomorrow_night";

const LANGUAGES = ["python", "java"];
const LIDs = [71, 62];
const QUESTION = {
  text: "",
  java: "",
  python: ""
};

export default function Question({ match }) {
  let [question, setQuestion] = useState(QUESTION);
  let [prompt, setPrompt] = useState("");
  let [source, setSource] = useState("");
  let [output, setOutput] = useState("");
  let [mode, setMode] = useState("java");
  let [progress, setProgress] = useState(0);
  let [syncing, setSyncing] = useState(false);
  let [synced, setSynced] = useState(false);
  let [testing, setTesting] = useState(false);
  let [submitting, setSubmitting] = useState(false);

  async function test(submit) {
    if (submit) setSubmitting(true);
    else setTesting(true);
    let input = Splicer.compile(source, question[mode], mode, true);

    if (input === "") {
      setOutput("Question needs to be updated.");
      return;
    }

    let data = {
      source_code: submit ? input : source,
      language_id: LIDs[LANGUAGES.indexOf(mode)]
    };

    axios({
      method: "post",
      url:
        "https://api.judge0.com/submissions/?base64_encoded=false&wait=false",
      headers: {
        "Content-Type": "application/json"
      },
      data
    })
      .then(res => {
        trackSubmission(res.data.token, submit);
      })
      .catch(err => {
        console.log(err);
      });

    function trackSubmission(token, submit) {
      setTimeout(() => {
        axios.get(`https://api.judge0.com/submissions/${token}`).then(res => {
          if (res.data.status.id <= 2) trackSubmission(token, submit);
          else if (res.data.stdout) {
            setOutput(res.data.stdout);
            if (submit) progressCheck(res.data.stdout, submit);
          } else if (res.data.stderr) setOutput(res.data.stderr);
          else if (res.data.compile_output) setOutput(res.data.compile_output);
        });
      }, 500);
    }
  }

  function progressCheck(output, submit) {
    let ar = output.split("\n");
    let total = parseInt(ar[0], 0);
    let correct = parseInt(ar[1], 0);
    setProgress((correct / total) * 100);
    if ((correct / total) * 100 === 100) setOutput("All correct!");
    else setOutput(output);
    if (correct > 0)
      storage.submitQuiz(
        match.params.id,
        match.params.tag,
        correct,
        total,
        source,
        mode,
        question
      );
    if (submit) setSubmitting(false);
    else setTesting(false);
  }

  function reset() {
    setSource(Splicer.stripHidden(question[mode], mode));
  }

  function sync() {
    setSyncing(true);
    storage.syncQuestion(match.params.id).then(res => {
      setQuestion(res.question);
      setPrompt(res.question.text);
      if (res.submission && res.submission[mode]) {
        setSource(res.submission[mode].source);
        setProgress(
          (res.submission[mode].correct / res.submission[mode].total) * 100
        );
      } else {
        setSource(Splicer.stripHidden(res.question[mode], mode));
      }
      setSyncing(false);
      setSynced(true);
    });
  }

  useEffect(() => {
    storage.getQuiz(match.params.id).then(res => {
      storage.setLastQuestion(res.question);
      setQuestion(res.question);
      setPrompt(res.question.text);
      if (res.submission && res.submission[mode]) {
        setSource(res.submission[mode].source);
        setProgress(
          (res.submission[mode].correct / res.submission[mode].total) * 100
        );
      } else setSource(Splicer.stripHidden(res.question[mode], mode, true));
    });
  }, []);

  useEffect(() => {
    storage.getQuiz(match.params.id).then(res => {
      if (res.submission && res.submission[mode]) {
        setSource(res.submission[mode].source);
        setProgress(
          (res.submission[mode].correct / res.submission[mode].total) * 100
        );
      } else setSource(Splicer.stripHidden(res.question[mode], mode, true));
    });
  }, [mode]);

  return (
    <div className="flex-column center">
      <div style={{ display: "flex", width: "100%" }}>
        <div className="flex-row-between-center">
          <Button
            as={Link}
            to={`/tag/${match.params.tag}`}
            style={{ minWidth: "100px" }}
            variant="info"
          >
            Back
          </Button>
          <Button
            variant={synced ? "success" : "primary"}
            onClick={() => sync()}
            style={{ minWidth: "100px", marginLeft: "5px" }}
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
        <ModeSelector
          mode={mode}
          setMode={setMode}
          tag={match.params.tag}
          sync={sync}
        />
      </div>
      <Prompt prompt={prompt} />
      <CodeEditor source={source} setSource={setSource} mode={mode} />
      <div className="btn-container-1">
        <div>
          <ProgressBar
            animated
            variant={progress === 100 ? "success" : "info"}
            now={progress}
          />
        </div>
        <div>
          <Button variant="info" onClick={() => test(false)}>
            {testing ? <Spinner animation="border" variant="light" /> : "test"}
          </Button>
          <Button variant="info" onClick={() => test(true)}>
            {submitting ? (
              <Spinner animation="border" variant="light" />
            ) : (
              "submit"
            )}
          </Button>
          <Button variant="danger" onClick={() => reset()}>
            Reset
          </Button>
        </div>
      </div>
      <Output output={output} />
    </div>
  );
}

function ModeSelector({ mode, setMode, tag, sync }) {
  return (
    <div style={topContainer}>
      <ButtonGroup style={{ width: "25%" }}>
        {LANGUAGES.map(l => (
          <Button
            variant="info"
            active={l === mode}
            onClick={() => setMode(l)}
            key={l}
          >
            {l}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  );
}

function Prompt({ prompt }) {
  let previewOnLoad = instance => {
    instance.togglePreview();
  };
  return (
    <SimpleMDE
      getMdeInstance={previewOnLoad}
      value={prompt}
      options={{
        lineWrapping: false,
        spellChecker: false,
        toolbar: false,
        status: false
      }}
      style={promptStyle}
    />
  );
}

function CodeEditor({ source, setSource }) {
  return (
    <AceEditor
      mode="python"
      theme="tomorrow_night"
      value={source}
      onChange={value => setSource(value)}
      fontSize="18px"
      name="code"
      showPrintMargin={false}
      editorProps={{ $blockScrolling: true }}
      style={codeStyle}
    />
  );
}

function Output({ output }) {
  return (
    <AceEditor
      mode="python"
      theme="tomorrow_night"
      value={output}
      fontSize="18px"
      name="output"
      showPrintMargin={false}
      editorProps={{ $blockScrolling: true }}
      style={outputStyle}
      maxLines={Infinity}
    />
  );
}

const codeStyle = {
  width: "100%",
  height: "600px",
  borderRadius: "5px 5px 10px 10px",
  margin: "0px 5px 5px 5px"
};

const promptStyle = {
  width: "100%",
  margin: "5px 5px 0px 5px",
  borderRadius: "10px 10px 5px 5px",
  backgroundColor: "lightskyblue"
};

const outputStyle = {
  width: "100%",
  margin: "5px",
  borderRadius: "10px",
  minHeight: "50px"
};

const topContainer = {
  display: "flex",
  width: "100%",
  justifyContent: "flex-end"
};
