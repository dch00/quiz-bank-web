import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import storage from "../../../storage/idb";
import axios from "axios";

export default function Login({ setLoggedIn }) {
  let [username, setUsername] = useState("");
  let [password, setPassword] = useState("");
  let [attempt, setAttempt] = useState(false);

  async function login(ev) {
    ev.preventDefault();
    await axios({
      url: "https://api.irvinecode.net/api/v1/users/signin",
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      data: {
        username,
        password
      }
    })
      .then(res => {
        storage.user
          .put({
            key: "userdata",
            data: {
              token: res.data.token.token,
              name: res.data.name,
              uid: res.data.uid
            }
          })
          .then(res => {
            setLoggedIn(true);
          });
      })
      .catch(err => {
        setAttempt(true);
      });
  }

  return (
    <Form className="login-container">
      <Form.Group controlId="formGroupEmail">
        <Form.Label>Username</Form.Label>
        <Form.Control
          type="text"
          value={username}
          onChange={ev => setUsername(ev.target.value)}
        />
      </Form.Group>
      <Form.Group controlId="formGroupPassword">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          value={password}
          onChange={ev => setPassword(ev.target.value)}
        />
      </Form.Group>
      <Button
        variant={attempt ? "warning" : "primary"}
        type="submit"
        onClick={ev => login(ev)}
      >
        {attempt ? "Try Again" : "Login"}
      </Button>
    </Form>
  );
}
