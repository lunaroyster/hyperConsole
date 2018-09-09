let librariesFetchPromise;
async function fetchLibraries() {
  let response = await window.fetch('https://api.cdnjs.com/libraries');
  let { results } = await response.json();
  return results;
}
async function getLibraries() {
  if(!librariesFetchPromise) librariesFetchPromise = fetchLibraries();
  return await librariesFetchPromise;
}
async function loadLibraryByURL(url) {
  let newScript = document.createElement('script');
  newScript.src = url;
  document.head.appendChild(newScript);
}
async function loadLibraryByName(name) {
  let libraries = await getLibraries();
  let library = libraries.find(lib => lib.name === name);
  loadLibraryByURL(library.latest);
  console.log(`%cLoaded ${name}`, "font-style: italic");
}


let SuperSecretNamespace = {};
//SRC: https://stackoverflow.com/a/8618519
function whenAvailable(name, callback) {
    let interval = 10; // ms
    window.setTimeout(function() {
      if (window[name]) return callback(window[name]);
      window.setTimeout(arguments.callee, interval);
    }, interval);
}
async function loadSecretly(name, identifier) {
  await loadLibraryByName(name);
  let loadPromise = new Promise((resolve, reject)=> {
    whenAvailable(identifier, ()=> {
      SuperSecretNamespace[identifier] = window[identifier];
      delete window[identifier];
      resolve();
    });
  });
  return loadPromise;
}
async function main() {
  let libraries = await getLibraries();
  await loadSecretly('fuse.js', 'Fuse');
  let { Fuse } = SuperSecretNamespace;
  let fuse = new Fuse(libraries, {
    shouldSort: true,
    threshold: 0.6,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: [
      "name",
    ]
  });
  let searchBox = document.getElementById('search');
  let resultsList = document.getElementById('results');
  searchBox.onkeyup = e => {
    resultsList.innerHTML = '';
    let searchResults = fuse.search(searchBox.value).slice(0,20);
    searchResults.forEach(result=> {
      let res = document.createElement('li');
      res.innerText = result.name;
      res.onclick = e => {
        loadLibraryByName(res.innerText)
      }
      resultsList.appendChild(res);
    })
  }
}
main();