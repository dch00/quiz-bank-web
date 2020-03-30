import Dexie from "dexie";

const storage = new Dexie("QuizPortal");
storage.version(1).stores({
  quizzes: "key",
  tag: "key",
  tags: "key",
  user: "key",
  dashboard: "key"
});

export default storage;
