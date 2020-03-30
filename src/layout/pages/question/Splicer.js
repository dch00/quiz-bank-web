const Splicer = {
  stripHidden: function(source, language, web) {
    if (source === null || typeof source === "undefined") return "";
    if (web && language === "java") {
      source = source.replace("class Solution", "class Main");
    }

    let index = Math.max(
      source.indexOf("/*HIDDEN*/"),
      source.indexOf("/* HIDDEN */")
    );
    if (language === "java" && index !== -1)
      return source.substring(0, index) + "\n}";
    index = Math.max(source.indexOf("# hidden"), source.indexOf("#hidden"));
    if (language === "python" && index !== -1)
      return source.substring(0, index) + "main()";
    return "";
  },

  compile: function(code, original, language, web) {
    if (code === null || typeof code === "undefined") return "";
    if (original === null || typeof original === "undefined") return "";
    let index = Math.max(
      original.indexOf("/*HIDDEN*/"),
      original.indexOf("/* HIDDEN */")
    );
    if (web && language === "java") {
      code = code.replace("class Solution", "class Main");
    }
    if (language === "java" && index !== -1) {
      let ret = code.substring(0, code.length - 1);
      ret += original.substring(index);
      ret = ret.replace("main(String[] args)", "main3(String[] args)");
      ret = ret.replace("main2(String[] args)", "main(String[] args)");
      return ret;
    }
    index = Math.max(original.indexOf("# hidden"), original.indexOf("#hidden"));
    if (language === "python" && original.indexOf("# hidden") !== -1) {
      let ret = code.replace("def main()", "def main3()");
      ret = ret.replace("main()", "");
      ret += original.substring(index);
      return ret;
    }
    return "";
  }
};

export { Splicer };
