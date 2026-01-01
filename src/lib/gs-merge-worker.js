function loadScript() {
  import("./gs-worker.js");
}

var Module;

function _GSMergePDFs(dataStruct, responseCallback) {
  const { files, compress } = dataStruct;
  
  Promise.all(
    files.map((fileUrl) =>
      fetch(fileUrl)
        .then((res) => res.arrayBuffer())
        .then((buf) => {
          self.URL.revokeObjectURL(fileUrl);
          return new Uint8Array(buf);
        })
    )
  ).then((fileDataArray) => {
    const inputFilenames = fileDataArray.map((_, i) => `input_${i}.pdf`);

    var pdfSettings = compress ? "/ebook" : "/default";

    Module = {
      preRun: [
        function () {
          fileDataArray.forEach((data, i) => {
            self.Module.FS.writeFile(inputFilenames[i], data);
          });
        },
      ],
      postRun: [
        function () {
          var uarray = self.Module.FS.readFile("output.pdf", {
            encoding: "binary",
          });
          var blob = new Blob([uarray], { type: "application/octet-stream" });
          var pdfDataURL = self.URL.createObjectURL(blob);
          responseCallback({ pdfDataURL });
        },
      ],
      arguments: [
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        "-dPDFSETTINGS=" + pdfSettings,
        "-DNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        "-sOutputFile=output.pdf",
        ...inputFilenames,
      ],
      print: function (text) {},
      printErr: function (text) {},
      totalDependencies: 0,
      noExitRuntime: 1,
    };

    if (!self.Module) {
      self.Module = Module;
      loadScript();
    } else {
      self.Module["calledRun"] = false;
      self.Module["postRun"] = Module.postRun;
      self.Module["preRun"] = Module.preRun;
      self.Module["arguments"] = Module.arguments;
      self.Module.callMain(Module.arguments);
    }
  });
}

self.addEventListener("message", function ({ data: e }) {
  if (e.target !== "merge") {
    return;
  }
  _GSMergePDFs(e.data, ({ pdfDataURL }) => self.postMessage(pdfDataURL));
});
