import React, { useState, useEffect } from "react";
import {
  Accordion,
  Card,
  ProgressBar,
  Button,
  Popover,
  OverlayTrigger,
  Spinner
} from "react-bootstrap";
import { Link } from "react-router-dom";
import storage from "../../../storage/ls";

export default function Tags() {
  let [sections, setSections] = useState({ tags: [] });
  let [syncing, setSyncing] = useState(false);
  let [synced, setSynced] = useState(false);

  useEffect(() => {
    storage.getTags().then(tags => {
      setSections(tags);
    });
  }, []);

  function sync() {
    setSyncing(true);
    storage.syncTags().then(res => {
      setSections(res);
      setSyncing(false);
      setSynced(true);
    });
  }

  return (
    <div>
      <Card bg="dark" text="white" style={{ margin: "10px 0px" }}>
        <Card.Header>
          <div className="flex-row-between-center">
            <h1>Sections</h1>
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
      <Accordion variant="dark" defaultActiveKey="0">
        {sections.tags.map((section, index) => (
          <Section
            sections={sections}
            section={section}
            key={"section-" + index}
            index={index}
          />
        ))}
      </Accordion>
    </div>
  );
}

function Section({ sections, section, index }) {
  return (
    <Card bg="dark" text="white">
      <Accordion.Toggle as={Card.Header} variant="link" eventKey={index}>
        {section.section}
      </Accordion.Toggle>
      <Accordion.Collapse eventKey={index}>
        <Card.Body style={{ width: "100%" }}>
          <Sections tags={section.tags} sections={sections} />
        </Card.Body>
      </Accordion.Collapse>
    </Card>
  );
}

function Sections({ tags, sections }) {
  return (
    <div className="tag-container">
      {tags.map((t, i) => (
        <Card key={"tag-" + t.id} bg="secondary" text="white">
          <Card.Header>{t.name}</Card.Header>
          <Card.Body>
            <Button
              as={Link}
              className="link-override"
              to={`/tag/${t.id}`}
              variant={setProgress(sections, t) === 100 ? "success" : "info"}
            >
              {setProgress(sections, t) === 100
                ? "Completed"
                : "View Questions"}
            </Button>
            <OverlayTrigger
              trigger="click"
              placement="top"
              overlay={popover(t.desc)}
            >
              <Button
                style={{ width: "35px", marginLeft: "5px" }}
                variant="warning"
              >
                i
              </Button>
            </OverlayTrigger>
            <ProgressBar
              animated
              variant={setProgress(sections, t) === 100 ? "success" : "info"}
              style={{ marginTop: "20px" }}
              now={setProgress(sections, t)}
            />
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}

function setProgress(sections, tag) {
  if (sections["tag-" + tag.id]) return sections["tag-" + tag.id];
  return 0;
}

function popover(desc) {
  return (
    <Popover id="popover-basic">
      <Popover.Title as="h3">Details</Popover.Title>
      <Popover.Content>{desc}</Popover.Content>
    </Popover>
  );
}
