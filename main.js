let SuperSecretNamespace = {};
//SRC: https://stackoverflow.com/a/8618519
function whenAvailable(name, callback) {
    let interval = 10; // ms
    window.setTimeout(function() {
      if (window[name]) return callback(window[name]);
      window.setTimeout(arguments.callee, interval);
    }, interval);
}

SuperSecretNamespace.vm = new Vue({
  el: '#root',
  data() {
    return {
      search: '',
      results: [],
      fuse: null,
      librariesFetchPromise: null,
      loadedLibraries: [],
    };
  },
  async mounted() {
    let libraries = await this.getLibraries();
    await this.hide('Fuse');
    await this.hide('Vue');
    let { Fuse } = SuperSecretNamespace;
    this.fuse = new Fuse(libraries, {
      shouldSort: true,
      threshold: 0.6,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ["name"]
    });
  },
  methods: {
    async hide(identifier) {
      let loadPromise = new Promise((resolve, reject)=> {
        whenAvailable(identifier, ()=> {
          SuperSecretNamespace[identifier] = window[identifier];
          delete window[identifier];
          resolve();
        });
      });
      return loadPromise;
    },
    async fetchLibraries() {
      let response = await window.fetch('https://api.cdnjs.com/libraries?fields=version,description');
      let { results } = await response.json();
      return results;
    },
    async getLibraries() {
      if(!this.librariesFetchPromise) this.librariesFetchPromise = this.fetchLibraries();
      return await this.librariesFetchPromise;
    },
    async loadLibraryByURL(url) {
      let newScript = document.createElement('script');
      newScript.src = url;
      document.head.appendChild(newScript);
    },
    async loadLibraryByName(name) {
      let libraries = await this.getLibraries();
      let library = libraries.find(lib => lib.name === name);
      await this.loadLibraryByURL(library.latest);
      this.loadedLibraries.push(library);
      console.log(`%cLoaded ${name}`, "font-style: italic");
    },
    async loadLibrary(library) {
      await this.loadLibraryByName(library.name);
      this.search = '';
    },
    async launchBlankPage(libraries) {
      let page = this.pageWithLibraries(libraries);
      this.launchWebpage(page);
    },
    pageWithLibraries(libraries) {
      let scripts = libraries.map(lib=>`<script src="${lib.latest}"></script>`).join('\n');
      let names = libraries.map(lib=>`<div>${lib.name}</div>`).join('\n');
      return `
      <html>
        <head>
          ${scripts}
        </head>
        <body>
          The following scripts are loaded, and accessible from the console: 
          ${names}
        </body>
      </html>
      `;
    },
    async launchWebpage(html) {
      let blob = new window.Blob([html], {type: 'text/html'});
      let url = window.URL.createObjectURL(blob);
      window.open(url);
    },
    open(type) {
      if(type=='github') window.open('https://github.com/lunaroyster/console');
      if(type=='twitter') window.open('https://twitter.com/itsarnavb/');
    },
    refresh() {
      document.location.reload();
    },
  },
  computed: {
    resultsMode() {
      return (this.results.length > 0) || (this.loadedLibraries.length > 0);
    },
  },
  watch: {
    search(newTerm, oldTerm) {
      this.results = this.fuse.search(newTerm).slice(0, 20);
    },
  },
});