import React from "react";
import { Navbar, Nav } from "react-bootstrap";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import storage from "../../storage/idb";

export default function Navigator({ loggedIn, setLoggedIn }) {
  function logout() {
    storage.user.delete("userdata").then(res => {
      setLoggedIn(false);
    });
  }
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="navigator">
      <Navbar.Brand as={Link} to="/">
        <img className="logo" alt="logo" src={logo} />
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">
          <Nav.Link as={Link} to="/">
            Dashboard
          </Nav.Link>
          <Nav.Link as={Link} to="/tags">
            Questions
          </Nav.Link>
        </Nav>
        {loggedIn && (
          <Nav.Link className="link-override" onClick={() => logout()}>
            Logout
          </Nav.Link>
        )}
      </Navbar.Collapse>
    </Navbar>
  );
}
