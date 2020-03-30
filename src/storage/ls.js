import storage from "./idb";
import axios from "axios";

const ls = {
  getTags: async function() {
    let promise = new Promise((resolve, reject) => {
      storage.tags.get("tags", data => {
        if (typeof data !== "undefined" && data.data && data.data.tags) {
          resolve(data.data);
        } else {
          storage.user.get("userdata", userdata => {
            axios({
              method: "get",
              url: "https://api.irvinecode.net/api/v1/codequizTag",
              headers: {
                Authorization: `Bearer ${userdata.data.token}`
              }
            })
              .then(res => {
                console.log(res);
                let TAGS = res.data;
                let sections = [];
                TAGS.forEach(tag => {
                  let title = tag.name;
                  title = title
                    .split("")
                    .reverse()
                    .join();
                  let index = title.indexOf("-");
                  let section = tag.name.substring(0, tag.name.length - index);
                  let found = false;
                  sections.forEach(s => {
                    if (s.section === section) {
                      s.tags.push(tag);
                      found = true;
                    }
                  });
                  if (!found)
                    sections.push({
                      section: section,
                      tags: [tag]
                    });
                });
                if (typeof data !== "undefined" && data.data)
                  data.data.tags = sections;
                else
                  data = {
                    data: {
                      tags: sections
                    }
                  };
                storage.tags.put({ key: "tags", data: data.data });
                resolve(data.data);
              })
              .catch(err => {
                console.log(err);
              });
          });
        }
      });
    });

    let result = await promise;
    return result;
  },

  setTags: function(id) {
    let tagKey = "tag-" + id;
    storage.tag.get(tagKey, data => {
      let cnt = 0;
      let progress = 0;
      if (typeof data !== "undefined" && data.data) {
        Object.keys(data.data).forEach(t => {
          if (t !== "quizzes" && data.data[t]) cnt++;
        });
      }
      if (data.data.quizzes) progress = (cnt / data.data.quizzes.length) * 100;
      storage.tags.get("tags", data => {
        if (typeof data !== "undefined" && data.data) {
          data.data[tagKey] = progress;
          storage.tags.put({ key: "tags", data: data.data });
        } else
          storage.tags.put({ key: "tags", data: { ["tag-" + id]: progress } });
      });
    });
  },

  getTag: async function(tag) {
    let key = "tag-" + tag;
    let promise = new Promise((resolve, reject) => {
      storage.tag.get(key, data => {
        if (typeof data !== "undefined" && data.data && data.data.quizzes)
          resolve(data.data);
        else {
          storage.user.get("userdata", user => {
            axios({
              url: `https://api.irvinecode.net/api/v1/codequiz?tag=${tag}`,
              method: "get",
              headers: {
                Authorization: `Bearer ${user.data.token}`
              }
            })
              .then(res => {
                console.log(res);
                if (typeof data !== "undefined" && data.data)
                  data.data.quizzes = res.data;
                else
                  data = {
                    data: {
                      quizzes: res.data
                    }
                  };

                storage.tag.put({ key: key, data: data.data });

                resolve(data.data);
              })
              .catch(err => {});
          });
        }
      });
    });

    let result = await promise;

    return result;
  },

  setTag: function(tag, quiz, correct, total) {
    let id = tag;
    tag = "tag-" + tag;
    quiz = "quiz-" + quiz;

    storage.tag.get(tag, data => {
      if (typeof data !== "undefined" && data.data) {
        if (typeof data.data[quiz] !== "undefined" || !data.data[quiz])
          data.data[quiz] = correct === total;
        storage.tag.put({ key: tag, data: data.data });
        if (correct === total) this.setTags(id);
      } else {
        storage.tag.put({
          key: tag,
          data: {
            [quiz]: correct === total
          }
        });
        if (correct === total) this.setTags(id);
      }
    });
  },

  getQuiz: async function(quiz) {
    let id = quiz;
    quiz = "quiz-" + quiz;
    let promise = new Promise((resolve, reject) => {
      storage.quizzes.get(quiz, data => {
        if (typeof data !== "undefined" && data.data && data.data.question)
          resolve(data.data);
        else
          storage.user.get("userdata", userdata => {
            axios({
              url: `https://api.irvinecode.net/api/v1/codequiz/${id}`,
              method: "get",
              headers: {
                Authorization: `Bearer ${userdata.data.token}`
              }
            })
              .then(res => {
                console.log(res);
                if (typeof data !== "undefined") data.data.question = res.data;
                else
                  data = {
                    data: {
                      question: res.data
                    }
                  };
                storage.quizzes.put({ key: quiz, data: data.data });
                resolve(data.data);
              })
              .catch(err => {
                console.log(err);
              });
          });
      });
    });
    let result = await promise;
    return result;
  },

  submitQuiz: function(quiz, tag, correct, total, source, mode, question) {
    let id = quiz;
    quiz = "quiz-" + quiz;
    storage.quizzes.get(quiz, question => {
      if (typeof question === "undefined")
        question = {
          data: {}
        };

      if (
        typeof question.data.submission === "undefined" ||
        typeof question.data.submission[mode] === "undefined" ||
        question.data.submission[mode].correct < correct
      ) {
        storage.user.get("userdata", data => {
          let body = {
            user_id: data.uid,
            quiz_id: id,
            pt: correct,
            pt_outof: total,
            code: source,
            type: mode
          };
          axios({
            url: `https://api.irvinecode.net/api/v1/codequizrecords/me`,
            method: "post",
            headers: {
              Authorization: `Bearer ${data.data.token}`
            },
            data: body
          })
            .then(res => {
              console.log(res);
            })
            .catch(err => {});
        });
        if (question.data.submission)
          question.data.submission[mode] = { source, total, correct };
        else
          question.data.submission = {
            [mode]: { source, total, correct }
          };
        storage.quizzes.put({ key: quiz, data: question.data });
        this.setTag(tag, id, correct, total);
        this.addRecent(question.data, correct, total, mode);
        if (correct === total) this.setProgressToday();
      }
    });
  },

  getLastQuestion: async function() {
    let promise = new Promise((resolve, reject) => {
      storage.dashboard.get("last-question", data => {
        if (data && data.data) resolve(data.data);
        else resolve(undefined);
      });
    });
    let result = await promise;
    return result;
  },

  setLastQuestion: function(question) {
    storage.dashboard.put({ key: "last-question", data: question });
  },

  getRecent: async function() {
    let promise = new Promise((resolve, reject) => {
      storage.dashboard.get("recent-submissions", data => {
        if (data && data.data) resolve(data.data);
        else resolve(undefined);
      });
    });
    let result = await promise;
    return result;
  },

  addRecent: function(question, correct, total, mode) {
    storage.dashboard.get("recent-submissions", data => {
      let submission = {
        question,
        progress: (correct / total) * 100,
        time: new Date().toLocaleString(),
        mode
      };
      if (typeof data !== "undefined" && data.data && data.data.submissions) {
        data.data.submissions.unshift(submission);
        if (data.data.submissions.length > 10) data.pop();
      } else
        data = {
          data: {
            submissions: [submission]
          }
        };

      storage.dashboard.put({ key: "recent-submissions", data: data.data });
    });
  },

  getProgressToday: async function() {
    let d = new Date();
    let day = d.getDate();
    let month = d.getMonth();
    let year = d.getFullYear();
    let progress = {
      day,
      month,
      year,
      completed: 0
    };
    let promise = new Promise((resolve, reject) => {
      storage.dashboard.get("progress-today", data => {
        if (
          typeof data !== "undefined" &&
          data.data.day === day &&
          data.data.month === month &&
          data.data.year === year
        ) {
          resolve(data);
        } else {
          resolve(progress);
        }
      });
    });
    let result = await promise;
    return result;
  },

  setProgressToday: function() {
    let d = new Date();
    let day = d.getDate();
    let month = d.getMonth();
    let year = d.getFullYear();
    let progress = {
      day,
      month,
      year,
      completed: 1
    };
    storage.dashboard.get("progress-today", data => {
      if (
        typeof data !== "undefined" &&
        data.data.day === day &&
        data.data.month === month &&
        data.data.year === year
      ) {
        data.data.completed++;
        progress = { ...data.data };
      }
      storage.dashboard.put({ key: "progress-today", data: progress });
    });
  },

  syncTags: async function() {
    let promise = new Promise((resolve, reject) => {
      storage.tags.get("tags", data => {
        storage.user.get("userdata", userdata => {
          axios({
            method: "get",
            url: "https://api.irvinecode.net/api/v1/codequizTag",
            headers: {
              Authorization: `Bearer ${userdata.data.token}`
            }
          })
            .then(res => {
              console.log(res);
              let TAGS = res.data;
              let sections = [];
              TAGS.forEach(tag => {
                let title = tag.name;
                title = title
                  .split("")
                  .reverse()
                  .join();
                let index = title.indexOf("-");
                let section = tag.name.substring(0, tag.name.length - index);
                let found = false;
                sections.forEach(s => {
                  if (s.section === section) {
                    s.tags.push(tag);
                    found = true;
                  }
                });
                if (!found)
                  sections.push({
                    section: section,
                    tags: [tag]
                  });
              });
              if (typeof data !== undefined && data.data)
                data.data["tags"] = sections;
              else
                data = {
                  data: {
                    tags: sections
                  }
                };
              storage.tags.put({ key: "tags", data: data.data });
              resolve(data.data);
            })
            .catch(err => {
              console.log(err);
            });
        });
      });
    });
    let result = await promise;
    return result;
  },

  syncQuestions: async function(tag) {
    let key = "tag-" + tag;
    let promise = new Promise((resolve, reject) => {
      storage.tag.get(key, data => {
        storage.user.get("userdata", userdata => {
          axios({
            url: `https://api.irvinecode.net/api/v1/codequiz?tag=${tag}`,
            method: "get",
            headers: {
              Authorization: `Bearer ${userdata.data.token}`
            }
          })
            .then(res => {
              console.log(res);
              if (typeof data !== undefined && data.data) {
                data.data.quizzes = res.data;
              } else
                data = {
                  data: {
                    quizzes: res.data
                  }
                };
              storage.tag.put({ key: key, data: data.data });
              resolve(data.data);
            })
            .catch(err => {});
        });
      });
    });

    let result = await promise;

    return result;
  },

  syncQuestion: async function(question) {
    let key = "quiz-" + question;
    let promise = new Promise((resolve, reject) => {
      storage.quizzes.get(key, data => {
        storage.user.get("userdata", userdata => {
          axios({
            url: `https://api.irvinecode.net/api/v1/codequiz/${question}`,
            method: "get",
            headers: {
              Authorization: `Bearer ${userdata.data.token}`
            }
          })
            .then(res => {
              console.log(res);
              if (typeof data !== "undefined" && data.data) {
                data.data.question = res.data;
              } else
                data = {
                  data: {
                    question: res.data
                  }
                };
              storage.quizzes.put({ key: key, data: data.data });
              resolve(data.data);
            })
            .catch(err => {});
        });
      });
    });
    let result = await promise;
    return result;
  }
};

export default ls;
