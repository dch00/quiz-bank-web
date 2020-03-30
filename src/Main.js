import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Navigator from "./layout/navigator/Navigator";
import Questions from "./layout/pages/questions/Questions";
import Tags from "./layout/pages/tags/Tags";
import Question from "./layout/pages/question/Question";
import Login from "./layout/pages/login/Login";
import Dashboard from "./layout/pages/dashboard/Dashboard";
import storage from "./storage/idb";

export default function Main() {
  let [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    storage.user.get("userdata", data => {
      if (data && data.data.token) setLoggedIn(true);
    });
  }, []);

  return (
    <Router>
      <div className="main">
        <Navigator loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
        {!loggedIn && <Login setLoggedIn={setLoggedIn} />}
        {loggedIn && (
          <div className="page-container">
            <Switch>
              <Route exact path={"/"} component={Dashboard} />
              <Route path="/tags" component={Tags} />
              <Route exact path={`/tag/:id`} component={Questions} />
              <Route exact path={`/tag/:tag/:id`} component={Question} />
            </Switch>
          </div>
        )}
      </div>
    </Router>
  );
}
